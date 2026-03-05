import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useConversation } from '@elevenlabs/react-native';
import { Audio } from 'expo-av';
import { voiceAgentAPI } from '../services/api/voiceAgentAPI';
import { API_CONFIG } from '../config/api';

export type VoiceState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseElevenVoiceAgentOptions {
  userId?: string;
  agentId?: string;
}

const DEFAULT_AGENT_ID = (process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID as string | undefined)?.trim();

function mapStatusToVoiceState(status?: string): VoiceState {
  if (status === 'connecting') return 'thinking';
  if (status === 'connected') return 'listening';
  return 'idle';
}

function mapModeToVoiceState(mode?: string): VoiceState {
  if (mode === 'speaking') return 'speaking';
  if (mode === 'listening') return 'listening';
  return 'thinking';
}

function extractText(message: any): string {
  if (typeof message?.text === 'string') return message.text;
  if (typeof message?.content === 'string') return message.content;
  if (typeof message?.message === 'string') return message.message;
  if (typeof message?.transcript === 'string') return message.transcript;
  return '';
}

function extractRole(message: any): 'user' | 'assistant' {
  const value = String(message?.role || message?.source || '').toLowerCase();
  if (value.includes('user') || value.includes('human')) return 'user';
  return 'assistant';
}

function safeStringify(value: unknown, maxChars = 2400): string {
  try {
    const text = JSON.stringify(value);
    return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
  } catch {
    return String(value);
  }
}

async function maybeResolveClientTool(params: any, payload: any): Promise<void> {
  const candidates = ['respond', 'resolve', 'sendResult', 'onResult'];
  for (const key of candidates) {
    const fn = params?.[key];
    if (typeof fn === 'function') {
      await fn(payload);
      return;
    }
  }
}

export function useElevenVoiceAgent({ userId, agentId }: UseElevenVoiceAgentOptions) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [active, setActive] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const isStartingRef = useRef(false);

  const resolvedAgentId = agentId || DEFAULT_AGENT_ID || '';
  const available = Platform.OS !== 'web';

  const conversation = useConversation({
    onConnect: () => {
      setActive(true);
      setVoiceState('listening');
      setError(null);
      // Ensure mic starts unmuted whenever a new session connects.
      conversation.setMicMuted(false);
      setMicMuted(false);
    },
    onDisconnect: () => {
      setActive(false);
      setVoiceState('idle');
      setMicMuted(false);
    },
    onError: (err: any) => {
      console.error('[useElevenVoiceAgent] conversation error:', err);
      setError(err?.message || 'Voice session failed');
      setVoiceState('idle');
      setActive(false);
    },
    onStatusChange: (prop: any) => {
      console.log('[useElevenVoiceAgent] status:', prop?.status);
      setVoiceState(mapStatusToVoiceState(prop?.status));
    },
    onModeChange: (mode: any) => {
      console.log('[useElevenVoiceAgent] mode:', typeof mode === 'string' ? mode : mode?.mode);
      setVoiceState(mapModeToVoiceState(typeof mode === 'string' ? mode : mode?.mode));
    },
    onMessage: (msg: any) => {
      const text = extractText(msg).trim();
      if (!text) return;
      const role = extractRole(msg);
      const id = String(
        msg?.id
          || msg?.messageId
          || `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      );
      setMessages((prev) => [...prev, { id, role, content: text }]);
    },
    onUnhandledClientToolCall: async (params: any) => {
      const toolName = String(
        params?.toolName
          || params?.name
          || params?.tool_name
          || ''
      ).trim();
      const args =
        params?.arguments
        || params?.args
        || params?.input
        || params?.parameters
        || {};

      if (!toolName) {
        console.warn('[useElevenVoiceAgent] Tool call missing name:', params);
        return;
      }

      const apiUrl = `${API_CONFIG.api.baseURL}/api/voice/tool-call`;
      console.log('[useElevenVoiceAgent] Tool call:', toolName, '->', apiUrl);

      try {
        const response = await voiceAgentAPI.executeToolCall(toolName, args);
        await maybeResolveClientTool(params, response.result);
        console.log('[useElevenVoiceAgent] Tool result:', toolName, safeStringify(response.result));
      } catch (err: any) {
        const message = err?.message || `Tool "${toolName}" failed`;
        const statusCode = err?.statusCode ?? err?.status;
        console.warn(
          '[useElevenVoiceAgent] Tool failed:',
          toolName,
          message,
          statusCode ? `(HTTP ${statusCode})` : '',
          'URL:',
          apiUrl
        );
        await maybeResolveClientTool(params, { error: message });
      }
    },
  });

  const enterVoiceMode = useCallback(async () => {
    if (!available) return;
    // Prevent duplicate taps from starting overlapping sessions.
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setError(null);
    setMessages([]);
    setVoiceState('thinking');
    try {
      // Request mic permission — LiveKit/WebRTC manages the audio session itself.
      const micPermission = await Audio.requestPermissionsAsync();
      if (!micPermission.granted) {
        setError('Microphone permission is required for voice mode');
        setVoiceState('idle');
        setActive(false);
        return;
      }

      // Defensive cleanup: ensure any stale session is closed before starting a new one.
      try {
        await conversation.endSession();
      } catch {
        // Ignore if no active session exists.
      }
      const tokenPayload = await voiceAgentAPI.getConversationToken(resolvedAgentId || undefined);
      await conversation.startSession({
        conversationToken: tokenPayload.token,
        userId,
      });
    } catch (err: any) {
      console.error('[useElevenVoiceAgent] startSession error:', err);
      setError(err?.message || 'Could not start voice session');
      setVoiceState('idle');
      setActive(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [available, resolvedAgentId, conversation, userId]);

  const exitVoiceMode = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.warn('[useElevenVoiceAgent] endSession warning:', err);
    } finally {
      setActive(false);
      setVoiceState('idle');
      setMicMuted(false);
    }
  }, [conversation]);

  const handleOrbPress = useCallback(async () => {
    try {
      if (voiceState === 'speaking') {
        await conversation.sendUserActivity();
        return;
      }
      // Keep mic open in live voice mode; accidental taps shouldn't mute.
      conversation.setMicMuted(false);
      setMicMuted(false);
      setVoiceState('listening');
    } catch (err) {
      console.warn('[useElevenVoiceAgent] orb press warning:', err);
    }
  }, [conversation, voiceState]);

  const result = useMemo(
    () => ({
      available,
      active,
      voiceState,
      messages,
      error,
      enterVoiceMode,
      exitVoiceMode,
      handleOrbPress,
    }),
    [available, active, voiceState, messages, error, enterVoiceMode, exitVoiceMode, handleOrbPress]
  );

  return result;
}
