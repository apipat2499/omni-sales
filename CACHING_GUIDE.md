# Caching Guide

ระบบแคชสำหรับปรับปรุงประสิทธิภาพของแอปพลิเคชัน

## 📚 Table of Contents

1. [Overview](#overview)
2. [Memory Cache](#memory-cache)
3. [LocalStorage Cache](#localstorage-cache)
4. [Hybrid Cache](#hybrid-cache)
5. [React Hooks](#react-hooks)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Overview

The caching system provides multiple strategies for storing and retrieving data:

- **MemoryCache**: Fast, in-memory cache (best for temporary data)
- **LocalStorageCache**: Persistent, browser storage (survives page refresh)
- **HybridCache**: Combines both for best performance
- **React Hooks**: Ready-to-use hooks for components

All caches support TTL (Time-To-Live) expiration and automatic cleanup.

---

## Memory Cache

Ultra-fast in-memory cache with automatic expiration.

### Usage

```typescript
import { memoryCache } from '@/lib/utils/cache';

// Set value (5 minute TTL by default)
memoryCache.set('products', products);

// Get value
const products = memoryCache.get('products');

// Check if exists
if (memoryCache.has('products')) {
  // Use cached value
}

// Delete specific key
memoryCache.delete('products');

// Invalidate all entries with tag
memoryCache.invalidateTag('products');

// Clear all
memoryCache.clear();

// Get cache size
console.log(memoryCache.size()); // Number of entries
```

### API

```typescript
set<T>(key: string, value: T, ttlMs?: number, tags?: string[]): void
get<T>(key: string): T | null
has(key: string): boolean
delete(key: string): void
invalidateTag(tag: string): void
clear(): void
size(): number
```

### Features

- ✅ No serialization overhead
- ✅ Automatic expiration
- ✅ Tag-based invalidation
- ✅ Periodic cleanup
- ❌ Lost on page refresh

---

## LocalStorage Cache

Persistent storage with JSON serialization.

### Usage

```typescript
import { localStorageCache } from '@/lib/utils/cache';

// Check if available (null in SSR)
if (localStorageCache) {
  // Set value
  localStorageCache.set('user-preferences', { theme: 'dark' });

  // Get value
  const prefs = localStorageCache.get('user-preferences');

  // Check if exists
  if (localStorageCache.has('user-preferences')) {
    // Use cached value
  }

  // Delete
  localStorageCache.delete('user-preferences');

  // Clear all
  localStorageCache.clear();
}
```

### API

```typescript
set<T>(key: string, value: T, ttlMs?: number): void
get<T>(key: string): T | null
has(key: string): boolean
delete(key: string): void
clear(): void
```

### Features

- ✅ Persists after page refresh
- ✅ Works across tabs
- ❌ Slower than memory cache
- ❌ Limited storage (usually 5-10MB)
- ❌ JSON serialization required
- ⚠️ Not available in SSR

---

## Hybrid Cache

Best of both worlds: fast memory cache with persistent fallback.

### Usage

```typescript
import { HybridCache } from '@/lib/utils/cache';

const cache = new HybridCache();

// Set in both memory and localStorage
cache.set('order-data', orderData);

// Get from memory first, fallback to localStorage
const data = cache.get('order-data');

// Delete from both
cache.delete('order-data');

// Clear all caches
cache.clear();
```

### Strategy

1. Check memory cache (fast)
2. If not found, check localStorage
3. If found in localStorage, restore to memory
4. Return value or null

---

## React Hooks

### useCache

Basic caching hook for fetching data.

```typescript
import { useCache } from '@/lib/hooks/useCache';

function MyComponent({ orderId }: { orderId: string }) {
  const { data, loading, error, invalidate, revalidate } = useCache(
    `orders:${orderId}`,
    async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      return res.json();
    },
    {
      ttlMs: 5 * 60 * 1000,              // 5 minutes
      fallbackToLocalStorage: true,      // Use localStorage
      revalidateOnFocus: true,           // Refresh when window focused
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
      <button onClick={invalidate}>Clear Cache</button>
      <button onClick={revalidate}>Refresh</button>
    </div>
  );
}
```

### useCachedList

Caching hook with built-in search and sorting.

```typescript
import { useCachedList } from '@/lib/hooks/useCache';

function ProductList() {
  const {
    data,
    loading,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useCachedList(
    'products',
    async () => {
      const res = await fetch('/api/products');
      return res.json();
    },
    { ttlMs: 10 * 60 * 1000 }
  );

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />

      <select value={sortBy || ''} onChange={(e) => setSortBy(e.target.value)}>
        <option value="">No sort</option>
        <option value="name">Name</option>
        <option value="price">Price</option>
      </select>

      <div>
        {data.map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    </div>
  );
}
```

### useDebouncedCache

Cache with debounced updates (useful for search).

```typescript
import { useDebouncedCache } from '@/lib/hooks/useCache';

function SearchBox() {
  const [query, setQuery] = useState('');
  const { data, loading, fetch } = useDebouncedCache(
    `search:${query}`,
    async () => {
      const res = await fetch(`/api/search?q=${query}`);
      return res.json();
    },
    500  // 500ms debounce
  );

  const handleSearch = (term: string) => {
    setQuery(term);
    fetch();
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {loading && <p>Searching...</p>}
      {data && <div>{data.length} results</div>}
    </div>
  );
}
```

### useCachedPagination

Pagination with caching per page.

```typescript
import { useCachedPagination } from '@/lib/hooks/useCache';

function OrdersList() {
  const {
    data,
    loading,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
  } = useCachedPagination(
    'orders',
    async (page, pageSize) => {
      const res = await fetch(`/api/orders?page=${page}&pageSize=${pageSize}`);
      return res.json();
    },
    10  // 10 items per page
  );

  return (
    <div>
      {data.map((order) => (
        <div key={order.id}>{order.name}</div>
      ))}

      <div>
        Page {currentPage} of {totalPages}
      </div>

      <button onClick={prevPage} disabled={currentPage === 1}>
        Previous
      </button>
      <button onClick={nextPage} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  );
}
```

---

## Utility Functions

### memoize

Memoize expensive computations.

```typescript
import { memoize } from '@/lib/utils/cache';

const expensiveCalculation = memoize(
  (a: number, b: number) => {
    console.log('Computing...');
    return a + b;
  },
  {
    maxSize: 50,
    ttlMs: 10 * 60 * 1000,
  }
);

expensiveCalculation(1, 2); // Logs "Computing..."
expensiveCalculation(1, 2); // No log (cached)
```

### swrCache

Stale-While-Revalidate pattern.

```typescript
import { swrCache } from '@/lib/utils/cache';

// Returns stale data immediately, fetches fresh in background
const data = await swrCache(
  'user-settings',
  async () => {
    const res = await fetch('/api/user/settings');
    return res.json();
  },
  {
    staleTtlMs: 60 * 1000,           // Show stale for 1 minute
    revalidateTtlMs: 24 * 60 * 60 * 1000,  // Keep fresh for 1 day
  }
);
```

---

## Cache Key Builders

Pre-built cache key generators for common data types.

```typescript
import { cacheKeys } from '@/lib/utils/cache';

// Orders
cacheKeys.orders('order-123');              // "orders:order-123"

// Order items
cacheKeys.orderItems('order-123');          // "order-items:order-123"

// Order history
cacheKeys.orderHistory('order-123');        // "order-history:order-123"
cacheKeys.orderHistory('order-123', 'item-1');  // "order-history:order-123:item-1"

// Products
cacheKeys.products();                       // "products"
cacheKeys.productById('product-1');         // "product:product-1"

// Search
cacheKeys.search('laptop');                 // "search:laptop"
```

---

## Best Practices

### 1. Choose the Right Cache

```typescript
// Fast, temporary data (< 1 minute)
memoryCache.set('loading-state', true);

// Persistent user preferences
localStorageCache.set('user-theme', 'dark');

// API responses (auto-refresh)
useCache('products', fetchProducts);
```

### 2. Use Appropriate TTL

```typescript
// Real-time data (1-5 minutes)
cache.set('current-price', price, 1 * 60 * 1000);

// Semi-static data (10-30 minutes)
cache.set('product-list', products, 15 * 60 * 1000);

// Static data (1 hour+)
cache.set('categories', categories, 60 * 60 * 1000);
```

### 3. Invalidate on Update

```typescript
async function updateProduct(id: string, data: Product) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  // Invalidate related caches
  memoryCache.delete(cacheKeys.productById(id));
  memoryCache.invalidateTag('products');

  return response.json();
}
```

### 4. Combine with Hooks

```typescript
function OrderItems({ orderId }: { orderId: string }) {
  const { data: items, loading, revalidate } = useCache(
    cacheKeys.orderItems(orderId),
    () => fetch(`/api/orders/${orderId}/items`).then(r => r.json())
  );

  const handleAddItem = async (item: OrderItem) => {
    await fetch(`/api/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });

    // Refresh cache after mutation
    revalidate();
  };

  return (
    // Component JSX
  );
}
```

### 5. Handle Errors Gracefully

```typescript
const { data, error, invalidate } = useCache(
  'order-data',
  fetchOrderData
);

if (error) {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={() => {
        invalidate();
        // Retry fetch
      }}>
        Retry
      </button>
    </div>
  );
}
```

---

## Examples

### Example 1: Cached API Hook

```typescript
// Custom hook for orders
function useOrders(orderId: string) {
  return useCache(
    cacheKeys.orders(orderId),
    async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    {
      ttlMs: 5 * 60 * 1000,
      revalidateOnFocus: true,
    }
  );
}

// Usage in component
function OrderPage({ orderId }: { orderId: string }) {
  const { data: order, loading, error } = useOrders(orderId);

  // Rest of component...
}
```

### Example 2: Search with Debounce

```typescript
function ProductSearch() {
  const [query, setQuery] = useState('');
  const { data: results, loading, fetch } = useDebouncedCache(
    cacheKeys.search(query),
    async () => {
      const res = await fetch(`/api/products/search?q=${query}`);
      return res.json();
    },
    300
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          fetch();
        }}
        placeholder="Search products..."
      />
      {loading && <div>Searching...</div>}
      {results && (
        <ul>
          {results.map((product) => (
            <li key={product.id}>{product.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Example 3: Tag-Based Invalidation

```typescript
// Cache products with "products" tag
memoryCache.set('products-page-1', data, 5 * 60 * 1000, ['products']);
memoryCache.set('products-page-2', data, 5 * 60 * 1000, ['products']);

// Later, when product is created/updated
async function createProduct(product: Product) {
  const response = await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });

  // Invalidate all products caches at once
  memoryCache.invalidateTag('products');

  return response.json();
}
```

---

## Performance Tips

1. **Monitor cache size**: Use `memoryCache.size()` to track entries
2. **Set reasonable TTLs**: Balance freshness with performance
3. **Use tags for groups**: Related data with one invalidation
4. **Combine with React.memo**: Prevent unnecessary re-renders
5. **Use pagination**: Don't cache large lists
6. **Enable localStorage**: For data that survives page refreshes
7. **Implement SWR**: For better user experience with stale data

---

## Troubleshooting

### Data not updating

```typescript
// Force revalidation
const { revalidate } = useCache(key, fetcher);
await revalidate();

// Or manually invalidate
memoryCache.delete(key);
```

### Cache too large

```typescript
// Clear specific cache
memoryCache.delete(key);

// Clear all
memoryCache.clear();

// Monitor size
if (memoryCache.size() > 100) {
  memoryCache.clear();
}
```

### LocalStorage quota exceeded

```typescript
try {
  localStorageCache.set(key, value);
} catch (err) {
  // Storage full, clear old entries
  localStorageCache.clear();
  localStorageCache.set(key, value);
}
```

---

## See Also

- `lib/utils/cache.ts` - Core cache implementations
- `lib/hooks/useCache.ts` - React hooks
- Cache key builders: `cacheKeys`
