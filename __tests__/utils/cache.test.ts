/**
 * Unit tests for cache utilities
 */
import {
  memoryCache,
  localStorageCache,
  HybridCache,
  memoize,
  cacheKeys,
} from '@/lib/utils/cache';

describe('MemoryCache', () => {
  beforeEach(() => {
    memoryCache.clear();
  });

  afterEach(() => {
    memoryCache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      memoryCache.set('test-key', { data: 'test-value' });
      const result = memoryCache.get('test-key');
      expect(result).toEqual({ data: 'test-value' });
    });

    it('should return null for non-existent keys', () => {
      const result = memoryCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should respect TTL and expire entries', () => {
      memoryCache.set('expire-key', 'value', 100);

      // Should exist immediately
      expect(memoryCache.get('expire-key')).toBe('value');

      // Advance time past TTL
      advanceMockTime(150);

      // Should be expired
      expect(memoryCache.get('expire-key')).toBeNull();
    });

    it('should handle different data types', () => {
      memoryCache.set('string', 'hello');
      memoryCache.set('number', 123);
      memoryCache.set('object', { a: 1, b: 2 });
      memoryCache.set('array', [1, 2, 3]);
      memoryCache.set('boolean', true);

      expect(memoryCache.get('string')).toBe('hello');
      expect(memoryCache.get('number')).toBe(123);
      expect(memoryCache.get('object')).toEqual({ a: 1, b: 2 });
      expect(memoryCache.get('array')).toEqual([1, 2, 3]);
      expect(memoryCache.get('boolean')).toBe(true);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      memoryCache.set('key', 'value');
      expect(memoryCache.has('key')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(memoryCache.has('non-existent')).toBe(false);
    });

    it('should return false for expired keys', () => {
      memoryCache.set('expire-key', 'value', 100);
      advanceMockTime(150);
      expect(memoryCache.has('expire-key')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove entries', () => {
      memoryCache.set('key', 'value');
      expect(memoryCache.has('key')).toBe(true);

      memoryCache.delete('key');
      expect(memoryCache.has('key')).toBe(false);
    });
  });

  describe('invalidateTag', () => {
    it('should invalidate all entries with a specific tag', () => {
      memoryCache.set('key1', 'value1', 5000, ['tag-a']);
      memoryCache.set('key2', 'value2', 5000, ['tag-a']);
      memoryCache.set('key3', 'value3', 5000, ['tag-b']);

      memoryCache.invalidateTag('tag-a');

      expect(memoryCache.has('key1')).toBe(false);
      expect(memoryCache.has('key2')).toBe(false);
      expect(memoryCache.has('key3')).toBe(true);
    });

    it('should handle entries with multiple tags', () => {
      memoryCache.set('key1', 'value1', 5000, ['tag-a', 'tag-b']);
      memoryCache.set('key2', 'value2', 5000, ['tag-b']);

      memoryCache.invalidateTag('tag-a');

      expect(memoryCache.has('key1')).toBe(false);
      expect(memoryCache.has('key2')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      memoryCache.set('key1', 'value1');
      memoryCache.set('key2', 'value2');
      memoryCache.set('key3', 'value3');

      expect(memoryCache.size()).toBe(3);
      memoryCache.clear();
      expect(memoryCache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(memoryCache.size()).toBe(0);

      memoryCache.set('key1', 'value1');
      expect(memoryCache.size()).toBe(1);

      memoryCache.set('key2', 'value2');
      expect(memoryCache.size()).toBe(2);

      memoryCache.delete('key1');
      expect(memoryCache.size()).toBe(1);
    });
  });
});

describe('LocalStorageCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve values in localStorage', () => {
    localStorageCache?.set('test-key', { data: 'test-value' });
    const result = localStorageCache?.get('test-key');
    expect(result).toEqual({ data: 'test-value' });
  });

  it('should return null for non-existent keys', () => {
    const result = localStorageCache?.get('non-existent');
    expect(result).toBeNull();
  });

  it('should respect TTL', () => {
    localStorageCache?.set('expire-key', 'value', 100);

    expect(localStorageCache?.get('expire-key')).toBe('value');

    advanceMockTime(150);

    expect(localStorageCache?.get('expire-key')).toBeNull();
  });

  it('should handle has() correctly', () => {
    localStorageCache?.set('key', 'value');
    expect(localStorageCache?.has('key')).toBe(true);
    expect(localStorageCache?.has('non-existent')).toBe(false);
  });

  it('should delete entries', () => {
    localStorageCache?.set('key', 'value');
    expect(localStorageCache?.has('key')).toBe(true);

    localStorageCache?.delete('key');
    expect(localStorageCache?.has('key')).toBe(false);
  });

  it('should clear all entries', () => {
    localStorageCache?.set('key1', 'value1');
    localStorageCache?.set('key2', 'value2');

    localStorageCache?.clear();

    expect(localStorageCache?.has('key1')).toBe(false);
    expect(localStorageCache?.has('key2')).toBe(false);
  });
});

describe('HybridCache', () => {
  let hybridCache: HybridCache;

  beforeEach(() => {
    memoryCache.clear();
    localStorage.clear();
    hybridCache = new HybridCache();
  });

  afterEach(() => {
    memoryCache.clear();
    localStorage.clear();
  });

  it('should store in both memory and localStorage', () => {
    hybridCache.set('key', 'value');

    expect(memoryCache.has('key')).toBe(true);
    expect(localStorageCache?.has('key')).toBe(true);
  });

  it('should retrieve from memory cache first', () => {
    hybridCache.set('key', 'value');

    // Clear memory cache to test localStorage fallback
    memoryCache.delete('key');

    const result = hybridCache.get('key');
    expect(result).toBe('value');

    // Should restore to memory cache
    expect(memoryCache.has('key')).toBe(true);
  });

  it('should delete from both caches', () => {
    hybridCache.set('key', 'value');
    hybridCache.delete('key');

    expect(memoryCache.has('key')).toBe(false);
    expect(localStorageCache?.has('key')).toBe(false);
  });

  it('should clear both caches', () => {
    hybridCache.set('key1', 'value1');
    hybridCache.set('key2', 'value2');

    hybridCache.clear();

    expect(memoryCache.size()).toBe(0);
    expect(localStorageCache?.has('key1')).toBe(false);
    expect(localStorageCache?.has('key2')).toBe(false);
  });
});

describe('memoize', () => {
  it('should cache function results', () => {
    let callCount = 0;
    const expensiveFn = (a: number, b: number) => {
      callCount++;
      return a + b;
    };

    const memoized = memoize(expensiveFn);

    expect(memoized(1, 2)).toBe(3);
    expect(callCount).toBe(1);

    // Second call with same args should use cache
    expect(memoized(1, 2)).toBe(3);
    expect(callCount).toBe(1);

    // Different args should call function again
    expect(memoized(2, 3)).toBe(5);
    expect(callCount).toBe(2);
  });

  it('should use custom key generator', () => {
    let callCount = 0;
    const fn = (obj: { id: number; name: string }) => {
      callCount++;
      return obj.name.toUpperCase();
    };

    const memoized = memoize(fn, {
      keyGenerator: (obj) => obj.id.toString(),
    });

    const obj1 = { id: 1, name: 'test' };
    const obj2 = { id: 1, name: 'different' }; // Same ID, different name

    expect(memoized(obj1)).toBe('TEST');
    expect(callCount).toBe(1);

    // Should use cache because ID is the same
    expect(memoized(obj2)).toBe('TEST');
    expect(callCount).toBe(1);
  });

  it('should respect maxSize', () => {
    let callCount = 0;
    const fn = (n: number) => {
      callCount++;
      return n * 2;
    };

    const memoized = memoize(fn, { maxSize: 2 });

    memoized(1); // callCount = 1
    memoized(2); // callCount = 2
    memoized(3); // callCount = 3, exceeds maxSize, clears cache

    // Cache was cleared, so this should call the function again
    memoized(1); // callCount = 4

    expect(callCount).toBe(4);
  });

  it('should respect TTL', () => {
    let callCount = 0;
    const fn = (n: number) => {
      callCount++;
      return n * 2;
    };

    const memoized = memoize(fn, { ttlMs: 100 });

    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(1);

    // Within TTL, should use cache
    advanceMockTime(50);
    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(1);

    // After TTL, should call function again
    advanceMockTime(100);
    expect(memoized(5)).toBe(10);
    expect(callCount).toBe(2);
  });
});

describe('cacheKeys', () => {
  it('should generate correct cache keys', () => {
    expect(cacheKeys.orders('123')).toBe('orders:123');
    expect(cacheKeys.orderItems('456')).toBe('order-items:456');
    expect(cacheKeys.orderHistory('789')).toBe('order-history:789');
    expect(cacheKeys.orderHistory('789', 'item-1')).toBe('order-history:789:item-1');
    expect(cacheKeys.products()).toBe('products');
    expect(cacheKeys.productById('prod-123')).toBe('product:prod-123');
    expect(cacheKeys.search('Test Query')).toBe('search:test query');
  });

  it('should lowercase search queries', () => {
    expect(cacheKeys.search('UPPERCASE')).toBe('search:uppercase');
    expect(cacheKeys.search('MiXeD CaSe')).toBe('search:mixed case');
  });
});
