import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service';

/**
 * Cache middleware for Express routes
 * Implements cache-aside pattern with Redis
 */

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  skipCache?: (req: Request) => boolean;
  generateKey?: (req: Request) => string;
}

/**
 * Cache middleware factory
 * 
 * Usage:
 * ```ts
 * router.get('/api/users/:id', 
 *   cacheMiddleware({ ttl: 300, keyPrefix: 'user' }), 
 *   getUserHandler
 * );
 * ```
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 60,
    keyPrefix = 'route',
    skipCache,
    generateKey,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip cache if Redis not available
    if (!redisService.isAvailable()) {
      return next();
    }

    // Skip cache based on custom logic
    if (skipCache && skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = generateKey
      ? generateKey(req)
      : generateDefaultKey(req, keyPrefix);

    try {
      // Try to get from cache
      const cachedData = await redisService.get(cacheKey);
      
      if (cachedData) {
        // Cache hit
        res.setHeader('X-Cache-Status', 'HIT');
        return res.json(cachedData);
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache-Status', 'MISS');

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Cache the response data
        redisService.set(cacheKey, data, ttl).catch(err => {
          console.error('Cache set error:', err);
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Generate default cache key from request
 */
function generateDefaultKey(req: Request, prefix: string): string {
  const method = req.method;
  const path = req.path;
  const userId = (req as any).user?.id || 'anonymous';
  
  // Include query params in key
  const queryString = JSON.stringify(req.query);
  const queryHash = Buffer.from(queryString).toString('base64').slice(0, 16);

  return `${prefix}:${method}:${path}:${userId}:${queryHash}`;
}

/**
 * Invalidate cache by pattern
 * Call this after data mutations
 * 
 * Usage:
 * ```ts
 * await invalidateCache('user:*:123');
 * ```
 */
export async function invalidateCache(pattern: string): Promise<number> {
  if (!redisService.isAvailable()) {
    return 0;
  }

  return await redisService.deletePattern(pattern);
}

/**
 * User profile cache middleware (5 min TTL)
 */
export const cacheUserProfile = cacheMiddleware({
  ttl: redisService.TTL.USER_PROFILE,
  keyPrefix: 'user-profile',
  generateKey: (req) => redisService.userKey(req.params.id || req.params.userId, 'profile'),
});

/**
 * User data cache middleware (5 min TTL)
 */
export const cacheUserData = cacheMiddleware({
  ttl: redisService.TTL.USER_LIST,
  keyPrefix: 'user-data',
});

/**
 * Letters list cache middleware (2 min TTL)
 */
export const cacheLettersList = cacheMiddleware({
  ttl: redisService.TTL.LETTERS_LIST,
  keyPrefix: 'letters-list',
  generateKey: (req) => {
    const userId = (req as any).user?.id;
    const folder = req.query.folder || 'inbox';
    return redisService.KEY_PREFIX.LETTERS + `:${userId}:${folder}`;
  },
});

/**
 * Letter detail cache middleware (2 min TTL)
 */
export const cacheLetterDetail = cacheMiddleware({
  ttl: redisService.TTL.LETTER_DETAIL,
  keyPrefix: 'letter',
  generateKey: (req) => {
    const letterId = req.params.id || req.params.letterId;
    const userId = (req as any).user?.id;
    return redisService.KEY_PREFIX.LETTER + `:${letterId}:${userId}`;
  },
});

/**
 * Forum posts cache middleware (1 min TTL)
 */
export const cacheForumPosts = cacheMiddleware({
  ttl: redisService.TTL.FORUM_POSTS,
  keyPrefix: 'forum-posts',
  generateKey: (req) => {
    const category = req.query.category || 'all';
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;
    return redisService.KEY_PREFIX.POSTS + `:${category}:${limit}:${offset}`;
  },
});

/**
 * Meditation scripts cache middleware (1 hour TTL)
 */
export const cacheMeditationScripts = cacheMiddleware({
  ttl: redisService.TTL.MEDITATION_SCRIPTS,
  keyPrefix: 'meditation-scripts',
});

/**
 * Embeddings cache middleware (1 hour TTL)
 */
export const cacheEmbeddings = cacheMiddleware({
  ttl: redisService.TTL.EMBEDDINGS,
  keyPrefix: 'embeddings',
  generateKey: (req) => {
    const text = req.body.text || req.query.text;
    const hash = Buffer.from(text).toString('base64').slice(0, 32);
    return redisService.KEY_PREFIX.EMBEDDING + `:${hash}`;
  },
});

/**
 * Generic route cache with custom TTL
 */
export const cacheRoute = (ttl: number, keyPrefix?: string) => 
  cacheMiddleware({ ttl, keyPrefix });

export default {
  cacheMiddleware,
  invalidateCache,
  cacheUserProfile,
  cacheUserData,
  cacheLettersList,
  cacheLetterDetail,
  cacheForumPosts,
  cacheMeditationScripts,
  cacheEmbeddings,
  cacheRoute,
};
