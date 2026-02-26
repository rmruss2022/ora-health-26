import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import { Platform } from 'react-native';

// Feature flag — set EXPO_PUBLIC_ELEVENLABS_API_KEY in .env to enable
export const VOICE_AGENT_ENABLED = Boolean(
  (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined)?.trim()
);

// Per-persona voice ID mapping
// Valentyna — soft, calm          → Ora / aura (floating agent)
// Lily      — velvety, expressive → Sage
// Jen       — soothing, gentle    → Dr. Avery
export const PERSONA_VOICE_MAP: Record<string, string> = {
  'persona-ora': 'eYO9Ven76ACQ8Me4zQK4',   // Valentyna
  'persona-genz': 'pFZP5JQG7iQjIQuC4Bku',  // Lily
  'persona-psychotherapist': 'BL7YSL1bAkmW8U0JnU8o', // Jen
  aura: 'eYO9Ven76ACQ8Me4zQK4',            // Valentyna
};

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

class ElevenLabsService {
  private currentSound: Sound | null = null;
  private currentWebAudio: HTMLAudioElement | null = null;
  private _isActive = false;

  private apiKey(): string | undefined {
    return (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined)?.trim() || undefined;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  async speak(text: string, voiceId: string): Promise<void> {
    const key = this.apiKey();
    if (!key) return;

    await this.stop();
    this._isActive = true;

    try {
      const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          // Higher stability = more consistent, calmer delivery
          voice_settings: { stability: 0.65, similarity_boost: 0.75 },
        }),
      });

      if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);

      if (Platform.OS === 'web') {
        await this.playWeb(response);
      } else {
        await this.playNative(response);
      }
    } catch (err) {
      this._isActive = false;
      console.error('[ElevenLabsService]', err);
    }
  }

  /** Web: blob URL + HTMLAudioElement (avoids expo-av base64 issues in browser) */
  private async playWeb(response: Response): Promise<void> {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return new Promise<void>((resolve) => {
      const audio = new (window as any).Audio(url) as HTMLAudioElement;
      this.currentWebAudio = audio;
      const done = () => {
        URL.revokeObjectURL(url);
        this._isActive = false;
        this.currentWebAudio = null;
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done);
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
    if (this.currentWebAudio) {
      this.currentWebAudio.pause();
      this.currentWebAudio = null;
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
