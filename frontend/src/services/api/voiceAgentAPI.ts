import { apiClient } from './apiClient';

export interface ConversationTokenPayload {
  token: string;
  agentId: string;
  userId: string | null;
}

export interface VoiceToolCallResponse {
  success: boolean;
  toolName: string;
  result: any;
}

export interface VoiceLogMessagePayload {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  messageOrder?: number;
}

class VoiceAgentAPI {
  async getConversationToken(agentId?: string): Promise<ConversationTokenPayload> {
    return apiClient.post<ConversationTokenPayload>('/api/voice/conversation-token', {
      agentId,
    });
  }

  async executeToolCall(toolName: string, args?: Record<string, unknown>): Promise<VoiceToolCallResponse> {
    return apiClient.post<VoiceToolCallResponse>('/api/voice/tool-call', {
      toolName,
      args: args || {},
    });
  }

  /**
   * Log a voice conversation message to the backend for transcript analysis.
   * Fire-and-forget: does not throw, does not block UI.
   */
  logMessage(payload: VoiceLogMessagePayload): void {
    console.log('[voiceAgentAPI] logMessage sending', { role: payload.role, sessionId: payload.sessionId?.slice(0, 20) });
    apiClient
      .post<{ success: boolean }>('/api/voice/conversation-log', payload)
      .then(() => console.log('[voiceAgentAPI] logMessage ok'))
      .catch((err) => {
        console.warn('[voiceAgentAPI] logMessage failed:', err?.message, err?.statusCode);
      });
  }
}

export const voiceAgentAPI = new VoiceAgentAPI();
