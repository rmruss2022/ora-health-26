import { apiClient } from './apiClient';
import type { ChatMessage, AIResponse } from '../../types/chat';

export class ChatAPI {
  async sendMessage(message: {
    content: string;
    behaviorId: string;
  }): Promise<AIResponse> {
    return apiClient.post<AIResponse>('/chat/messages', message);
  }

  async getChatHistory(params?: {
    limit?: number;
    before?: string;
  }): Promise<ChatMessage[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.before) queryParams.set('before', params.before);

    const query = queryParams.toString();
    const endpoint = `/chat/history${query ? `?${query}` : ''}`;

    return apiClient.get<ChatMessage[]>(endpoint);
  }

  async switchBehavior(behaviorId: string): Promise<{ success: boolean }> {
    return apiClient.post('/chat/behavior', { behaviorId });
  }

  async getCurrentBehavior(): Promise<{ behaviorId: string }> {
    return apiClient.get('/chat/behavior');
  }
}

export const chatAPI = new ChatAPI();
