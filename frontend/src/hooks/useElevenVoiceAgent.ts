import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useConversation } from '@elevenlabs/react-native';
import { Audio } from 'expo-av';
import { voiceAgentAPI } from '../services/api/voiceAgentAPI';
import { apiClient } from '../services/api/apiClient';
import { secureStorage } from '../services/secureStorage';

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

const ALLOWED_TOOL_NAMES = [
  'get_user_profile',
  'update_user_profile',
  'get_user_recommendations',
  'get_user_summaries',
  'get_recent_journal_entries',
  'search_journal_entries',
  'create_journal_entry',
  'get_conversation_history',
  'save_user_insight',
  'get_available_activities',
  'search_activities',
  'get_user_progress',
  'get_exercise_completions',
  'get_user_letters',
  'get_meditation_sessions',
  'get_meditations',
  'get_inbox_messages',
  'get_quiz_history',
  'get_quiz_streak',
  'get_upcoming_collective_sessions',
  'get_user_community_posts',
  'get_user_notifications',
  'save_weekly_plan',
  'get_weekly_plan',
  'save_weekly_review',
  'get_weekly_review',
] as const;

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function useElevenVoiceAgent({ userId, agentId }: UseElevenVoiceAgentOptions) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [active, setActive] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const isStartingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const messageOrderRef = useRef(0);

  // Sync token from secureStorage when we have userId (fixes race where AuthContext hasn't synced yet)
  useEffect(() => {
    if (!userId) return;
    secureStorage.getAccessToken().then((token) => {
      if (token) apiClient.setAuthToken(token);
    });
  }, [userId]);

  const resolvedAgentId = agentId || DEFAULT_AGENT_ID || '';
  const available = Platform.OS !== 'web';

  const clientTools = useMemo(() => {
    const createHandler = (toolName: string) => async (parameters: unknown) => {
      const args = (parameters && typeof parameters === 'object') ? parameters as Record<string, unknown> : {};
      const toolStart = Date.now();
      try {
        const response = await voiceAgentAPI.executeToolCall(toolName, args);
        const elapsed = Date.now() - toolStart;
        console.log('[useElevenVoiceAgent] Tool call OK:', toolName, `(${elapsed}ms)`);
        return response.result;
      } catch (err: any) {
        const statusCode = err?.statusCode ?? err?.status;
        if (statusCode === 401) {
          console.log('[useElevenVoiceAgent] Tool 401, retrying after token sync...');
          await new Promise((r) => setTimeout(r, 600));
          const response = await voiceAgentAPI.executeToolCall(toolName, args);
          console.log('[useElevenVoiceAgent] Tool call OK (retry):', toolName);
          return response.result;
        }
        const elapsed = Date.now() - toolStart;
        console.warn('[useElevenVoiceAgent] Tool failed:', toolName, err?.message, `(${elapsed}ms)`);
        throw err;
      }
    };
    return Object.fromEntries(
      ALLOWED_TOOL_NAMES.map((name) => [name, createHandler(name)])
    );
  }, []);

  const conversation = useConversation({
    clientTools,
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
      sessionIdRef.current = null;
    },
    onError: (err: any) => {
      const msg = err?.message || '';
      console.error('[useElevenVoiceAgent] conversation error:', err);
      const isTimeout =
        msg.includes('timeout') ||
        msg.includes('ping') ||
        msg.includes('Stream end encountered');
      setError(
        isTimeout ? 'Connection lost. Please try again.' : msg || 'Voice session failed'
      );
      setVoiceState('idle');
      setActive(false);
      sessionIdRef.current = null;
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
      console.log('[useElevenVoiceAgent] onMessage raw', { hasText: !!text, keys: msg ? Object.keys(msg) : [] });
      if (!text) return;
      const role = extractRole(msg);
      const id = String(
        msg?.id
          || msg?.messageId
          || `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      );
      setMessages((prev) => [...prev, { id, role, content: text }]);

      // Log to backend for transcript analysis (fire-and-forget)
      const sid = sessionIdRef.current;
      if (sid && userId) {
        const order = messageOrderRef.current++;
        console.log('[useElevenVoiceAgent] onMessage -> logMessage', { role, order, len: text.length });
        voiceAgentAPI.logMessage({
          sessionId: sid,
          role,
          content: text,
          agentId: resolvedAgentId || undefined,
          messageOrder: order,
        });
      } else {
        console.log('[useElevenVoiceAgent] onMessage skip log (no sessionId or userId)', {
          hasSessionId: !!sid,
          hasUserId: !!userId,
        });
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
      sessionIdRef.current = generateSessionId();
      messageOrderRef.current = 0;
      const tokenPayload = await voiceAgentAPI.getConversationToken(resolvedAgentId || undefined);
      await conversation.startSession({
        conversationToken: tokenPayload.token,
        userId,
      });
    } catch (err: any) {
      console.error('[useElevenVoiceAgent] startSession error:', err);
      sessionIdRef.current = null;
      const msg = err?.message || '';
      const isTimeout =
        msg.includes('i/o timeout') ||
        msg.includes('room_creation_failed') ||
        msg.includes('TimeoutError') ||
        msg.includes('timed out') ||
        msg.includes('Request timed out') ||
        msg.includes('ping timeout');
      setError(
        isTimeout
          ? 'Connection timed out. Please try again.'
          : msg || 'Could not start voice session'
      );
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
