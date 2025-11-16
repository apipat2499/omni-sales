import { getCacheManager, generateCacheKey, CACHE_NAMESPACES, TTL_CONFIG, type CacheTag } from '../cache-manager';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { DbProduct } from '@/lib/supabase/database';

const cache = getCacheManager();
const PRODUCT_TTL = TTL_CONFIG.LONG; // 1 hour

/**
 * Get product by ID with caching
 */
export async function getCachedProduct(productId: string): Promise<DbProduct | null> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.PRODUCT, 'detail', productId);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return data as DbProduct;
    },
    PRODUCT_TTL,
    [
      { namespace: CACHE_NAMESPACES.PRODUCT, resource: 'detail', id: productId },
      { namespace: CACHE_NAMESPACES.PRODUCT, resource: 'all' },
    ]
  );
}

/**
 * Get products by category with caching
 */
export async function getCachedProductsByCategory(category: string): Promise<DbProduct[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.PRODUCT, 'category', category);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('category', category)
        .order('name');

      if (error) {
        console.error('Error fetching products by category:', error);
        return [];
      }

      return data as DbProduct[];
    },
    PRODUCT_TTL,
    [
      { namespace: CACHE_NAMESPACES.PRODUCT, resource: 'category', id: category },
      { namespace: CACHE_NAMESPACES.PRODUCT, resource: 'all' },
    ]
  );
}

/**
 * Get all products with caching
 */
export async function getCachedProducts(filters?: {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}): Promise<DbProduct[]> {
  const filterKey = JSON.stringify(filters || {});
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.PRODUCT, 'list', filterKey);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      let query = client.from('products').select('*');

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.inStock) {
        query = query.gt('stock', 0);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return data as DbProduct[];
    },
    PRODUCT_TTL,
    [{ namespace: CACHE_NAMESPACES.PRODUCT, resource: 'all' }]
  );
}

/**
 * Get product by SKU with caching
 */
export async function getCachedProductBySKU(sku: string): Promise<DbProduct | null> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.PRODUCT, 'sku', sku);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single();

      if (error) {
        console.error('Error fetching product by SKU:', error);
        return null;
      }

      return data as DbProduct;
    },
    PRODUCT_TTL,
    [
      { namespace: CACHE_NAMESPACES.PRODUCT, resource: 'sku', id: sku },
      { namespace: CACHE_NAMESPACES.PRODUCT, resource: 'all' },
    ]
  );
}

/**
 * Get low stock products with caching
 */
export async function getCachedLowStockProducts(threshold = 10): Promise<DbProduct[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.PRODUCT, 'low-stock', String(threshold));

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data, error } = await client
        .from('products')
        .select('*')
        .lt('stock', threshold)
        .order('stock', { ascending: true });

      if (error) {
        console.error('Error fetching low stock products:', error);
        return [];
      }

      return data as DbProduct[];
    },
    TTL_CONFIG.SHORT, // 5 minutes - inventory changes frequently
    [{ namespace: CACHE_NAMESPACES.PRODUCT, resource: 'inventory' }]
  );
}

/**
 * Invalidate product cache
 */
export async function invalidateProductCache(productId?: string): Promise<void> {
  if (productId) {
    // Invalidate specific product
    await cache.invalidateByTag({
      namespace: CACHE_NAMESPACES.PRODUCT,
      resource: 'detail',
      id: productId,
    });
  }

  // Invalidate all products list
  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.PRODUCT,
    resource: 'all',
  });
}

/**
 * Invalidate products by category
 */
export async function invalidateProductCategoryCache(category: string): Promise<void> {
  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.PRODUCT,
    resource: 'category',
    id: category,
  });

  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.PRODUCT,
    resource: 'all',
  });
}

/**
 * Warm product cache with popular items
 */
export async function warmProductCache(productIds: string[]): Promise<number> {
  const entries = await Promise.all(
    productIds.map(async (id) => {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data } = await client.from('products').select('*').eq('id', id).single();

      if (data) {
        return {
          key: generateCacheKey(CACHE_NAMESPACES.PRODUCT, 'detail', id),
          value: data,
          ttl: PRODUCT_TTL,
          tags: [
            { namespace: CACHE_NAMESPACES.PRODUCT, resource: 'detail', id },
            { namespace: CACHE_NAMESPACES.PRODUCT, resource: 'all' },
          ] as CacheTag[],
        };
      }
      return null;
    })
  );

  const validEntries = entries.filter((e): e is NonNullable<typeof e> => e !== null);
  return await cache.warm(validEntries);
}
