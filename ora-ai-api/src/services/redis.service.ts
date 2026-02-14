// Redis Service
// Centralized Redis client for caching operations
import { createClient, RedisClientType } from 'redis';

export class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  // Default TTL values (in seconds)
  public readonly DEFAULT_TTL = 300; // 5 minutes
  public readonly TTL = {
    USER_PROFILE: 300,        // 5 minutes
    LETTERS: 120,             // 2 minutes
    FORUM_POSTS: 60,          // 1 minute
    MEDITATION_SCRIPTS: 3600, // 1 hour
    EMBEDDINGS: 3600,         // 1 hour
    SHORT: 60,                // 1 minute
    MEDIUM: 300,              // 5 minutes
    LONG: 3600,               // 1 hour
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            this.reconnectAttempts = retries;
            if (retries > this.maxReconnectAttempts) {
              console.error('Redis: Max reconnection attempts reached');
              return false; // Stop reconnecting
            }
            const delay = Math.min(retries * 50, 500);
            console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries + 1})`);
            return delay;
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis: Connecting...');
      });

      this.client.on('ready', () => {
        console.log('Redis: Connected and ready');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('end', () => {
        console.log('Redis: Connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error: any) {
      console.error('Redis: Failed to initialize:', error.message);
      this.isConnected = false;
    }
  }

  // Check if Redis is available (graceful degradation)
  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Get a value from cache
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.client!.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error: any) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  }

  // Set a value in cache with optional TTL
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client!.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client!.set(key, serialized);
      }
    } catch (error: any) {
      console.error('Redis SET error:', error.message);
    }
  }

  // Delete a specific key
  async del(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.client!.del(key);
    } catch (error: any) {
      console.error('Redis DEL error:', error.message);
    }
  }

  // Delete multiple keys by pattern
  async delPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client!.del(keys);
      console.log(`Cache: Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      return keys.length;
    } catch (error: any) {
      console.error('Redis DEL pattern error:', error.message);
      return 0;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error: any) {
      console.error('Redis EXISTS error:', error.message);
      return false;
    }
  }

  // Get remaining TTL for a key
  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      return await this.client!.ttl(key);
    } catch (error: any) {
      console.error('Redis TTL error:', error.message);
      return -1;
    }
  }

  // Flush all cache (use with caution)
  async flushAll(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.client!.flushAll();
      console.log('Cache: All data flushed');
    } catch (error: any) {
      console.error('Redis FLUSHALL error:', error.message);
    }
  }

  // Get cache statistics
  async getStats(): Promise<{ keys: number; hits: number; misses: number }> {
    if (!this.isAvailable()) {
      return { keys: 0, hits: 0, misses: 0 };
    }

    try {
      const info = await this.client!.info('keyspace');
      const keysMatch = info.match(/keys=(\d+)/);
      const keys = keysMatch ? parseInt(keysMatch[1]) : 0;

      return {
        keys,
        hits: 0, // Would need to track separately
        misses: 0,
      };
    } catch (error: any) {
      console.error('Redis INFO error:', error.message);
      return { keys: 0, hits: 0, misses: 0 };
    }
  }

  // Key generation utilities
  public static key = {
    // User profile
    userProfile: (userId: string) => `user:${userId}:profile`,
    userRecommendations: (userId: string) => `user:${userId}:recommendations`,

    // Letters
    lettersInbox: (userId: string) => `letters:${userId}:inbox`,
    lettersSent: (userId: string) => `letters:${userId}:sent`,
    letterDetail: (letterId: string, userId: string) => `letter:${letterId}:user:${userId}`,
    letterUnreadCount: (userId: string) => `letters:${userId}:unread`,

    // Forum/Community
    communityPosts: (category?: string, limit?: number, offset?: number) =>
      `community:posts:${category || 'all'}:${limit || 20}:${offset || 0}`,
    communityCategories: () => 'community:categories',
    postComments: (postId: string) => `post:${postId}:comments`,

    // Meditations
    meditations: () => 'meditations:all',
    meditationsByCategory: (category: string) => `meditations:category:${category}`,
    meditationDetail: (id: string) => `meditation:${id}`,
    meditationUserSessions: (userId: string) => `meditations:${userId}:sessions`,
    meditationUserStats: (userId: string) => `meditations:${userId}:stats`,

    // Embeddings
    embedding: (text: string) => `embedding:${Buffer.from(text).toString('base64').slice(0, 32)}`,

    // Generic route-based cache
    route: (method: string, path: string, userId?: string) =>
      `route:${method}:${path}${userId ? `:user:${userId}` : ''}`,

    // Pattern helpers for invalidation
    patterns: {
      user: (userId: string) => `*:${userId}:*`,
      userProfile: (userId: string) => `user:${userId}:*`,
      letters: (userId: string) => `letters:${userId}:*`,
      community: () => 'community:*',
      posts: () => 'post:*',
      meditations: () => 'meditations:*',
      meditation: (id: string) => `meditation:${id}*`,
      embeddings: () => 'embedding:*',
    },
  };

  // Graceful disconnect
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const redisService = new RedisService();
