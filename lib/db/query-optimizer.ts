import { getSupabaseClient } from '../supabase/client';
import { getCacheManager, generateCacheKey, CACHE_NAMESPACES, type CacheTag } from '../cache/cache-manager';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Query optimization options
 */
export interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  cacheTags?: CacheTag[];
  timeout?: number;
  maxRetries?: number;
}

/**
 * Batch query options
 */
export interface BatchQueryOptions {
  batchSize?: number;
  parallel?: boolean;
}

/**
 * Query result with metadata
 */
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  cached: boolean;
  executionTime: number;
}

/**
 * Database Query Optimizer
 * Provides query result caching, batch operations, and N+1 prevention
 */
export class QueryOptimizer {
  private cache = getCacheManager();
  private queryTimeout: number;
  private pendingQueries: Map<string, Promise<any>> = new Map();

  constructor() {
    this.queryTimeout = Number(process.env.DB_QUERY_TIMEOUT) || 30000; // 30 seconds default
  }

  /**
   * Execute query with caching
   */
  async query<T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const {
      cache = true,
      cacheTTL,
      cacheTags,
      timeout = this.queryTimeout,
      maxRetries = 3,
    } = options;

    try {
      // Check cache first
      if (cache) {
        const cached = await this.cache.get<T>(cacheKey);
        if (cached !== null) {
          return {
            data: cached,
            error: null,
            cached: true,
            executionTime: Date.now() - startTime,
          };
        }
      }

      // Check for pending query (N+1 prevention)
      if (this.pendingQueries.has(cacheKey)) {
        const result = await this.pendingQueries.get(cacheKey);
        return {
          data: result,
          error: null,
          cached: false,
          executionTime: Date.now() - startTime,
        };
      }

      // Execute query with timeout and retry
      const queryPromise = this.executeWithTimeout(queryFn, timeout, maxRetries);
      this.pendingQueries.set(cacheKey, queryPromise);

      try {
        const result = await queryPromise;

        // Cache the result
        if (cache && result !== null) {
          await this.cache.set(cacheKey, result, cacheTTL, cacheTags);
        }

        return {
          data: result,
          error: null,
          cached: false,
          executionTime: Date.now() - startTime,
        };
      } finally {
        this.pendingQueries.delete(cacheKey);
      }
    } catch (error) {
      console.error('Query execution error:', error);
      return {
        data: null,
        error: error as Error,
        cached: false,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute query with timeout
   */
  private async executeWithTimeout<T>(
    queryFn: () => Promise<T>,
    timeout: number,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), timeout);
        });

        return await Promise.race([queryFn(), timeoutPromise]);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Query attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Query failed after retries');
  }

  /**
   * Batch query execution
   * Prevents N+1 queries by batching multiple queries together
   */
  async batchQuery<T, K extends string | number>(
    ids: K[],
    fetchFn: (ids: K[]) => Promise<T[]>,
    options: BatchQueryOptions & QueryOptions = {}
  ): Promise<T[]> {
    const { batchSize = 100, parallel = true, cache = true, cacheTTL } = options;

    // Split into batches
    const batches: K[][] = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    // Check cache for each ID
    const results: (T | null)[] = new Array(ids.length).fill(null);
    const uncachedIndices: number[] = [];
    const uncachedIds: K[] = [];

    if (cache) {
      for (let i = 0; i < ids.length; i++) {
        const cacheKey = generateCacheKey(CACHE_NAMESPACES.QUERY, 'batch', String(ids[i]));
        const cached = await this.cache.get<T>(cacheKey);

        if (cached !== null) {
          results[i] = cached;
        } else {
          uncachedIndices.push(i);
          uncachedIds.push(ids[i]);
        }
      }
    } else {
      uncachedIndices.push(...ids.map((_, i) => i));
      uncachedIds.push(...ids);
    }

    // If all cached, return early
    if (uncachedIds.length === 0) {
      return results as T[];
    }

    // Execute batches
    const batchResults = parallel
      ? await Promise.all(batches.map(batch => fetchFn(batch)))
      : [];

    if (!parallel) {
      for (const batch of batches) {
        const result = await fetchFn(batch);
        batchResults.push(result);
      }
    }

    // Flatten batch results
    const fetchedResults = batchResults.flat();

    // Map fetched results to original positions and cache them
    for (let i = 0; i < uncachedIndices.length; i++) {
      const index = uncachedIndices[i];
      const result = fetchedResults[i];

      if (result) {
        results[index] = result;

        // Cache individual result
        if (cache) {
          const cacheKey = generateCacheKey(CACHE_NAMESPACES.QUERY, 'batch', String(uncachedIds[i]));
          await this.cache.set(cacheKey, result, cacheTTL);
        }
      }
    }

    return results.filter(r => r !== null) as T[];
  }

  /**
   * Prefetch related data to prevent N+1 queries
   */
  async prefetch<T, R>(
    items: T[],
    relationKey: keyof T,
    fetchFn: (ids: any[]) => Promise<R[]>,
    mapFn: (item: R) => any
  ): Promise<Map<any, R>> {
    // Extract unique IDs
    const ids = [...new Set(items.map(item => item[relationKey]))];

    // Batch fetch related data
    const relatedData = await this.batchQuery(ids as any[], fetchFn);

    // Create lookup map
    const lookupMap = new Map<any, R>();
    for (const data of relatedData) {
      const key = mapFn(data);
      lookupMap.set(key, data);
    }

    return lookupMap;
  }

  /**
   * Execute multiple queries in parallel with caching
   */
  async parallel<T extends Record<string, any>>(
    queries: Record<keyof T, { queryFn: () => Promise<any>; cacheKey: string; options?: QueryOptions }>
  ): Promise<T> {
    const keys = Object.keys(queries) as (keyof T)[];
    const promises = keys.map(key => {
      const { queryFn, cacheKey, options } = queries[key];
      return this.query(queryFn, cacheKey, options);
    });

    const results = await Promise.all(promises);

    const data: any = {};
    for (let i = 0; i < keys.length; i++) {
      data[keys[i]] = results[i].data;
    }

    return data as T;
  }

  /**
   * Invalidate query cache
   */
  async invalidateQuery(cacheKey: string): Promise<void> {
    await this.cache.del(cacheKey);
  }

  /**
   * Invalidate multiple queries by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    return await this.cache.invalidateByPattern(pattern);
  }

  /**
   * Measure query performance
   */
  async measureQuery<T>(
    name: string,
    queryFn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      console.warn(`Slow query detected: ${name} took ${duration}ms`);
    }

    return { result, duration };
  }
}

/**
 * Helper functions for common query patterns
 */

/**
 * Get single record with caching
 */
export async function getById<T>(
  table: string,
  id: string,
  options: QueryOptions = {}
): Promise<T | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const optimizer = new QueryOptimizer();
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.QUERY, table, id);

  const result = await optimizer.query(
    async () => {
      const { data, error } = await client.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data as T;
    },
    cacheKey,
    options
  );

  return result.data;
}

/**
 * Get multiple records with caching
 */
export async function getMany<T>(
  table: string,
  filters?: Record<string, any>,
  options: QueryOptions = {}
): Promise<T[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const optimizer = new QueryOptimizer();
  const cacheKey = generateCacheKey(
    CACHE_NAMESPACES.QUERY,
    table,
    JSON.stringify(filters || {})
  );

  const result = await optimizer.query(
    async () => {
      let query = client.from(table).select('*');

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
    cacheKey,
    options
  );

  return result.data || [];
}

/**
 * Get records by IDs with batching
 */
export async function getByIds<T>(
  table: string,
  ids: string[],
  options: QueryOptions & BatchQueryOptions = {}
): Promise<T[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const optimizer = new QueryOptimizer();

  return await optimizer.batchQuery(
    ids,
    async (batchIds) => {
      const { data, error } = await client.from(table).select('*').in('id', batchIds);
      if (error) throw error;
      return data as T[];
    },
    options
  );
}

/**
 * Count records with caching
 */
export async function count(
  table: string,
  filters?: Record<string, any>,
  options: QueryOptions = {}
): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;

  const optimizer = new QueryOptimizer();
  const cacheKey = generateCacheKey(
    CACHE_NAMESPACES.QUERY,
    `${table}:count`,
    JSON.stringify(filters || {})
  );

  const result = await optimizer.query(
    async () => {
      let query = client.from(table).select('id', { count: 'exact', head: true });

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    cacheKey,
    options
  );

  return result.data || 0;
}

// Export singleton instance
export const queryOptimizer = new QueryOptimizer();
export default queryOptimizer;
