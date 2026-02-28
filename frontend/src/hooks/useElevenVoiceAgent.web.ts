import { useMemo } from 'react';

export type VoiceState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

interface UseElevenVoiceAgentOptions {
  userId?: string;
  agentId?: string;
}

export function useElevenVoiceAgent(_options: UseElevenVoiceAgentOptions) {
  return useMemo(
    () => ({
      available: false,
      active: false,
      voiceState: 'idle' as VoiceState,
      messages: [] as { id: string; role: 'user' | 'assistant'; content: string }[],
      error: null as string | null,
      enterVoiceMode: async () => {},
      exitVoiceMode: async () => {},
      handleOrbPress: async () => {},
    }),
    []
  );
}
