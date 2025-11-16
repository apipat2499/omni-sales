/**
 * useSearchEngine Hook
 *
 * Manages search state, history, and saved searches
 *
 * Features:
 * - Real-time search with debouncing
 * - Search history tracking
 * - Saved searches CRUD
 * - Result caching
 * - Search statistics
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { OrderItem, Product, Order } from '@/types';
import type { OrderTemplate } from '@/lib/utils/order-templates';
import {
  search,
  searchWithFilters,
  parseQuery,
  type SearchQuery,
  type SearchResult,
  type SearchScope,
  type SearchFilter,
  type EntityType,
  buildSearchIndex,
} from '@/lib/utils/search-engine';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter[];
  scope: SearchScope;
  tags: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  useCount: number;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  scope: SearchScope;
  resultCount: number;
  timestamp: Date;
}

export interface SearchCache {
  query: string;
  results: SearchResult<any>[];
  timestamp: number;
  ttl: number; // Time to live in ms
}

export interface SearchStatistics {
  totalSearches: number;
  averageResultCount: number;
  mostSearchedTerms: Array<{ term: string; count: number }>;
  recentSearches: SearchHistoryEntry[];
  savedSearchCount: number;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  HISTORY: 'search_history',
  SAVED_SEARCHES: 'saved_searches',
  PREFERENCES: 'search_preferences',
};

const MAX_HISTORY_ENTRIES = 100;
const MAX_SAVED_SEARCHES = 50;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 300;

// ============================================
// HOOK
// ============================================

export interface UseSearchEngineOptions {
  autoSearch?: boolean;
  debounceMs?: number;
  cacheResults?: boolean;
  trackHistory?: boolean;
}

export interface UseSearchEngineReturn {
  // State
  query: string;
  scope: SearchScope;
  results: SearchResult<any>[];
  isSearching: boolean;
  filters: SearchFilter[];
  error: string | null;

  // Actions
  setQuery: (query: string) => void;
  setScope: (scope: SearchScope) => void;
  search: (customQuery?: string, customScope?: SearchScope) => void;
  clearResults: () => void;

  // Filters
  addFilter: (filter: SearchFilter) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;
  updateFilter: (filterId: string, updates: Partial<SearchFilter>) => void;

  // Saved searches
  saveSearch: (name: string, tags?: string[]) => void;
  loadSavedSearch: (searchId: string) => void;
  deleteSavedSearch: (searchId: string) => void;
  updateSavedSearch: (searchId: string, updates: Partial<SavedSearch>) => void;
  getSavedSearches: () => SavedSearch[];

  // History
  getSearchHistory: () => SearchHistoryEntry[];
  clearHistory: () => void;
  deleteHistoryEntry: (entryId: string) => void;

  // Statistics
  getResultCount: () => number;
  getResultsByType: () => Record<EntityType, number>;
  getStatistics: () => SearchStatistics;

  // Advanced
  buildIndex: () => void;
  getCachedResults: (query: string) => SearchResult<any>[] | null;
}

export function useSearchEngine(
  entities: {
    items?: OrderItem[];
    products?: Product[];
    orders?: Order[];
    templates?: OrderTemplate[];
  },
  options: UseSearchEngineOptions = {}
): UseSearchEngineReturn {
  const {
    autoSearch = false,
    debounceMs = DEBOUNCE_DELAY,
    cacheResults = true,
    trackHistory = true,
  } = options;

  // State
  const [query, setQueryState] = useState('');
  const [scope, setScopeState] = useState<SearchScope>('all');
  const [results, setResults] = useState<SearchResult<any>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, SearchCache>>(new Map());

  // Build search index on mount or when entities change
  useEffect(() => {
    try {
      buildSearchIndex(
        entities.items || [],
        entities.products || [],
        entities.orders || [],
        entities.templates || []
      );
    } catch (err) {
      console.error('Error building search index:', err);
    }
  }, [entities.items, entities.products, entities.orders, entities.templates]);

  // Auto-search when query changes
  useEffect(() => {
    if (autoSearch && query) {
      performSearch(query, scope);
    }
  }, [query, scope, filters, autoSearch]);

  /**
   * Perform search
   */
  const performSearch = useCallback(
    (searchQuery: string, searchScope: SearchScope = scope) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce search
      debounceTimerRef.current = setTimeout(() => {
        try {
          setIsSearching(true);
          setError(null);

          // Check cache
          const cacheKey = `${searchQuery}:${searchScope}:${JSON.stringify(filters)}`;
          const cached = getCachedResults(cacheKey);

          if (cached && cacheResults) {
            setResults(cached);
            setIsSearching(false);
            return;
          }

          // Perform search
          const searchQueryObj: SearchQuery = {
            text: searchQuery,
            filters: {},
            modifiers: [],
            scope: searchScope,
            limit: 100,
          };

          let searchResults = search(searchQueryObj, entities);

          // Apply filters if any
          if (filters.length > 0) {
            searchResults = searchResults.filter((result) => {
              return filters.every((filter) => {
                const value = (result.entity as any)[filter.field];
                switch (filter.operator) {
                  case '=':
                    return value === filter.value;
                  case '!=':
                    return value !== filter.value;
                  case '>':
                    return Number(value) > Number(filter.value);
                  case '<':
                    return Number(value) < Number(filter.value);
                  case '>=':
                    return Number(value) >= Number(filter.value);
                  case '<=':
                    return Number(value) <= Number(filter.value);
                  case 'contains':
                    return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                  default:
                    return true;
                }
              });
            });
          }

          setResults(searchResults);

          // Cache results
          if (cacheResults) {
            cacheRef.current.set(cacheKey, {
              query: cacheKey,
              results: searchResults,
              timestamp: Date.now(),
              ttl: CACHE_TTL,
            });

            // Clean old cache entries
            cleanCache();
          }

          // Track history
          if (trackHistory && searchQuery.trim()) {
            addToHistory(searchQuery, searchScope, searchResults.length);
          }

          setIsSearching(false);
        } catch (err) {
          console.error('Search error:', err);
          setError(err instanceof Error ? err.message : 'Search failed');
          setIsSearching(false);
        }
      }, debounceMs);
    },
    [scope, filters, entities, cacheResults, trackHistory, debounceMs]
  );

  /**
   * Set query
   */
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
  }, []);

  /**
   * Set scope
   */
  const setScope = useCallback((newScope: SearchScope) => {
    setScopeState(newScope);
  }, []);

  /**
   * Manual search trigger
   */
  const triggerSearch = useCallback(
    (customQuery?: string, customScope?: SearchScope) => {
      const searchQuery = customQuery !== undefined ? customQuery : query;
      const searchScope = customScope !== undefined ? customScope : scope;
      performSearch(searchQuery, searchScope);
    },
    [query, scope, performSearch]
  );

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  // ============================================
  // FILTERS
  // ============================================

  /**
   * Add filter
   */
  const addFilter = useCallback((filter: SearchFilter) => {
    setFilters((prev) => [...prev, filter]);
  }, []);

  /**
   * Remove filter
   */
  const removeFilter = useCallback((filterId: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== filterId));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  /**
   * Update filter
   */
  const updateFilter = useCallback((filterId: string, updates: Partial<SearchFilter>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
    );
  }, []);

  // ============================================
  // SAVED SEARCHES
  // ============================================

  /**
   * Get saved searches from localStorage
   */
  const getSavedSearches = useCallback((): SavedSearch[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
      if (!stored) return [];

      const searches: SavedSearch[] = JSON.parse(stored);
      return searches.map((s) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastUsedAt: s.lastUsedAt ? new Date(s.lastUsedAt) : undefined,
      }));
    } catch (err) {
      console.error('Error loading saved searches:', err);
      return [];
    }
  }, []);

  /**
   * Save current search
   */
  const saveSearch = useCallback(
    (name: string, tags: string[] = []) => {
      try {
        const searches = getSavedSearches();

        const newSearch: SavedSearch = {
          id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          query,
          filters,
          scope,
          tags,
          createdAt: new Date(),
          useCount: 0,
        };

        searches.push(newSearch);

        // Limit saved searches
        if (searches.length > MAX_SAVED_SEARCHES) {
          searches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          searches.splice(MAX_SAVED_SEARCHES);
        }

        localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(searches));
      } catch (err) {
        console.error('Error saving search:', err);
      }
    },
    [query, filters, scope, getSavedSearches]
  );

  /**
   * Load saved search
   */
  const loadSavedSearch = useCallback(
    (searchId: string) => {
      try {
        const searches = getSavedSearches();
        const savedSearch = searches.find((s) => s.id === searchId);

        if (savedSearch) {
          setQueryState(savedSearch.query);
          setScopeState(savedSearch.scope);
          setFilters(savedSearch.filters);

          // Update usage stats
          savedSearch.lastUsedAt = new Date();
          savedSearch.useCount++;

          localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(searches));

          // Trigger search
          performSearch(savedSearch.query, savedSearch.scope);
        }
      } catch (err) {
        console.error('Error loading saved search:', err);
      }
    },
    [getSavedSearches, performSearch]
  );

  /**
   * Delete saved search
   */
  const deleteSavedSearch = useCallback(
    (searchId: string) => {
      try {
        const searches = getSavedSearches();
        const filtered = searches.filter((s) => s.id !== searchId);
        localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(filtered));
      } catch (err) {
        console.error('Error deleting saved search:', err);
      }
    },
    [getSavedSearches]
  );

  /**
   * Update saved search
   */
  const updateSavedSearch = useCallback(
    (searchId: string, updates: Partial<SavedSearch>) => {
      try {
        const searches = getSavedSearches();
        const updated = searches.map((s) =>
          s.id === searchId ? { ...s, ...updates } : s
        );
        localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(updated));
      } catch (err) {
        console.error('Error updating saved search:', err);
      }
    },
    [getSavedSearches]
  );

  // ============================================
  // HISTORY
  // ============================================

  /**
   * Add entry to search history
   */
  const addToHistory = useCallback((
    searchQuery: string,
    searchScope: SearchScope,
    resultCount: number
  ) => {
    try {
      const history = getSearchHistory();

      const entry: SearchHistoryEntry = {
        id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query: searchQuery,
        scope: searchScope,
        resultCount,
        timestamp: new Date(),
      };

      // Add to beginning
      history.unshift(entry);

      // Limit history
      if (history.length > MAX_HISTORY_ENTRIES) {
        history.splice(MAX_HISTORY_ENTRIES);
      }

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (err) {
      console.error('Error adding to history:', err);
    }
  }, []);

  /**
   * Get search history
   */
  const getSearchHistory = useCallback((): SearchHistoryEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!stored) return [];

      const history: SearchHistoryEntry[] = JSON.parse(stored);
      return history.map((h) => ({
        ...h,
        timestamp: new Date(h.timestamp),
      }));
    } catch (err) {
      console.error('Error loading history:', err);
      return [];
    }
  }, []);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  }, []);

  /**
   * Delete single history entry
   */
  const deleteHistoryEntry = useCallback((entryId: string) => {
    try {
      const history = getSearchHistory();
      const filtered = history.filter((h) => h.id !== entryId);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
    } catch (err) {
      console.error('Error deleting history entry:', err);
    }
  }, [getSearchHistory]);

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get result count
   */
  const getResultCount = useCallback((): number => {
    return results.length;
  }, [results]);

  /**
   * Get results grouped by type
   */
  const getResultsByType = useCallback((): Record<EntityType, number> => {
    const grouped: Record<EntityType, number> = {
      item: 0,
      product: 0,
      order: 0,
      template: 0,
    };

    results.forEach((result) => {
      grouped[result.type]++;
    });

    return grouped;
  }, [results]);

  /**
   * Get search statistics
   */
  const getStatistics = useCallback((): SearchStatistics => {
    const history = getSearchHistory();
    const savedSearches = getSavedSearches();

    // Calculate average result count
    const totalResults = history.reduce((sum, h) => sum + h.resultCount, 0);
    const averageResultCount = history.length > 0 ? totalResults / history.length : 0;

    // Get most searched terms
    const termCounts = new Map<string, number>();
    history.forEach((h) => {
      const count = termCounts.get(h.query) || 0;
      termCounts.set(h.query, count + 1);
    });

    const mostSearchedTerms = Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSearches: history.length,
      averageResultCount,
      mostSearchedTerms,
      recentSearches: history.slice(0, 10),
      savedSearchCount: savedSearches.length,
    };
  }, [getSearchHistory, getSavedSearches]);

  // ============================================
  // CACHING
  // ============================================

  /**
   * Get cached results
   */
  const getCachedResults = useCallback((cacheKey: string): SearchResult<any>[] | null => {
    const cached = cacheRef.current.get(cacheKey);

    if (!cached) return null;

    // Check if cache is still valid
    const age = Date.now() - cached.timestamp;
    if (age > cached.ttl) {
      cacheRef.current.delete(cacheKey);
      return null;
    }

    return cached.results;
  }, []);

  /**
   * Clean expired cache entries
   */
  const cleanCache = useCallback(() => {
    const now = Date.now();
    cacheRef.current.forEach((cache, key) => {
      const age = now - cache.timestamp;
      if (age > cache.ttl) {
        cacheRef.current.delete(key);
      }
    });
  }, []);

  /**
   * Build search index manually
   */
  const buildIndex = useCallback(() => {
    try {
      buildSearchIndex(
        entities.items || [],
        entities.products || [],
        entities.orders || [],
        entities.templates || []
      );
    } catch (err) {
      console.error('Error building index:', err);
    }
  }, [entities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    query,
    scope,
    results,
    isSearching,
    filters,
    error,

    // Actions
    setQuery,
    setScope,
    search: triggerSearch,
    clearResults,

    // Filters
    addFilter,
    removeFilter,
    clearFilters,
    updateFilter,

    // Saved searches
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    updateSavedSearch,
    getSavedSearches,

    // History
    getSearchHistory,
    clearHistory,
    deleteHistoryEntry,

    // Statistics
    getResultCount,
    getResultsByType,
    getStatistics,

    // Advanced
    buildIndex,
    getCachedResults,
  };
}
