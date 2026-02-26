import { useState, useEffect, useRef, useCallback } from 'react';
import { speechService } from '../services/SpeechService';
import { elevenLabsService, PERSONA_VOICE_MAP, VOICE_AGENT_ENABLED } from '../services/ElevenLabsService';

export type VoiceState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseVoiceConversationOptions {
  sendMessage: (text: string) => void;
  messages: Message[];
  personaId: string;
  isLoading: boolean;
}

/** Max recording duration before auto-submitting (ms) */
const MAX_RECORD_MS = 20_000;
/** Pause between AI response ending and next auto-listen (ms) */
const POST_SPEAK_DELAY_MS = 700;

/**
 * Orchestrates the turn-taking voice conversation loop:
 *   idle → listening → transcribing → thinking → speaking → listening → …
 *
 * Uses refs to avoid stale-closure issues in async callbacks.
 */
export const useVoiceConversation = ({
  sendMessage,
  messages,
  personaId,
}: UseVoiceConversationOptions) => {
  const [voiceState, setVoiceStateRaw] = useState<VoiceState>('idle');
  const [active, setActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Refs that async callbacks can read without stale closures
  const activeRef = useRef(false);
  const vsRef = useRef<VoiceState>('idle');
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postSpeakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMsgCountRef = useRef(0);
  const prevSpeakingRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const setState = useCallback((s: VoiceState) => {
    vsRef.current = s;
    setVoiceStateRaw(s);
  }, []);

  const clearTimers = () => {
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
    if (postSpeakTimerRef.current) { clearTimeout(postSpeakTimerRef.current); postSpeakTimerRef.current = null; }
  };

  // ─── Start listening ────────────────────────────────────────────────────────
  const doStartListening = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      await speechService.startRecording();
      setState('listening');
      // Auto-stop after MAX_RECORD_MS
      maxTimerRef.current = setTimeout(() => {
        if (vsRef.current === 'listening') doStopListening();
      }, MAX_RECORD_MS);
    } catch (err: any) {
      if (err?.message === 'PERMISSION_DENIED') {
        setPermissionDenied(true);
        doExit();
      }
    }
  }, []);

  // ─── Stop listening → transcribe → think ───────────────────────────────────
  const doStopListening = useCallback(async () => {
    if (vsRef.current !== 'listening') return;
    clearTimeout(maxTimerRef.current!);
    maxTimerRef.current = null;
    setState('transcribing');

    const uri = await speechService.stopRecording();
    if (!uri || !activeRef.current) return;

    const apiKey = (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined)?.trim();
    if (!apiKey) return;

    try {
      const text = await speechService.transcribe(uri, apiKey);
      if (!activeRef.current) return;
      if (text.trim()) {
        setState('thinking');
        sendMessage(text);
      } else {
        // Nothing heard — retry listening
        doStartListening();
      }
    } catch {
      if (activeRef.current) doStartListening();
    }
  }, [sendMessage]);

  // ─── Watch for new assistant message to speak ───────────────────────────────
  useEffect(() => {
    const count = messages.length;
    if (activeRef.current && count > prevMsgCountRef.current) {
      const last = messages[count - 1];
      if (last?.role === 'assistant' && vsRef.current === 'thinking') {
        const voiceId = PERSONA_VOICE_MAP[personaId] ?? PERSONA_VOICE_MAP['persona-ora'];
        setState('speaking');
        isSpeakingRef.current = true;
        elevenLabsService.speak(last.content, voiceId).then(() => {
          isSpeakingRef.current = false;
          if (activeRef.current && vsRef.current === 'speaking') {
            postSpeakTimerRef.current = setTimeout(() => {
              if (activeRef.current) doStartListening();
            }, POST_SPEAK_DELAY_MS);
          }
        });
      }
    }
    prevMsgCountRef.current = count;
  }, [messages, personaId]);

  // ─── Enter / exit ───────────────────────────────────────────────────────────
  const enterVoiceMode = useCallback(async () => {
    if (!VOICE_AGENT_ENABLED) return;
    activeRef.current = true;
    prevMsgCountRef.current = messages.length;
    setActive(true);
    setState('idle');
    // Short delay before first listen so modal can animate in
    setTimeout(() => doStartListening(), 500);
  }, [messages.length]);

  const doExit = useCallback(async () => {
    activeRef.current = false;
    clearTimers();
    await elevenLabsService.stop();
    await speechService.cancelRecording();
    setState('idle');
    setActive(false);
  }, []);

  // ─── Orb tap — interrupt or early submit ────────────────────────────────────
  const handleOrbPress = useCallback(() => {
    const s = vsRef.current;
    if (s === 'listening') {
      doStopListening();
    } else if (s === 'speaking') {
      clearTimers();
      elevenLabsService.stop().then(() => {
        isSpeakingRef.current = false;
        if (activeRef.current) doStartListening();
      });
    }
    // thinking / transcribing: ignore
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearTimers();
      elevenLabsService.stop().catch(() => {});
      speechService.cancelRecording().catch(() => {});
    };
  }, []);

  return {
    voiceState,
    active,
    permissionDenied,
    enterVoiceMode,
    exitVoiceMode: doExit,
    handleOrbPress,
  };
};
