import { Audio } from 'expo-av';

const ELEVENLABS_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

class SpeechService {
  private recording: Audio.Recording | null = null;

  async startRecording(): Promise<void> {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) throw new Error('PERMISSION_DENIED');

    // Switch audio mode to allow recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    this.recording = recording;
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI() ?? null;
    this.recording = null;

    // Restore audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    return uri;
  }

  /** Cancel an in-progress recording without transcribing. */
  async cancelRecording(): Promise<void> {
    if (!this.recording) return;
    try {
      await this.recording.stopAndUnloadAsync();
    } catch (_) {}
    this.recording = null;
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  }

  get isRecording(): boolean {
    return this.recording !== null;
  }

  /** Send audio file to ElevenLabs STT and return transcript text. */
  async transcribe(uri: string, apiKey: string): Promise<string> {
    const formData = new FormData();
    // React Native FormData accepts { uri, type, name } for file fields
    formData.append('file', { uri, type: 'audio/m4a', name: 'recording.m4a' } as any);
    formData.append('model_id', 'scribe_v1');

    const response = await fetch(ELEVENLABS_STT_URL, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs STT error: ${response.status}`);
    }

    const data = await response.json();
    return (data.text as string | undefined)?.trim() ?? '';
  }
}

export const speechService = new SpeechService();
