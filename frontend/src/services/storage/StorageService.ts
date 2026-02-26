import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, JournalEntry, ChatMessage } from '@/types';

/**
 * Local storage service using AsyncStorage
 * Used for caching and offline support
 */
export class StorageService {
  private readonly KEYS = {
    USER: '@shadow-ai:user',
    CHAT_HISTORY: '@shadow-ai:chat-history',
    JOURNAL_ENTRIES: '@shadow-ai:journal-entries',
    DRAFT_MESSAGE: '@shadow-ai:draft-message',
    CURRENT_BEHAVIOR: '@shadow-ai:current-behavior',
  };

  // User storage
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.USER, JSON.stringify(user));
  }

  async getUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(this.KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  }

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(this.KEYS.USER);
  }

  // Chat history storage
  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    await AsyncStorage.setItem(
      this.KEYS.CHAT_HISTORY,
      JSON.stringify(messages)
    );
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    const history = await AsyncStorage.getItem(this.KEYS.CHAT_HISTORY);
    return history ? JSON.parse(history) : [];
  }

  async addChatMessage(message: ChatMessage): Promise<void> {
    const history = await this.getChatHistory();
    history.push(message);

    // Keep only last 100 messages in local storage
    const trimmedHistory = history.slice(-100);
    await this.saveChatHistory(trimmedHistory);
  }

  async clearChatHistory(): Promise<void> {
    await AsyncStorage.removeItem(this.KEYS.CHAT_HISTORY);
  }

  // Journal entries cache
  async cacheJournalEntries(entries: JournalEntry[]): Promise<void> {
    await AsyncStorage.setItem(
      this.KEYS.JOURNAL_ENTRIES,
      JSON.stringify(entries)
    );
  }

  async getCachedJournalEntries(): Promise<JournalEntry[]> {
    const entries = await AsyncStorage.getItem(this.KEYS.JOURNAL_ENTRIES);
    return entries ? JSON.parse(entries) : [];
  }

  // Draft message storage
  async saveDraftMessage(message: string): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.DRAFT_MESSAGE, message);
  }

  async getDraftMessage(): Promise<string | null> {
    return await AsyncStorage.getItem(this.KEYS.DRAFT_MESSAGE);
  }

  async clearDraftMessage(): Promise<void> {
    await AsyncStorage.removeItem(this.KEYS.DRAFT_MESSAGE);
  }

  // Current behavior state
  async saveCurrentBehavior(behaviorId: string): Promise<void> {
    await AsyncStorage.setItem(this.KEYS.CURRENT_BEHAVIOR, behaviorId);
  }

  async getCurrentBehavior(): Promise<string | null> {
    return await AsyncStorage.getItem(this.KEYS.CURRENT_BEHAVIOR);
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.KEYS.USER,
      this.KEYS.CHAT_HISTORY,
      this.KEYS.JOURNAL_ENTRIES,
      this.KEYS.DRAFT_MESSAGE,
      this.KEYS.CURRENT_BEHAVIOR,
    ]);
  }
}

export const storageService = new StorageService();
