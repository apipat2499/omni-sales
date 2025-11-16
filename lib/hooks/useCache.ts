import { useState, useCallback, useEffect } from 'react';
import { memoryCache, localStorageCache } from '@/lib/utils/cache';

interface UseCacheOptions {
  ttlMs?: number;
  fallbackToLocalStorage?: boolean;
  revalidateOnFocus?: boolean;
}

/**
 * Hook for caching API responses
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    ttlMs = 5 * 60 * 1000,
    fallbackToLocalStorage = false,
    revalidateOnFocus = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Check memory cache first
    const cached = memoryCache.get<T>(key);
    if (cached) {
      setData(cached);
      return;
    }

    // Check localStorage as fallback
    if (fallbackToLocalStorage && localStorageCache) {
      const storageCached = localStorageCache.get<T>(key);
      if (storageCached) {
        setData(storageCached);
        memoryCache.set(key, storageCached, ttlMs);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      memoryCache.set(key, result, ttlMs);
      if (localStorageCache) {
        localStorageCache.set(key, result, ttlMs);
      }
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      console.error('useCache error:', err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttlMs, fallbackToLocalStorage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetchData]);

  const invalidate = useCallback(() => {
    memoryCache.delete(key);
    if (localStorageCache) {
      localStorageCache.delete(key);
    }
    setData(null);
  }, [key]);

  const revalidate = useCallback(async () => {
    invalidate();
    await fetchData();
  }, [invalidate, fetchData]);

  return { data, loading, error, invalidate, revalidate };
}

/**
 * Hook for caching list data with sorting/filtering
 */
export function useCachedList<T>(
  key: string,
  fetcher: () => Promise<T[]>,
  options: UseCacheOptions = {}
) {
  const { data: cachedData, loading, error, invalidate, revalidate } = useCache(
    key,
    fetcher,
    options
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredData = useCallback(() => {
    if (!cachedData) return [];

    let result = [...cachedData];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortBy && sortOrder) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [cachedData, searchTerm, sortBy, sortOrder]);

  return {
    data: filteredData(),
    loading,
    error,
    invalidate,
    revalidate,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
}

/**
 * Hook for debounced cache updates
 */
export function useDebouncedCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  debounceMs: number = 500,
  options: Omit<UseCacheOptions, 'revalidateOnFocus'> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      memoryCache.set(key, result, options.ttlMs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options.ttlMs]);

  const debouncedFetch = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      fetchData();
    }, debounceMs);

    setTimeoutId(id);
  }, [fetchData, debounceMs, timeoutId]);

  const invalidate = useCallback(() => {
    memoryCache.delete(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setData(null);
  }, [key, timeoutId]);

  return { data, loading, error, fetch: debouncedFetch, invalidate };
}

/**
 * Hook for pagination with caching
 */
export function useCachedPagination<T>(
  key: string,
  fetcher: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>,
  pageSize: number = 10,
  options: UseCacheOptions = {}
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageKey = `${key}:page:${currentPage}`;

  const fetchPage = useCallback(async () => {
    // Check cache
    const cached = memoryCache.get<{ items: T[]; total: number }>(pageKey);
    if (cached) {
      setData(cached.items);
      setTotal(cached.total);
      return;
    }

    setLoading(true);
    try {
      const result = await fetcher(currentPage, pageSize);
      setData(result.items);
      setTotal(result.total);
      memoryCache.set(pageKey, result, options.ttlMs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pageKey, currentPage, pageSize, fetcher, options.ttlMs]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    goToPage: (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages || 1));
      setCurrentPage(validPage);
    },
    nextPage: () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    },
    prevPage: () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
  };
}
