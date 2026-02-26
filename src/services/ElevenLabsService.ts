import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

// Feature flag — set EXPO_PUBLIC_ELEVENLABS_API_KEY in .env to enable
export const VOICE_AGENT_ENABLED = Boolean(
  (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined)?.trim()
);

// Per-persona voice ID mapping (ElevenLabs voice IDs)
// Rachel — calm, warm            → Ora
// Domi   — confident, energetic  → Sage
// Bella  — warm, professional    → Dr. Avery
// aura   — same as Ora for floating agent
export const PERSONA_VOICE_MAP: Record<string, string> = {
  'persona-ora': '21m00Tcm4TlvDq8ikWAM',
  'persona-genz': 'AZnzlk1XvdvUeBnXmlld',
  'persona-psychotherapist': 'EXAVITQu4vr4xnSDxMaL',
  aura: '21m00Tcm4TlvDq8ikWAM',
};

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

class ElevenLabsService {
  private currentSound: Sound | null = null;
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
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

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
    } catch (err) {
      this._isActive = false;
      console.error('[ElevenLabsService]', err);
    }
  }

  async stop(): Promise<void> {
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
    // Process in chunks to avoid call stack overflow on large buffers
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK)));
    }
    return btoa(binary);
  }
}

export const elevenLabsService = new ElevenLabsService();
