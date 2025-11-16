/**
 * Caching utilities for improved performance
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags?: string[];
}

/**
 * Memory-based cache with TTL support
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Set cache entry
   */
  set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000, tags?: string[]): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt, tags });
    this.scheduleCleanup();
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries with specific tag
   */
  invalidateTag(tag: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (entry.tags?.includes(tag)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Schedule periodic cleanup of expired entries
   */
  private scheduleCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.cache.forEach((entry, key) => {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));

      if (this.cache.size === 0) {
        clearInterval(this.cleanupInterval!);
        this.cleanupInterval = null;
      }
    }, 60 * 1000); // Run cleanup every minute
  }
}

/**
 * LocalStorage-based cache with JSON serialization
 */
class LocalStorageCache {
  private prefix = 'app_cache_';
  private metaPrefix = 'app_cache_meta_';

  /**
   * Set cache entry in localStorage
   */
  set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    try {
      const expiresAt = Date.now() + ttlMs;
      const fullKey = this.prefix + key;
      const metaKey = this.metaPrefix + key;

      localStorage.setItem(fullKey, JSON.stringify(value));
      localStorage.setItem(metaKey, JSON.stringify({ expiresAt }));
    } catch (err) {
      console.error('Error setting localStorage cache:', err);
    }
  }

  /**
   * Get cache entry from localStorage
   */
  get<T>(key: string): T | null {
    try {
      const fullKey = this.prefix + key;
      const metaKey = this.metaPrefix + key;

      const data = localStorage.getItem(fullKey);
      const meta = localStorage.getItem(metaKey);

      if (!data || !meta) return null;

      const metadata = JSON.parse(meta);
      if (Date.now() > metadata.expiresAt) {
        localStorage.removeItem(fullKey);
        localStorage.removeItem(metaKey);
        return null;
      }

      return JSON.parse(data) as T;
    } catch (err) {
      console.error('Error getting localStorage cache:', err);
      return null;
    }
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    try {
      const fullKey = this.prefix + key;
      const metaKey = this.metaPrefix + key;

      const data = localStorage.getItem(fullKey);
      const meta = localStorage.getItem(metaKey);

      if (!data || !meta) return false;

      const metadata = JSON.parse(meta);
      if (Date.now() > metadata.expiresAt) {
        localStorage.removeItem(fullKey);
        localStorage.removeItem(metaKey);
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Delete specific entry
   */
  delete(key: string): void {
    try {
      const fullKey = this.prefix + key;
      const metaKey = this.metaPrefix + key;
      localStorage.removeItem(fullKey);
      localStorage.removeItem(metaKey);
    } catch (err) {
      console.error('Error deleting localStorage cache:', err);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToDelete.push(key);
          const metaKey = this.metaPrefix + key.slice(this.prefix.length);
          keysToDelete.push(metaKey);
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      console.error('Error clearing localStorage cache:', err);
    }
  }
}

/**
 * Memoization helper for expensive computations
 */
export function memoize<Args extends any[], T>(
  fn: (...args: Args) => T,
  options: {
    maxSize?: number;
    ttlMs?: number;
    keyGenerator?: (...args: Args) => string;
  } = {}
) {
  const { maxSize = 10, ttlMs = 5 * 60 * 1000, keyGenerator } = options;
  const cache = new MemoryCache();

  return function memoized(...args: Args): T {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    const cached = cache.get<T>(key);
    if (cached !== null) return cached;

    const result = fn(...args);
    cache.set(key, result, ttlMs);

    if (cache.size() > maxSize) {
      cache.clear();
    }

    return result;
  };
}

/**
 * Debounce cache updates (useful for API calls triggered by user input)
 */
export function debounceCache<T>(
  fn: () => Promise<T>,
  delayMs: number = 500,
  cacheKey: string = 'debounce'
): Promise<T> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(async () => {
      const result = await fn();
      memoryCache.set(cacheKey, result);
      resolve(result);
    }, delayMs);

    // Return cached value if available
    const cached = memoryCache.get<T>(cacheKey);
    if (cached) {
      clearTimeout(timeoutId);
      resolve(cached);
    }
  });
}

/**
 * Stale-while-revalidate pattern
 * Returns cached value immediately, updates in background
 */
export async function swrCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    staleTtlMs?: number;
    revalidateTtlMs?: number;
  } = {}
): Promise<T> {
  const { staleTtlMs = 60 * 1000, revalidateTtlMs = 24 * 60 * 60 * 1000 } = options;

  // Check if we have fresh data
  const cached = memoryCache.get<T>(key);
  if (cached) return cached;

  // Check if we have stale data
  const staleKey = `${key}:stale`;
  const staleData = memoryCache.get<T>(staleKey);

  // Fetch new data in background
  fetcher()
    .then((data) => {
      memoryCache.set(key, data, revalidateTtlMs);
    })
    .catch((err) => {
      console.error('SWR fetch error:', err);
    });

  // Return stale data if available, otherwise fetch synchronously
  if (staleData) return staleData;

  return fetcher();
}

/**
 * Global singleton instances
 */
export const memoryCache = new MemoryCache();
export const localStorageCache = typeof window !== 'undefined' ? new LocalStorageCache() : null;

/**
 * Combined cache strategy
 * Uses memory cache for speed, falls back to localStorage for persistence
 */
export class HybridCache {
  /**
   * Set value in both memory and localStorage
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    memoryCache.set(key, value, ttlMs);
    if (localStorageCache) {
      localStorageCache.set(key, value, ttlMs);
    }
  }

  /**
   * Get value from memory cache, fall back to localStorage
   */
  get<T>(key: string): T | null {
    let value = memoryCache.get<T>(key);
    if (value !== null) return value;

    if (localStorageCache) {
      value = localStorageCache.get<T>(key);
      if (value !== null) {
        // Restore to memory cache
        memoryCache.set(key, value);
        return value;
      }
    }

    return null;
  }

  /**
   * Delete from both caches
   */
  delete(key: string): void {
    memoryCache.delete(key);
    if (localStorageCache) {
      localStorageCache.delete(key);
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    memoryCache.clear();
    if (localStorageCache) {
      localStorageCache.clear();
    }
  }
}

/**
 * Cache key builders for common data types
 */
export const cacheKeys = {
  orders: (orderId: string) => `orders:${orderId}`,
  orderItems: (orderId: string) => `order-items:${orderId}`,
  orderHistory: (orderId: string, itemId?: string) =>
    itemId ? `order-history:${orderId}:${itemId}` : `order-history:${orderId}`,
  products: () => 'products',
  productById: (productId: string) => `product:${productId}`,
  search: (query: string) => `search:${query.toLowerCase()}`,
};
