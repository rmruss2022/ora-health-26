import type { User, JournalEntry, ChatMessage, CommunityPost } from '@/types';

export class MockDynamoDBService {
  private users: Map<string, User> = new Map();
  private journalEntries: Map<string, JournalEntry[]> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map();
  private communityPosts: CommunityPost[] = [];

  async saveUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, ...updates });
    }
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    const entries = this.journalEntries.get(entry.userId) || [];
    entries.push(entry);
    this.journalEntries.set(entry.userId, entries);
  }

  async getJournalEntries(
    userId: string,
    limit: number = 50
  ): Promise<JournalEntry[]> {
    const entries = this.journalEntries.get(userId) || [];
    return entries.slice(-limit).reverse();
  }

  async getJournalEntriesByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<JournalEntry[]> {
    const entries = this.journalEntries.get(userId) || [];
    return entries.filter(
      (entry) => entry.createdAt >= startDate && entry.createdAt <= endDate
    );
  }

  async saveChatMessage(message: ChatMessage): Promise<void> {
    const messages = this.chatMessages.get(message.userId) || [];
    messages.push(message);
    this.chatMessages.set(message.userId, messages);
  }

  async getChatHistory(
    userId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    const messages = this.chatMessages.get(userId) || [];
    return messages.slice(-limit);
  }

  async saveCommunityPost(post: CommunityPost): Promise<void> {
    this.communityPosts.push(post);
  }

  async getCommunityPosts(limit: number = 50): Promise<CommunityPost[]> {
    return this.communityPosts.slice(-limit).reverse();
  }

  async deleteCommunityPost(postId: string, userId: string): Promise<void> {
    this.communityPosts = this.communityPosts.filter(
      (post) => post.id !== postId || post.userId !== userId
    );
  }

  // Test helper methods
  reset(): void {
    this.users.clear();
    this.journalEntries.clear();
    this.chatMessages.clear();
    this.communityPosts = [];
  }

  seedUser(user: User): void {
    this.users.set(user.id, user);
  }

  seedJournalEntries(userId: string, entries: JournalEntry[]): void {
    this.journalEntries.set(userId, entries);
  }
}
