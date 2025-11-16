import { useState, useCallback, useMemo } from 'react';

export interface SearchOptions<T> {
  keys: (keyof T)[];           // Fields to search in
  threshold?: number;           // Fuzzy match threshold (0-1, default: 0.6)
  caseSensitive?: boolean;      // Case sensitive search (default: false)
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

interface UseSearchReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  results: T[];
  isSearching: boolean;
  clearSearch: () => void;
  searchInField: (term: string, field: any, threshold?: number) => boolean;
}

/**
 * Hook for searching/filtering data with fuzzy matching
 */
export function useSearch<T>(
  data: T[],
  options: SearchOptions<T>
): UseSearchReturn<T> {
  const [searchTerm, setSearchTerm] = useState('');
  const { threshold = 0.6, caseSensitive = false } = options;

  const results = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const search = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    return data.filter((item) => {
      return options.keys.some((key) => {
        const value = String(item[key] || '');
        const comparedValue = caseSensitive ? value : value.toLowerCase();

        // Exact match
        if (comparedValue.includes(search)) return true;

        // Fuzzy match
        const similarity = calculateSimilarity(comparedValue, search);
        return similarity >= threshold;
      });
    });
  }, [data, searchTerm, options.keys, threshold, caseSensitive]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const searchInField = useCallback(
    (term: string, field: any, fieldThreshold?: number): boolean => {
      const value = String(field || '');
      const search = caseSensitive ? term : term.toLowerCase();
      const comparedValue = caseSensitive ? value : value.toLowerCase();

      if (comparedValue.includes(search)) return true;

      const similarity = calculateSimilarity(comparedValue, search);
      return similarity >= (fieldThreshold ?? threshold);
    },
    [threshold, caseSensitive]
  );

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching: searchTerm.length > 0,
    clearSearch,
    searchInField,
  };
}

/**
 * Hook for simple text filtering (no fuzzy matching)
 */
export function useSimpleFilter<T>(
  data: T[],
  predicate: (item: T, searchTerm: string) => boolean
) {
  const [searchTerm, setSearchTerm] = useState('');

  const results = useMemo(() => {
    if (!searchTerm.trim()) return data;
    return data.filter((item) => predicate(item, searchTerm));
  }, [data, searchTerm, predicate]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching: searchTerm.length > 0,
    clearSearch,
  };
}
