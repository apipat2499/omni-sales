/**
 * Advanced caching utilities
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // For cache invalidation by tag
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  tags?: string[];
}

/**
 * In-memory cache with TTL and tags support
 */
export class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private tagIndex = new Map<string, Set<string>>();

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: options.ttl,
      tags: options.tags,
    };

    this.cache.set(key, item);

    // Index by tags
    if (options.tags) {
      options.tags.forEach((tag) => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      });
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check expiration
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const item = this.cache.get(key);

    if (item?.tags) {
      // Remove from tag index
      item.tags.forEach((tag) => {
        this.tagIndex.get(tag)?.delete(key);
      });
    }

    return this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries with specific tag
   */
  invalidateTag(tag: string): number {
    const keys = this.tagIndex.get(tag);

    if (!keys) {
      return 0;
    }

    let count = 0;
    keys.forEach((key) => {
      if (this.cache.delete(key)) {
        count++;
      }
    });

    this.tagIndex.delete(tag);
    return count;
  }

  /**
   * Invalidate multiple tags
   */
  invalidateTags(tags: string[]): number {
    let count = 0;
    tags.forEach((tag) => {
      count += this.invalidateTag(tag);
    });
    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();

    this.cache.forEach((item, key) => {
      if (item.ttl && now - item.timestamp > item.ttl) {
        this.delete(key);
        count++;
      }
    });

    return count;
  }
}

// Global cache instance
export const memoryCache = new MemoryCache();

/**
 * Cache wrapper for async functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    tags?: string[] | ((...args: Parameters<T>) => string[]);
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator
      ? options.keyGenerator(...args)
      : `${fn.name}:${JSON.stringify(args)}`;

    // Check cache
    const cached = memoryCache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Store in cache
    const tags = typeof options.tags === 'function' ? options.tags(...args) : options.tags;

    memoryCache.set(key, result, {
      ttl: options.ttl,
      tags,
    });

    return result;
  }) as T;
}

/**
 * Stale-while-revalidate pattern
 */
export async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    staleTime?: number;
    tags?: string[];
  } = {}
): Promise<T> {
  const cached = memoryCache.get<T>(key);

  // Return cached if fresh
  if (cached !== null) {
    const item = (memoryCache as any).cache.get(key);
    const age = Date.now() - item.timestamp;

    // If within stale time, return cached
    if (!options.staleTime || age < options.staleTime) {
      return cached;
    }

    // Otherwise, return stale data and revalidate in background
    fetcher().then((fresh) => {
      memoryCache.set(key, fresh, {
        ttl: options.ttl,
        tags: options.tags,
      });
    });

    return cached;
  }

  // No cache, fetch fresh
  const fresh = await fetcher();
  memoryCache.set(key, fresh, {
    ttl: options.ttl,
    tags: options.tags,
  });

  return fresh;
}

/**
 * Auto cleanup expired cache entries
 */
export function startCacheCleanup(interval: number = 60000): () => void {
  const intervalId = setInterval(() => {
    const removed = memoryCache.cleanup();
    if (removed > 0 && process.env.NODE_ENV === 'development') {
      console.log(`🗑️  Cleaned up ${removed} expired cache entries`);
    }
  }, interval);

  return () => clearInterval(intervalId);
}
