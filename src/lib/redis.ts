import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    connectTimeout: 1500, // 1.5 seconds timeout
    maxRetriesPerRequest: 0, // Fail commands immediately when offline
    lazyConnect: true,
    retryStrategy(times) {
      console.warn(`[Redis] Connection attempt ${times} failed. Disabling reconnect strategy.`);
      return null; // Stop retrying
    }
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
