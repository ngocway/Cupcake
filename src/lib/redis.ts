import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

const isProduction = process.env.NODE_ENV === 'production';
const hasRedisUrl = !!process.env.REDIS_URL;

function createRedisClient(): Redis {
  if (isProduction && !hasRedisUrl) {
    return new Proxy({} as Redis, {
      get(_target, prop) {
        if (prop === 'status') return 'offline';
        if (prop === 'get' || prop === 'hget') return async () => null;
        if (prop === 'set' || prop === 'setex' || prop === 'hset' || prop === 'del') return async () => 'OK';
        if (prop === 'keys' || prop === 'hkeys') return async () => [];
        return () => Promise.resolve(null);
      }
    });
  }

  return new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    connectTimeout: 500, // 500ms fast timeout
    maxRetriesPerRequest: 0, // Fail commands immediately when offline
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy(times) {
      console.warn(`[Redis] Connection attempt ${times} failed. Disabling reconnect strategy.`);
      return null; // Stop retrying
    }
  });
}

export const redis = globalForRedis.redis || createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
