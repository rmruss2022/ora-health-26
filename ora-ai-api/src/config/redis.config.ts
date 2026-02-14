/**
 * Redis configuration
 * Centralized Redis settings for the application
 */

export const redisConfig = {
  // Connection
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0'),
  
  // Connection behavior
  connectTimeout: 5000,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  
  // Cache TTLs (seconds)
  ttl: {
    userProfile: 300,        // 5 minutes
    userList: 300,           // 5 minutes
    lettersList: 120,        // 2 minutes
    letterDetail: 120,       // 2 minutes
    forumPosts: 60,          // 1 minute
    forumPostDetail: 60,     // 1 minute
    meditationScripts: 3600, // 1 hour
    embeddings: 3600,        // 1 hour
    recommendations: 300,    // 5 minutes
    stats: 60,              // 1 minute
    short: 60,              // 1 minute
    medium: 300,            // 5 minutes
    long: 3600,             // 1 hour
  },
  
  // Feature flags
  enabled: process.env.REDIS_ENABLED !== 'false', // Default: enabled
  gracefulDegradation: true, // Continue without cache if Redis unavailable
  
  // Monitoring
  logErrors: true,
  logConnections: true,
  
  // Performance
  enableOfflineQueue: false, // Don't queue commands when disconnected
};

export default redisConfig;
