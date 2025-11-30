'use client';

import { useState, useMemo, useCallback } from 'react';
import { fuzzySearchMultiField } from '@/lib/utils/fuzzy-search';

export interface SearchConfig<T> {
  searchFields: (keyof T)[];
  fuzzy?: boolean;
  fuzzyThreshold?: number;
}

export interface FilterConfig<T> {
  filters: {
    [key: string]: (item: T, value: any) => boolean;
  };
}

export interface SortConfig<T> {
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
}

export interface UseAdvancedSearchOptions<T> extends SearchConfig<T>, FilterConfig<T>, SortConfig<T> {
  data: T[];
}

export interface AdvancedSearchResult<T> {
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Filters
  filterValues: Record<string, any>;
  setFilterValue: (key: string, value: any) => void;
  setFilterValues: (values: Record<string, any>) => void;
  clearFilters: () => void;

  // Sort
  sortBy: keyof T | undefined;
  sortOrder: 'asc' | 'desc';
  setSortBy: (field: keyof T) => void;
  toggleSort: (field: keyof T) => void;

  // Results
  results: T[];
  totalCount: number;
  filteredCount: number;

  // Stats
  activeFiltersCount: number;
  hasActiveFilters: boolean;
  hasActiveSearch: boolean;
}

export function useAdvancedSearch<T>({
  data,
  searchFields,
  fuzzy = true,
  fuzzyThreshold = 0.6,
  filters,
  sortBy: initialSortBy,
  sortOrder: initialSortOrder = 'asc',
}: UseAdvancedSearchOptions<T>): AdvancedSearchResult<T> {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<keyof T | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);

  // Set individual filter value
  const setFilterValue = useCallback((key: string, value: any) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterValues({});
    setSearchTerm('');
  }, []);

  // Toggle sort order
  const toggleSort = useCallback((field: keyof T) => {
    setSortBy((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return field;
      } else {
        setSortOrder('asc');
        return field;
      }
    });
  }, []);

  // Calculate results
  const results = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm.trim()) {
      filtered = filtered.filter((item) => {
        const fields = searchFields.map((field) => String(item[field] ?? ''));

        if (fuzzy) {
          return fuzzySearchMultiField(searchTerm, fields, fuzzyThreshold);
        } else {
          return fields.some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
    }

    // Apply filters
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        return; // Skip empty filters
      }

      const filterFn = filters[key];
      if (filterFn) {
        filtered = filtered.filter((item) => filterFn(item, value));
      }
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        // Handle dates
        if (aValue instanceof Date && bValue instanceof Date) {
          const diff = aValue.getTime() - bValue.getTime();
          return sortOrder === 'asc' ? diff : -diff;
        }

        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const diff = aValue - bValue;
          return sortOrder === 'asc' ? diff : -diff;
        }

        // Handle strings
        const aStr = String(aValue ?? '');
        const bStr = String(bValue ?? '');
        const diff = aStr.localeCompare(bStr);
        return sortOrder === 'asc' ? diff : -diff;
      });
    }

    return filtered;
  }, [data, searchTerm, filterValues, sortBy, sortOrder, searchFields, filters, fuzzy, fuzzyThreshold]);

  // Calculate stats
  const activeFiltersCount = useMemo(() => {
    return Object.keys(filterValues).filter(
      (key) => filterValues[key] !== undefined && filterValues[key] !== '' && filterValues[key] !== null
    ).length;
  }, [filterValues]);

  const hasActiveFilters = activeFiltersCount > 0;
  const hasActiveSearch = searchTerm.trim().length > 0;

  return {
    // Search
    searchTerm,
    setSearchTerm,

    // Filters
    filterValues,
    setFilterValue,
    setFilterValues,
    clearFilters,

    // Sort
    sortBy,
    sortOrder,
    setSortBy,
    toggleSort,

    // Results
    results,
    totalCount: data.length,
    filteredCount: results.length,

    // Stats
    activeFiltersCount,
    hasActiveFilters,
    hasActiveSearch,
  };
}
