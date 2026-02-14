import { apiClient } from './apiClient';
import type { JournalEntry } from '../../types';

export class JournalAPI {
  async createEntry(entry: {
    content: string;
    behaviorId: string;
    mood?: string;
    tags?: string[];
    isShared?: boolean;
  }): Promise<JournalEntry> {
    return apiClient.post<JournalEntry>('/journal/entries', entry);
  }

  async getEntries(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<JournalEntry[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const query = queryParams.toString();
    const endpoint = `/journal/entries${query ? `?${query}` : ''}`;

    return apiClient.get<JournalEntry[]>(endpoint);
  }

  async getEntry(entryId: string): Promise<JournalEntry> {
    return apiClient.get<JournalEntry>(`/journal/entries/${entryId}`);
  }

  async updateEntry(
    entryId: string,
    updates: Partial<JournalEntry>
  ): Promise<JournalEntry> {
    return apiClient.put<JournalEntry>(`/journal/entries/${entryId}`, updates);
  }

  async deleteEntry(entryId: string): Promise<void> {
    return apiClient.delete<void>(`/journal/entries/${entryId}`);
  }
}

export const journalAPI = new JournalAPI();
