# Redis Caching Layer

Ora AI uses Redis for high-performance caching to reduce database load and improve response times.

## Quick Start

### 1. Install Redis

**macOS** (Homebrew):
```bash
brew install redis
brew services start redis
```

**Linux** (apt):
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker**:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 2. Configure

Add to `.env`:
```env
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
```

### 3. Use in Routes

```ts
import { cacheUserProfile, cacheLetter List, invalidateCache } from './middleware/cache.middleware';

// Cache a route
router.get('/api/users/:id', cacheUserProfile, getUserHandler);

// Custom TTL
router.get('/api/stats', cacheRoute(120), getStatsHandler);

// Invalidate after mutation
router.post('/api/users/:id', async (req, res) => {
  await updateUser(req.params.id, req.body);
  await invalidateCache(`user:*:${req.params.id}`);
  res.json({ success: true });
});
```

## Cache Strategy

### TTL (Time-To-Live) Settings

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User profiles | 5 min | Changes infrequently |
| Letters list | 2 min | Updates semi-frequently |
| Letter detail | 2 min | Static once sent |
| Forum posts | 1 min | Updates frequently |
| Meditation scripts | 1 hour | Static content |
| Embeddings | 1 hour | Expensive to compute |
| Stats/counts | 1 min | Real-time feel with caching benefit |

### Cache Keys

Format: `{prefix}:{identifier}:{userId}:{params}`

Examples:
- `user:profile:123` - User 123's profile
- `letters:inbox:123` - User 123's inbox
- `letter:456:123` - Letter 456 for user 123
- `forum:posts:all:20:0` - Forum posts (all category, limit 20, offset 0)
- `embedding:SGVsbG8gd29ybGQ` - Embedding for "Hello world"

## Cache Middleware

### Pre-built Middleware

```ts
import {
  cacheUserProfile,        // 5 min, user profiles
  cacheUserData,           // 5 min, user data
  cacheLettersList,        // 2 min, letters inbox/sent
  cacheLetterDetail,       // 2 min, individual letters
  cacheForumPosts,         // 1 min, community posts
  cacheMeditationScripts,  // 1 hr, meditation content
  cacheEmbeddings,         // 1 hr, embedding results
  cacheRoute,              // Custom TTL
} from './middleware/cache.middleware';

// Usage
router.get('/users/:id', cacheUserProfile, getUser);
router.get('/letters', cacheLettersList, getLetters);
router.get('/forum/posts', cacheForumPosts, getPosts);
```

### Custom Middleware

```ts
import { cacheMiddleware } from './middleware/cache.middleware';

const customCache = cacheMiddleware({
  ttl: 180,                    // 3 minutes
  keyPrefix: 'custom',
  skipCache: (req) => {
    // Skip caching for admin requests
    return req.user?.role === 'admin';
  },
  generateKey: (req) => {
    // Custom key generation
    return `custom:${req.params.id}:${req.query.version}`;
  },
});

router.get('/custom/:id', customCache, getCustomData);
```

## Cache Invalidation

### Manual Invalidation

```ts
import { invalidateCache } from './middleware/cache.middleware';

// Invalidate single key
await invalidateCache('user:profile:123');

// Invalidate pattern
await invalidateCache('user:*:123');        // All user 123 data
await invalidateCache('letters:*');         // All letters
await invalidateCache('forum:posts:*');     // All forum caches
```

### Auto-invalidation Pattern

```ts
// After data mutation
router.post('/users/:id', async (req, res) => {
  const userId = req.params.id;
  
  // Update database
  await updateUser(userId, req.body);
  
  // Invalidate related caches
  await invalidateCache(`user:*:${userId}`);
  await invalidateCache(`letters:*:${userId}`);
  
  res.json({ success: true });
});
```

## Monitoring

### Cache Hit Rate

Check `X-Cache-Status` header:
- `HIT` - Served from cache
- `MISS` - Fetched from database

### Redis Stats

```ts
import { redisService } from './services/redis.service';

const stats = await redisService.getStats();
console.log(stats);
// { connected: true, keys: 1234, memory: '2.5MB', ... }
```

### Health Check

```ts
app.get('/health/redis', (req, res) => {
  const isConnected = redisService.isAvailable();
  res.json({
    redis: {
      status: isConnected ? 'healthy' : 'degraded',
      connected: isConnected,
    },
  });
});
```

## Graceful Degradation

The cache layer is designed to fail gracefully. If Redis is unavailable:

✅ **App continues to work** - requests go directly to database  
✅ **No errors thrown** - cache failures are logged but don't break requests  
✅ **Automatic reconnection** - Redis client retries connection  

You can disable caching entirely:
```env
REDIS_ENABLED=false
```

## Performance Tips

1. **Set appropriate TTLs** - Balance freshness vs. cache hit rate
2. **Use cache middleware early** - Before expensive operations
3. **Invalidate selectively** - Don't clear entire cache unnecessarily
4. **Monitor hit rates** - Aim for >80% hit rate on common queries
5. **Keep keys short** - Use abbreviations in prefixes
6. **Avoid caching user-specific data** in shared keys

## Troubleshooting

### Redis not connecting

```bash
# Check Redis is running
redis-cli ping
# Expected: PONG

# Check connection
redis-cli -u redis://localhost:6379 ping

# Check logs
tail -f /usr/local/var/log/redis.log
```

### High memory usage

```bash
# Check memory
redis-cli INFO memory

# Flush all keys (caution!)
redis-cli FLUSHALL

# Set max memory
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Cache not invalidating

1. Check pattern matches: `redis-cli KEYS "user:*"`
2. Ensure invalidation called after mutation
3. Check Redis logs for errors

## Production Deployment

### Recommended Settings

```env
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0
REDIS_ENABLED=true
```

### Redis Configuration

Add to `redis.conf`:
```conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save ""
appendonly no
```

### Monitoring

Use Redis monitoring tools:
- **RedisInsight** - GUI for Redis
- **redis-stat** - CLI monitoring
- **Prometheus exporter** - Metrics collection

### Scaling

For high traffic:
1. **Redis Cluster** - Horizontal scaling
2. **Redis Sentinel** - High availability
3. **Separate read replicas** - Read scaling
4. **Managed Redis** - AWS ElastiCache, Redis Labs

## API Reference

See:
- `src/services/redis.service.ts` - Core Redis client
- `src/middleware/cache.middleware.ts` - Cache middleware
- `src/config/redis.config.ts` - Configuration

## Next Steps

1. Add Redis to your stack
2. Apply cache middleware to high-traffic routes
3. Monitor cache hit rates
4. Tune TTLs based on usage patterns
5. Add invalidation to mutation endpoints
