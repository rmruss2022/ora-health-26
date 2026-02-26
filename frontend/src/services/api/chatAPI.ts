import { apiClient } from './apiClient';
import { API_CONFIG } from '../../config/api';
import type { ChatMessage, AIResponse } from '../../types/chat';

export class ChatAPI {
  async sendMessage(message: {
    content: string;
    behaviorId: string;
  }): Promise<AIResponse> {
    return apiClient.post<AIResponse>('/chat/messages', message);
  }

  /**
   * Stream an assistant response from POST /chat/stream via chunked SSE.
   * Uses fetch + ReadableStream (works with POST + auth headers on React Native).
   *
   * @returns A cancel function that aborts the in-flight request
   */
  streamMessage(
    message: { content: string; behaviorId: string },
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: Error) => void
  ): () => void {
    const controller = new AbortController();

    (async () => {
      // Re-use apiClient's lazy auth init by casting to any to access private fields
      const client = apiClient as any;
      await client.ensureAuthenticated();
      const authToken: string | null = client.authToken;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      let response: Response;
      try {
        response = await fetch(`${API_CONFIG.api.baseURL}/chat/stream`, {
          method: 'POST',
          headers,
          body: JSON.stringify(message),
          signal: controller.signal,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
        return;
      }

      if (!response.ok) {
        onError(new Error(`Stream request failed: ${response.status}`));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError(new Error('No readable stream in response'));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split on newlines; keep last potentially-incomplete line in buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') {
              onDone();
              return;
            }

            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) {
                onError(new Error(parsed.error));
                return;
              }
              if (typeof parsed.text === 'string') {
                onChunk(parsed.text);
              }
            } catch {
              // Malformed JSON line — skip
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        reader.releaseLock();
      }

      // Stream body ended without an explicit [DONE] — treat as complete
      onDone();
    })();

    return () => controller.abort();
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
