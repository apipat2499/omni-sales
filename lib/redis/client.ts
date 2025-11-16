import Redis, { Redis as RedisType } from 'ioredis';

// In-memory cache for development
class MemoryCache {
  private cache: Map<string, { value: string; expiry: number | null }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired items every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    const expiry = expirySeconds ? Date.now() + expirySeconds * 1000 : null;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async flushall(): Promise<void> {
    this.cache.clear();
  }

  async quit(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Redis-compatible methods
  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.set(key, value, seconds);
  }

  async exists(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return 0;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return 0;
    }
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return -2;
    if (!item.expiry) return -1;
    const remaining = Math.floor((item.expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return 0;
    item.expiry = Date.now() + seconds * 1000;
    return 1;
  }
}

// Redis client singleton
let redisClient: RedisType | MemoryCache | null = null;
let isConnecting = false;

/**
 * Get cache strategy from environment
 */
function getCacheStrategy(): 'memory' | 'redis' {
  const strategy = process.env.CACHE_STRATEGY?.toLowerCase();
  return strategy === 'redis' ? 'redis' : 'memory';
}

/**
 * Create Redis client with connection pooling and error handling
 */
function createRedisClient(): RedisType {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    // Connection pooling
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,

    // Timeouts
    connectTimeout: 10000,
    commandTimeout: 5000,

    // Reconnection strategy
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      if (times > 10) {
        console.error('Redis connection failed after 10 retries');
        return null; // Stop retrying
      }
      return delay;
    },

    // Connection pool settings
    lazyConnect: false,
    keepAlive: 30000,

    // Auto-pipelining for better performance
    enableAutoPipelining: true,
  });

  // Event handlers
  client.on('error', (error) => {
    console.error('Redis client error:', error);
  });

  client.on('connect', () => {
    console.log('Redis client connected');
  });

  client.on('ready', () => {
    console.log('Redis client ready');
  });

  client.on('close', () => {
    console.log('Redis client connection closed');
  });

  client.on('reconnecting', () => {
    console.log('Redis client reconnecting');
  });

  return client;
}

/**
 * Get or create Redis/Memory cache client
 */
export async function getRedisClient(): Promise<RedisType | MemoryCache> {
  if (redisClient) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for connection to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    return getRedisClient();
  }

  isConnecting = true;

  try {
    const strategy = getCacheStrategy();

    if (strategy === 'redis') {
      console.log('Initializing Redis client...');
      redisClient = createRedisClient();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, 10000);

        redisClient!.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        redisClient!.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } else {
      console.log('Initializing in-memory cache...');
      redisClient = new MemoryCache();
    }
  } catch (error) {
    console.error('Failed to initialize cache client, falling back to memory cache:', error);
    redisClient = new MemoryCache();
  } finally {
    isConnecting = false;
  }

  return redisClient;
}

/**
 * Get Redis client with fallback
 * If Redis is not available, returns memory cache
 */
export async function getRedisClientWithFallback(): Promise<RedisType | MemoryCache> {
  try {
    return await getRedisClient();
  } catch (error) {
    console.error('Redis client error, using memory cache:', error);
    if (!(redisClient instanceof MemoryCache)) {
      redisClient = new MemoryCache();
    }
    return redisClient;
  }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = await getRedisClient();

    if (client instanceof MemoryCache) {
      return false;
    }

    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Flush all cache data
 */
export async function flushCache(): Promise<void> {
  const client = await getRedisClient();
  await client.flushall();
}

/**
 * Get cache info
 */
export async function getCacheInfo(): Promise<{
  strategy: 'memory' | 'redis';
  connected: boolean;
  keys?: number;
}> {
  const strategy = getCacheStrategy();
  const connected = await isRedisAvailable();

  let keys = 0;
  try {
    const client = await getRedisClient();
    const allKeys = await client.keys('*');
    keys = allKeys.length;
  } catch {
    keys = 0;
  }

  return {
    strategy,
    connected: strategy === 'redis' ? connected : true,
    keys,
  };
}

// Export Redis type for type safety
export type CacheClient = RedisType | MemoryCache;

export default getRedisClient;
