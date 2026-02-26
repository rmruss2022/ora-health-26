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
  /** Stored so stop() can remove it if we're waiting for a user gesture */
  private pendingUnlock: (() => void) | null = null;
  /** Lets stop() resolve the playWeb() promise so callers don't hang */
  private resolveCurrentPlayback: (() => void) | null = null;

  private apiKey(): string | undefined {
    return (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined)?.trim() || undefined;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  async speak(text: string, voiceId: string): Promise<void> {
    const key = this.apiKey();
    if (!key) {
      console.log('[ElevenLabsService] speak() skipped — no API key');
      return;
    }

    console.log('[ElevenLabsService] speak() start | voiceId:', voiceId, '| chars:', text.length);
    await this.stop();
    this._isActive = true;

    try {
      console.log('[ElevenLabsService] fetching TTS audio...');
      const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          // speed: 0.7–1.2 (default 1.0). 1.25 = brisker without sounding rushed
          speed: 1.25,
          voice_settings: { stability: 0.65, similarity_boost: 0.75 },
        }),
      });

      if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);
      console.log('[ElevenLabsService] fetch OK (' + response.status + '), starting playback...');

      if (Platform.OS === 'web') {
        await this.playWeb(response);
      } else {
        await this.playNative(response);
      }
      console.log('[ElevenLabsService] speak() done');
    } catch (err) {
      this._isActive = false;
      console.error('[ElevenLabsService] speak() error:', err);
    }
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
        this._isActive = false;
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
            // Autoplay blocked — stay active, unlock on first user interaction
            console.log('[ElevenLabsService] autoplay blocked — waiting for user gesture');
            const unlock = () => {
              console.log('[ElevenLabsService] user gesture received — retrying audio.play()');
              this.pendingUnlock = null;
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

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 },
      (status) => {
        if (status.isLoaded && status.didJustFinish) {
          this._isActive = false;
          sound.unloadAsync().catch(() => {});
          this.currentSound = null;
        }
      }
    );
    this.currentSound = sound;
  }

  async stop(): Promise<void> {
    console.log('[ElevenLabsService] stop()');

    // Remove any pending autoplay-unlock listener so it doesn't fire after stop
    if (this.pendingUnlock) {
      document.removeEventListener('click', this.pendingUnlock);
      document.removeEventListener('touchstart', this.pendingUnlock);
      this.pendingUnlock = null;
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

    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (_) {}
      this.currentSound = null;
    }

    this._isActive = false;
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
