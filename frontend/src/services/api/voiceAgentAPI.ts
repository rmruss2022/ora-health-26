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
}

export const voiceAgentAPI = new VoiceAgentAPI();
