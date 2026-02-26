import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import { Platform } from 'react-native';

// Feature flag — set EXPO_PUBLIC_ELEVENLABS_API_KEY in .env to enable
export const VOICE_AGENT_ENABLED = Boolean(
  (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined)?.trim()
);

// Per-persona voice ID mapping
// River     — relaxed, neutral, American → Ora / aura (floating agent)
// Lily      — velvety, expressive        → Sage
// Jen       — soothing, gentle           → Dr. Avery
export const PERSONA_VOICE_MAP: Record<string, string> = {
  'persona-ora': 'SAz9YHcvj6GT2YYXdXww',   // River — relaxed, neutral
  'persona-genz': 'pFZP5JQG7iQjIQuC4Bku',  // Lily
  'persona-psychotherapist': 'BL7YSL1bAkmW8U0JnU8o', // Jen
  aura: 'SAz9YHcvj6GT2YYXdXww',            // River — relaxed, neutral
};

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

class ElevenLabsService {
  private currentSound: Sound | null = null;
  private currentWebAudio: HTMLAudioElement | null = null;
  private _isActive = false;
  private _isBlocked = false;
  /** Stored so stop() can remove it if we're waiting for a user gesture */
  private pendingUnlock: (() => void) | null = null;
  /** Timer ID for the autoplay-retry delay */
  private pendingUnlockTimer: ReturnType<typeof setTimeout> | null = null;
  /** Lets stop() resolve the playWeb() promise so callers don't hang */
  private resolveCurrentPlayback: (() => void) | null = null;
  /** Lets stop() resolve the playNative() promise so callers don't hang */
  private resolveCurrentNativePlayback: (() => void) | null = null;
  /** Active stream reader — cancelled by stop() to abort mid-stream */
  private currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  /** Subscriptions for blocked state changes */
  private blockedListeners: ((blocked: boolean) => void)[] = [];
  /** TTS queue for streaming batch playback */
  private speakQueue: string[] = [];
  private queueVoiceId = '';
  private queueRunning = false;
  /** Incremented on every stop() so stale drainQueue() calls can detect they're outdated */
  private drainGeneration = 0;
  private idleListeners: (() => void)[] = [];

  private setBlocked(blocked: boolean) {
    this._isBlocked = blocked;
    this.blockedListeners.forEach((l) => l(blocked));
  }

  get isBlocked(): boolean {
    return this._isBlocked;
  }

  /** Subscribe to blocked state changes. Returns an unsubscribe function. */
  onBlockedChange(listener: (blocked: boolean) => void): () => void {
    this.blockedListeners.push(listener);
    return () => {
      this.blockedListeners = this.blockedListeners.filter((l) => l !== listener);
    };
  }

  /** Subscribe to queue-idle (queue drained) events. Returns an unsubscribe function. */
  onIdle(listener: () => void): () => void {
    this.idleListeners.push(listener);
    return () => {
      this.idleListeners = this.idleListeners.filter((l) => l !== listener);
    };
  }

  private notifyIdle(): void {
    this.idleListeners.forEach((l) => l());
  }

  private apiKey(): string | undefined {
    return (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined)?.trim() || undefined;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Convert *action text* → [action text] for eleven_v3 native expression rendering.
   * The model will render sighs, breaths, laughs etc. natively from bracket notation.
   */
  private cleanForTTS(text: string): string {
    return text
      .replace(/\*([^*]+)\*/g, '[$1]') // *takes a breath* → [takes a breath]
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  async speak(text: string, voiceId: string): Promise<void> {
    const key = this.apiKey();
    if (!key) {
      console.log('[ElevenLabsService] speak() skipped — no API key');
      return;
    }
    this.speakQueue = []; // clear any pending queue
    const cleaned = this.cleanForTTS(text);
    console.log('[ElevenLabsService] speak() start | voiceId:', voiceId);
    await this.stop();
    this._isActive = true;
    try {
      await this.fetchAndPlay(cleaned, voiceId, key);
      this._isActive = false;
      console.log('[ElevenLabsService] speak() done');
    } catch (err) {
      this._isActive = false;
      console.error('[ElevenLabsService] speak() error:', err);
    }
  }

  private async fetchAndPlay(text: string, voiceId: string, key: string): Promise<void> {
    const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_v3', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!response.ok) { console.warn('[ElevenLabsService] TTS failed:', response.status); return; }
    if (Platform.OS === 'web') await this.playWebStream(response);
    else await this.playNative(response);
  }

  async queueSpeak(text: string, voiceId: string): Promise<void> {
    const key = this.apiKey();
    if (!key) return;
    const cleaned = this.cleanForTTS(text);
    if (!cleaned) return;
    this.speakQueue.push(cleaned);
    this.queueVoiceId = voiceId;
    if (!this.queueRunning) {
      this._isActive = true;
      this.queueRunning = true;
      const gen = this.drainGeneration;
      this.drainQueue(key, gen).catch((err) => console.error('[ElevenLabsService] drainQueue error:', err));
    }
  }

  private async drainQueue(key: string, gen: number): Promise<void> {
    try {
      while (this.speakQueue.length > 0 && this._isActive && gen === this.drainGeneration) {
        const text = this.speakQueue.shift()!;
        await this.fetchAndPlay(text, this.queueVoiceId, key);
      }
    } finally {
      // Only update shared state if this drain is still the current generation
      if (gen === this.drainGeneration) {
        this.queueRunning = false;
        if (this.speakQueue.length === 0) {
          this._isActive = false;
          this.notifyIdle();
        }
      }
    }
  }

  /**
   * Web (primary): MediaSource streaming — starts playback on first chunk so
   * there's no wait for the full download. Falls back to blob if MediaSource
   * doesn't support audio/mpeg (Firefox) or if the response has no body.
   */
  private async playWebStream(response: Response): Promise<void> {
    const MS = (window as any).MediaSource as typeof MediaSource | undefined;
    if (!MS || !MS.isTypeSupported('audio/mpeg') || !response.body) {
      return this.playWeb(response);
    }

    const mediaSource = new MS();
    const url = URL.createObjectURL(mediaSource);

    return new Promise<void>((resolve) => {
      this.resolveCurrentPlayback = resolve;
      const audio = new (window as any).Audio(url) as HTMLAudioElement;
      this.currentWebAudio = audio;

      const cleanup = (reason: string) => {
        console.log('[ElevenLabsService] playWebStream cleanup —', reason);
        URL.revokeObjectURL(url);
        this.currentWebAudio = null;
        this.resolveCurrentPlayback = null;
        resolve();
      };

      audio.onended = () => cleanup('ended');
      audio.onerror = () => cleanup('error');

      mediaSource.addEventListener('sourceopen', async () => {
        let sb: SourceBuffer;
        try {
          sb = mediaSource.addSourceBuffer('audio/mpeg');
        } catch {
          cleanup('mime-unsupported');
          return;
        }

        const waitUpdate = () =>
          new Promise<void>((res) => sb.addEventListener('updateend', res, { once: true }));

        const reader = response.body!.getReader();
        this.currentReader = reader;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (!this._isActive) { reader.cancel(); break; }
            if (done) {
              if (sb.updating) await waitUpdate();
              if (mediaSource.readyState === 'open') mediaSource.endOfStream();
              break;
            }
            if (sb.updating) await waitUpdate();
            sb.appendBuffer(value);
          }
        } catch {
          try { if (mediaSource.readyState === 'open') mediaSource.endOfStream('decode'); } catch {}
        } finally {
          this.currentReader = null;
        }
      });

      audio.play().catch((err: Error) => {
        if (err?.name === 'NotAllowedError') {
          this.setBlocked(true);
          let fired = false;
          const unlock = () => {
            if (fired) return;
            fired = true;
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
            this.pendingUnlock = null;
            this.setBlocked(false);
            if (this.currentWebAudio === audio) {
              audio.play().catch(() => cleanup('retry-failed'));
            } else {
              resolve();
            }
          };
          this.pendingUnlock = unlock;
          document.addEventListener('click', unlock, { once: true });
          document.addEventListener('touchstart', unlock, { once: true });
        } else {
          cleanup('play-rejected-' + err?.name);
        }
      });
    });
  }

  /**
   * Web: blob URL + HTMLAudioElement (avoids expo-av base64 issues in browser).
   *
   * Browser autoplay policy: audio.play() will throw NotAllowedError on cold page
   * load because no prior user gesture exists. In that case we stay _isActive=true
   * and register a one-time click/touchstart listener to retry. This keeps isSpeaking
   * true in useTTS (shows "■ Stop") instead of flashing back to "▷ Listen".
   *
   * stop() cleans up the pending listener and resolves the promise so callers don't hang.
   */
  private async playWeb(response: Response): Promise<void> {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    console.log('[ElevenLabsService] playWeb() blob ready, calling audio.play()');

    return new Promise<void>((resolve) => {
      this.resolveCurrentPlayback = resolve;
      const audio = new (window as any).Audio(url) as HTMLAudioElement;
      this.currentWebAudio = audio;

      const cleanup = (reason: string) => {
        console.log('[ElevenLabsService] playWeb() cleanup —', reason);
        URL.revokeObjectURL(url);
        this.currentWebAudio = null;
        this.resolveCurrentPlayback = null;
        resolve();
      };

      audio.onended = () => cleanup('ended');
      audio.onerror = (e) => {
        console.error('[ElevenLabsService] audio element error', e);
        cleanup('error');
      };

      audio.play()
        .then(() => {
          console.log('[ElevenLabsService] audio.play() succeeded');
        })
        .catch((err: Error) => {
          console.warn('[ElevenLabsService] audio.play() rejected:', err?.name, err?.message);

          if (err?.name === 'NotAllowedError') {
            // Autoplay blocked — auto-retry after 1 s (user likely interacted by then)
            // Also retries immediately on click/touchstart for instant response.
            console.log('[ElevenLabsService] autoplay blocked — auto-retrying in 1 s');
            this.setBlocked(true);
            let fired = false;
            const unlock = () => {
              if (fired) return;
              fired = true;
              if (this.pendingUnlockTimer !== null) {
                clearTimeout(this.pendingUnlockTimer);
                this.pendingUnlockTimer = null;
              }
              document.removeEventListener('click', unlock);
              document.removeEventListener('touchstart', unlock);
              this.pendingUnlock = null;
              this.setBlocked(false);
              console.log('[ElevenLabsService] unlock — retrying audio.play()');
              if (this.currentWebAudio === audio) {
                audio.play()
                  .then(() => {
                    console.log('[ElevenLabsService] retry audio.play() succeeded');
                  })
                  .catch((retryErr: Error) => {
                    console.warn('[ElevenLabsService] retry audio.play() failed:', retryErr?.name);
                    cleanup('retry-failed');
                  });
              } else {
                // audio was replaced or stopped while we were waiting
                resolve();
              }
            };
            this.pendingUnlock = unlock;
            document.addEventListener('click', unlock, { once: true });
            document.addEventListener('touchstart', unlock, { once: true });
          } else {
            cleanup('play-rejected-' + (err?.name ?? 'unknown'));
          }
        });
    });
  }

  /** Native: base64 data URI + expo-av */
  private async playNative(response: Response): Promise<void> {
    const buffer = await response.arrayBuffer();
    const uri = `data:audio/mpeg;base64,${this.toBase64(buffer)}`;
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: true });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1.0 });
    this.currentSound = sound;
    await new Promise<void>((resolve) => {
      this.resolveCurrentNativePlayback = resolve;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.resolveCurrentNativePlayback = null;
          sound.unloadAsync().catch(() => {});
          this.currentSound = null;
          resolve();
        }
      });
    });
  }

  async stop(): Promise<void> {
    console.log('[ElevenLabsService] stop()');

    // Clear the TTS queue and invalidate any running drain
    this.speakQueue = [];
    this.queueRunning = false;
    this.drainGeneration++;

    // Remove any pending unlock listener so it doesn't fire after stop
    if (this.pendingUnlock) {
      document.removeEventListener('click', this.pendingUnlock);
      document.removeEventListener('touchstart', this.pendingUnlock);
      this.pendingUnlock = null;
    }

    if (this.pendingUnlockTimer !== null) {
      clearTimeout(this.pendingUnlockTimer);
      this.pendingUnlockTimer = null;
    }

    if (this.currentReader) {
      this.currentReader.cancel().catch(() => {});
      this.currentReader = null;
    }

    if (this.currentWebAudio) {
      this.currentWebAudio.pause();
      this.currentWebAudio = null;
    }

    // Resolve the playWeb() promise so useTTS finally{} runs and isSpeaking resets
    if (this.resolveCurrentPlayback) {
      this.resolveCurrentPlayback();
      this.resolveCurrentPlayback = null;
    }

    // Resolve the playNative() promise so the queue drain loop can exit
    if (this.resolveCurrentNativePlayback) {
      this.resolveCurrentNativePlayback();
      this.resolveCurrentNativePlayback = null;
    }

    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (_) {}
      this.currentSound = null;
    }

    this._isActive = false;
    this.setBlocked(false);
  }

  private toBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK)));
    }
    return btoa(binary);
  }
}

export const elevenLabsService = new ElevenLabsService();
