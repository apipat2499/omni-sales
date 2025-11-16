import { getCacheManager, generateCacheKey, CACHE_NAMESPACES, TTL_CONFIG, type CacheTag } from '../cache-manager';
import { getSupabaseClient } from '@/lib/supabase/client';

const cache = getCacheManager();
const CATEGORY_TTL = TTL_CONFIG.VERY_LONG; // 6 hours - categories change infrequently

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all categories with caching
 */
export async function getCachedCategories(): Promise<Category[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CATEGORY, 'all');

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data, error } = await client
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data as Category[];
    },
    CATEGORY_TTL,
    [{ namespace: CACHE_NAMESPACES.CATEGORY, resource: 'all' }]
  );
}

/**
 * Get category by ID with caching
 */
export async function getCachedCategory(categoryId: string): Promise<Category | null> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CATEGORY, 'detail', categoryId);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) {
        console.error('Error fetching category:', error);
        return null;
      }

      return data as Category;
    },
    CATEGORY_TTL,
    [
      { namespace: CACHE_NAMESPACES.CATEGORY, resource: 'detail', id: categoryId },
      { namespace: CACHE_NAMESPACES.CATEGORY, resource: 'all' },
    ]
  );
}

/**
 * Get category by name with caching
 */
export async function getCachedCategoryByName(name: string): Promise<Category | null> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CATEGORY, 'name', name);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        console.error('Error fetching category by name:', error);
        return null;
      }

      return data as Category;
    },
    CATEGORY_TTL,
    [
      { namespace: CACHE_NAMESPACES.CATEGORY, resource: 'name', id: name },
      { namespace: CACHE_NAMESPACES.CATEGORY, resource: 'all' },
    ]
  );
}

/**
 * Get subcategories with caching
 */
export async function getCachedSubcategories(parentId: string): Promise<Category[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CATEGORY, 'children', parentId);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .order('name');

      if (error) {
        console.error('Error fetching subcategories:', error);
        return [];
      }

      return data as Category[];
    },
    CATEGORY_TTL,
    [
      { namespace: CACHE_NAMESPACES.CATEGORY, resource: 'children', id: parentId },
      { namespace: CACHE_NAMESPACES.CATEGORY, resource: 'all' },
    ]
  );
}

/**
 * Get category hierarchy with caching
 */
export async function getCachedCategoryHierarchy(): Promise<Category[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CATEGORY, 'hierarchy');

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const categories = await getCachedCategories();

      // Build hierarchy
      const categoryMap = new Map<string, Category & { children: Category[] }>();
      const rootCategories: (Category & { children: Category[] })[] = [];

      // First pass: create map
      for (const category of categories) {
        categoryMap.set(category.id, { ...category, children: [] });
      }

      // Second pass: build tree
      for (const category of categories) {
        const node = categoryMap.get(category.id)!;

        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(node);
          } else {
            rootCategories.push(node);
          }
        } else {
          rootCategories.push(node);
        }
      }

      return rootCategories;
    },
    CATEGORY_TTL,
    [{ namespace: CACHE_NAMESPACES.CATEGORY, resource: 'hierarchy' }]
  );
}

/**
 * Get product count by category with caching
 */
export async function getCachedCategoryProductCount(categoryId: string): Promise<number> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CATEGORY, 'count', categoryId);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return 0;

      const { count, error } = await client
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (error) {
        console.error('Error counting products in category:', error);
        return 0;
      }

      return count || 0;
    },
    TTL_CONFIG.MEDIUM, // 30 minutes - product counts change more frequently
    [
      { namespace: CACHE_NAMESPACES.CATEGORY, resource: 'count', id: categoryId },
    ]
  );
}

/**
 * Invalidate category cache
 */
export async function invalidateCategoryCache(categoryId?: string): Promise<void> {
  if (categoryId) {
    // Invalidate specific category
    await cache.invalidateByTag({
      namespace: CACHE_NAMESPACES.CATEGORY,
      resource: 'detail',
      id: categoryId,
    });

    // Invalidate children cache
    await cache.invalidateByTag({
      namespace: CACHE_NAMESPACES.CATEGORY,
      resource: 'children',
      id: categoryId,
    });
  }

  // Invalidate all categories and hierarchy
  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.CATEGORY,
    resource: 'all',
  });

  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.CATEGORY,
    resource: 'hierarchy',
  });
}

/**
 * Warm category cache
 */
export async function warmCategoryCache(): Promise<void> {
  // Pre-load all categories
  await getCachedCategories();

  // Pre-load hierarchy
  await getCachedCategoryHierarchy();

  console.log('Category cache warmed successfully');
}
