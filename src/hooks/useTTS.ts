import { useState, useCallback, useEffect, useRef } from 'react';
import {
  elevenLabsService,
  PERSONA_VOICE_MAP,
  VOICE_AGENT_ENABLED,
} from '../services/ElevenLabsService';

/**
 * Hook for ElevenLabs TTS playback.
 *
 * Usage:
 *   const { speak, stop, isSpeaking } = useTTS('persona-ora');
 *   speak("Hello, I'm Ora.");
 *
 * Requires EXPO_PUBLIC_ELEVENLABS_API_KEY in .env.
 * No-ops gracefully when key is absent or VOICE_AGENT_ENABLED is false.
 */
export const useTTS = (personaId: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(elevenLabsService.isBlocked);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const unsubBlocked = elevenLabsService.onBlockedChange((blocked) => {
      if (mountedRef.current) setIsBlocked(blocked);
    });
    const unsubIdle = elevenLabsService.onIdle(() => {
      if (mountedRef.current) setIsSpeaking(false);
    });
    return () => {
      mountedRef.current = false;
      unsubBlocked();
      unsubIdle();
      elevenLabsService.stop().catch(() => {});
    };
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!VOICE_AGENT_ENABLED) return;
      const voiceId = PERSONA_VOICE_MAP[personaId] ?? PERSONA_VOICE_MAP['persona-ora'];
      if (mountedRef.current) setIsSpeaking(true);
      try {
        await elevenLabsService.speak(text, voiceId);
      } finally {
        if (mountedRef.current) setIsSpeaking(false);
      }
    },
    [personaId]
  );

  const stop = useCallback(async () => {
    await elevenLabsService.stop();
    if (mountedRef.current) setIsSpeaking(false);
  }, []);

  const queueSpeak = useCallback(
    (text: string) => {
      if (!VOICE_AGENT_ENABLED) return;
      const voiceId = PERSONA_VOICE_MAP[personaId] ?? PERSONA_VOICE_MAP['persona-ora'];
      if (mountedRef.current) setIsSpeaking(true);
      elevenLabsService.queueSpeak(text, voiceId);
    },
    [personaId]
  );

  return { speak, stop, isSpeaking, isBlocked, queueSpeak };
};
