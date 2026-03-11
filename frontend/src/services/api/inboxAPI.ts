import { apiClient } from './apiClient';
import type { InboxMessage } from '../../types';

export class InboxAPI {
  /** Get 3 daily letters from queue (for community Letters section). Falls back to getMessages if unavailable. */
  async getDailyLetters(forDate?: string): Promise<{ messages: InboxMessage[]; unreadCount: number; totalCount: number }> {
    try {
      const query = forDate ? `?date=${forDate}` : '';
      const response = await apiClient.get<any>(`/inbox/daily-letters${query}`);
      const messages = response?.messages ?? [];
      return {
        messages,
        unreadCount: messages.filter((m: InboxMessage) => !m.isRead).length,
        totalCount: messages.length,
      };
    } catch {
      return this.getMessages(false, 10, 0);
    }
  }

  async markDailyLetterAsRead(dailyLetterId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/inbox/daily-letters/${dailyLetterId}/read`, {});
  }

  /** Respond to a daily letter (uses daily letter id, not inbox message id). */
  async respondToDailyLetter(
    dailyLetterId: string,
    responseText: string,
    createPost: boolean = false,
    isAnonymous: boolean = false
  ): Promise<{ success: boolean; postId?: string }> {
    return apiClient.post(`/inbox/daily-letters/${dailyLetterId}/respond`, {
      responseText,
      createPost,
      isAnonymous
    });
  }

  async getMessages(
    unreadOnly: boolean = false,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ messages: InboxMessage[]; unreadCount: number; totalCount: number }> {
    const queryParams = new URLSearchParams({
      unreadOnly: unreadOnly.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await apiClient.get<any>(`/inbox/messages?${queryParams.toString()}`);

    const messages =
      response?.messages ??
      response?.data?.messages ??
      (Array.isArray(response) ? response : []);
    const unreadCount =
      response?.unreadCount ??
      response?.data?.unreadCount ??
      messages.filter((message: InboxMessage) => !message.isRead).length;
    const totalCount =
      response?.totalCount ??
      response?.data?.totalCount ??
      messages.length;

    return { messages, unreadCount, totalCount };
  }

  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/inbox/messages/${messageId}/read`, {});
  }

  async archiveMessage(messageId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/inbox/messages/${messageId}/archive`, {});
  }

  async respondToMessage(
    messageId: string,
    responseText: string,
    createPost: boolean = false,
    isAnonymous: boolean = false
  ): Promise<{ success: boolean; postId?: string }> {
    return apiClient.post(`/inbox/messages/${messageId}/respond`, {
      responseText,
      createPost,
      isAnonymous
    });
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/inbox/unread-count');
    return response.count;
  }

  async generateDailyMessage(): Promise<{ message: InboxMessage }> {
    return apiClient.post('/inbox/generate-daily', {});
  }
}

export const inboxAPI = new InboxAPI();
