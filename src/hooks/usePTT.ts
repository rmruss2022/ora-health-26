import { useState, useCallback, useRef } from 'react';
import { speechService } from '../services/SpeechService';
import { VOICE_AGENT_ENABLED } from '../services/ElevenLabsService';

interface UsePTTOptions {
  /** Called with the final transcript text when transcription succeeds. */
  onTranscript: (text: string) => void;
}

/**
 * Push-to-talk hook.
 *
 * Usage:
 *   const { isRecording, isTranscribing, permissionDenied, startListening, stopListening } = usePTT({ onTranscript });
 *
 * Call startListening() on mic button press-in, stopListening() on press-out.
 * Requires EXPO_PUBLIC_ELEVENLABS_API_KEY.
 */
export const usePTT = ({ onTranscript }: UsePTTOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const abortedRef = useRef(false);

  const startListening = useCallback(async () => {
    if (!VOICE_AGENT_ENABLED) return;
    abortedRef.current = false;
    try {
      await speechService.startRecording();
      setIsRecording(true);
    } catch (err: any) {
      if (err?.message === 'PERMISSION_DENIED') {
        setPermissionDenied(true);
      } else {
        console.error('[usePTT] startRecording error:', err);
      }
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);

    const apiKey = (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined)?.trim();
    const uri = await speechService.stopRecording();

    if (!uri || !apiKey || abortedRef.current) return;

    setIsTranscribing(true);
    try {
      const text = await speechService.transcribe(uri, apiKey);
      if (text && !abortedRef.current) {
        onTranscript(text);
      }
    } catch (err) {
      console.error('[usePTT] transcribe error:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, [isRecording, onTranscript]);

  /** Cancel a recording without sending it. */
  const cancelListening = useCallback(async () => {
    abortedRef.current = true;
    setIsRecording(false);
    await speechService.cancelRecording();
  }, []);

  return {
    isRecording,
    isTranscribing,
    permissionDenied,
    startListening,
    stopListening,
    cancelListening,
    available: VOICE_AGENT_ENABLED,
  };
};
