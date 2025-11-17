import { getRedisClient, type CacheClient } from '../redis/client';
import { trackCacheOperation } from './cache-metrics';

// TTL configurations (in seconds)
export const TTL_CONFIG = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 6 * 60 * 60, // 6 hours
  DAY: 24 * 60 * 60, // 24 hours
} as const;

// Cache namespace prefixes
export const CACHE_NAMESPACES = {
  PRODUCT: 'product',
  CATEGORY: 'category',
  CUSTOMER: 'customer',
  ORDER: 'order',
  ANALYTICS: 'analytics',
  QUERY: 'query',
  API: 'api',
} as const;

export type CacheNamespace = (typeof CACHE_NAMESPACES)[keyof typeof CACHE_NAMESPACES];

// Cache tag types for invalidation
export type CacheTag = {
  namespace: CacheNamespace;
  resource?: string;
  id?: string;
  custom?: string;
};

/**
 * Generate cache key from namespace, resource, and id
 */
export function generateCacheKey(
  namespace: CacheNamespace,
  resource: string,
  id?: string | number
): string {
  const parts = [namespace, resource];
  if (id !== undefined) {
    parts.push(String(id));
  }
  return parts.join(':');
}

/**
 * Generate cache key from tags
 */
export function generateCacheKeyFromTags(tags: CacheTag): string {
  const parts = [tags.namespace];
  if (tags.resource) parts.push(tags.resource);
  if (tags.id) parts.push(tags.id);
  if (tags.custom) parts.push(tags.custom);
  return parts.join(':');
}

/**
 * Parse cache key into components
 */
export function parseCacheKey(key: string): {
  namespace: string;
  resource?: string;
  id?: string;
} {
  const parts = key.split(':');
  return {
    namespace: parts[0],
    resource: parts[1],
    id: parts[2],
  };
}

/**
 * Get default TTL for namespace
 */
export function getDefaultTTL(namespace: CacheNamespace): number {
  const defaultTTL = Number(process.env.CACHE_DEFAULT_TTL) || TTL_CONFIG.MEDIUM;

  const namespaceTTLs: Record<CacheNamespace, number> = {
    [CACHE_NAMESPACES.PRODUCT]: TTL_CONFIG.LONG,
    [CACHE_NAMESPACES.CATEGORY]: TTL_CONFIG.VERY_LONG,
    [CACHE_NAMESPACES.CUSTOMER]: TTL_CONFIG.MEDIUM,
    [CACHE_NAMESPACES.ORDER]: TTL_CONFIG.SHORT,
    [CACHE_NAMESPACES.ANALYTICS]: TTL_CONFIG.LONG,
    [CACHE_NAMESPACES.QUERY]: TTL_CONFIG.MEDIUM,
    [CACHE_NAMESPACES.API]: TTL_CONFIG.MEDIUM,
  };

  return namespaceTTLs[namespace] || defaultTTL;
}

/**
 * Cache Manager class
 */
export class CacheManager {
  private client: CacheClient | null = null;
  private tagRegistry: Map<string, Set<string>> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.client = await getRedisClient();
    } catch (error) {
      console.error('Failed to initialize cache client:', error);
    }
  }

  private async ensureClient(): Promise<CacheClient> {
    if (!this.client) {
      this.client = await getRedisClient();
    }
    return this.client;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const client = await this.ensureClient();
      const value = await client.get(key);

      if (value) {
        trackCacheOperation('hit', key, Date.now() - startTime);
        return JSON.parse(value);
      }

      trackCacheOperation('miss', key, Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      trackCacheOperation('error', key, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T = any>(
    key: string,
    value: T,
    ttl?: number,
    tags?: CacheTag[]
  ): Promise<boolean> {
    const startTime = Date.now();
    try {
      const client = await this.ensureClient();
      const serialized = JSON.stringify(value);
      const parsedKey = parseCacheKey(key);
      const effectiveTTL = ttl || getDefaultTTL(parsedKey.namespace as CacheNamespace);

      await client.setex(key, effectiveTTL, serialized);

      // Register tags for invalidation
      if (tags) {
        for (const tag of tags) {
          const tagKey = generateCacheKeyFromTags(tag);
          if (!this.tagRegistry.has(tagKey)) {
            this.tagRegistry.set(tagKey, new Set());
          }
          this.tagRegistry.get(tagKey)!.add(key);
        }
      }

      trackCacheOperation('set', key, Date.now() - startTime);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      trackCacheOperation('error', key, Date.now() - startTime);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const client = await this.ensureClient();
      await client.del(key);
      trackCacheOperation('delete', key, Date.now() - startTime);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      trackCacheOperation('error', key, Date.now() - startTime);
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async delMany(keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      const success = await this.del(key);
      if (success) deleted++;
    }
    return deleted;
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T = any>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
    tags?: CacheTag[]
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Store in cache
    await this.set(key, value, ttl, tags);

    return value;
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: CacheTag): Promise<number> {
    const startTime = Date.now();
    try {
      const tagKey = generateCacheKeyFromTags(tag);
      const keys = this.tagRegistry.get(tagKey);

      if (!keys || keys.size === 0) {
        // If no keys in memory registry, try pattern matching
        return await this.invalidateByPattern(tagKey + '*');
      }

      const deleted = await this.delMany(Array.from(keys));
      this.tagRegistry.delete(tagKey);

      trackCacheOperation('invalidate', tagKey, Date.now() - startTime);
      return deleted;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      trackCacheOperation('error', 'invalidate', Date.now() - startTime);
      return 0;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    const startTime = Date.now();
    try {
      const client = await this.ensureClient();
      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await this.delMany(keys);
      trackCacheOperation('invalidate', pattern, Date.now() - startTime);
      return deleted;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      trackCacheOperation('error', 'invalidate', Date.now() - startTime);
      return 0;
    }
  }

  /**
   * Invalidate entire namespace
   */
  async invalidateNamespace(namespace: CacheNamespace): Promise<number> {
    return await this.invalidateByPattern(`${namespace}:*`);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.ensureClient();
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Cache exists check error:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = await this.ensureClient();
      return await client.ttl(key);
    } catch (error) {
      console.error('Cache TTL check error:', error);
      return -2;
    }
  }

  /**
   * Refresh TTL for key
   */
  async refresh(key: string, ttl?: number): Promise<boolean> {
    try {
      const client = await this.ensureClient();
      const parsedKey = parseCacheKey(key);
      const effectiveTTL = ttl || getDefaultTTL(parsedKey.namespace as CacheNamespace);
      const result = await client.expire(key, effectiveTTL);
      return result === 1;
    } catch (error) {
      console.error('Cache refresh error:', error);
      return false;
    }
  }

  /**
   * Warm cache with data
   */
  async warm<T = any>(
    entries: Array<{ key: string; value: T; ttl?: number; tags?: CacheTag[] }>
  ): Promise<number> {
    let warmed = 0;
    for (const entry of entries) {
      const success = await this.set(entry.key, entry.value, entry.ttl, entry.tags);
      if (success) warmed++;
    }
    return warmed;
  }

  /**
   * Batch get multiple keys
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    for (const key of keys) {
      results.push(await this.get<T>(key));
    }
    return results;
  }

  /**
   * Batch set multiple keys
   */
  async mset<T = any>(
    entries: Array<{ key: string; value: T; ttl?: number; tags?: CacheTag[] }>
  ): Promise<number> {
    let set = 0;
    for (const entry of entries) {
      const success = await this.set(entry.key, entry.value, entry.ttl, entry.tags);
      if (success) set++;
    }
    return set;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const client = await this.ensureClient();
      await client.flushall();
      this.tagRegistry.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      const client = await this.ensureClient();
      return await client.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }
}

// Singleton instance
let cacheManager: CacheManager | null = null;

/**
 * Get cache manager instance
 */
export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    cacheManager = new CacheManager();
  }
  return cacheManager;
}

/**
 * Helper function to get cached value
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  return getCacheManager().get<T>(key);
}

/**
 * Helper function to set cached value
 */
export async function setCache<T = any>(
  key: string,
  value: T,
  ttl?: number
): Promise<boolean> {
  return getCacheManager().set(key, value, ttl);
}

// Export default instance
export default getCacheManager();
