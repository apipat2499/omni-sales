/**
 * Performance optimization utilities
 */

/**
 * Debounce function - delay execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - execute at most once per time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(selector: string = 'img[data-src]') {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.getAttribute('data-src');

        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll(selector).forEach((img) => {
    imageObserver.observe(img);
  });
}

/**
 * Chunk large arrays for processing
 */
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);

    // Allow UI to update between chunks
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Virtual scrolling helper for large lists
 */
export class VirtualScroller<T> {
  private items: T[];
  private itemHeight: number;
  private containerHeight: number;
  private overscan: number;

  constructor(items: T[], itemHeight: number, containerHeight: number, overscan = 3) {
    this.items = items;
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.overscan = overscan;
  }

  getVisibleRange(scrollTop: number): { start: number; end: number; offsetTop: number } {
    const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const end = Math.min(this.items.length, start + visibleCount + this.overscan * 2);

    return {
      start,
      end,
      offsetTop: start * this.itemHeight,
    };
  }

  getVisibleItems(scrollTop: number): T[] {
    const { start, end } = this.getVisibleRange(scrollTop);
    return this.items.slice(start, end);
  }

  getTotalHeight(): number {
    return this.items.length * this.itemHeight;
  }
}

/**
 * Local storage with TTL support
 */
export class CachedStorage {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  set(key: string, value: any, ttl?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    this.storage.setItem(key, JSON.stringify(item));
  }

  get<T>(key: string): T | null {
    const itemStr = this.storage.getItem(key);

    if (!itemStr) {
      return null;
    }

    try {
      const item = JSON.parse(itemStr);

      // Check if expired
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.storage.removeItem(key);
        return null;
      }

      return item.value as T;
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  cleanup(): void {
    const keys = Object.keys(this.storage);

    keys.forEach((key) => {
      this.get(key); // This will remove expired items
    });
  }
}

/**
 * Request deduplication
 */
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>();

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();
