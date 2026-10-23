import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

const isProduction = process.env.NODE_ENV === 'production';
const hasRedisUrl = !!process.env.REDIS_URL;

function createRedisClient(): Redis {
  if (!hasRedisUrl) {
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

  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    connectTimeout: 5000, // 5000ms safe timeout for cloud TLS handshake
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 3) {
        console.warn(`[Redis] Connection attempt ${times} failed. Disabling reconnect strategy.`);
        return null; // Stop retrying
      }
      return Math.min(times * 300, 1000);
    }
  });

  client.on('error', (err) => {
    // Suppress unhandled error log when offline
  });

  return client;
}

export const redis = globalForRedis.redis || createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
