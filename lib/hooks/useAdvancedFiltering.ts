import { useState, useCallback, useMemo } from 'react';
import {
  applyFilterGroup,
  applyMultipleFilters,
  getAllSavedFilters,
  saveSavedFilter,
  deleteSavedFilter,
  getFilterGroups,
  saveFilterGroup,
  deleteFilterGroup,
  createSavedFilter,
  createFilterGroup,
  getSavedFilterById,
  searchSavedFilters,
  presetFilters,
  FilterGroup,
  SavedFilter,
  FilterCriterion,
  FilterResult,
  type FilterOperator,
  type FilterLogic,
} from '@/lib/utils/advanced-filtering';
import type { OrderItem } from '@/types';

/**
 * Hook for advanced filtering
 */
export function useAdvancedFiltering(items: OrderItem[]) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(() => getFilterGroups());
  const [globalLogic, setGlobalLogic] = useState<FilterLogic>('and');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply filters
  const filteredItems = useMemo(() => {
    try {
      if (filterGroups.length === 0) {
        return items;
      }

      const result = applyMultipleFilters(items, filterGroups, globalLogic);
      return result.items;
    } catch (err) {
      console.error('Filtering error:', err);
      return items;
    }
  }, [items, filterGroups, globalLogic]);

  const addFilterGroup = useCallback(
    (group: Omit<FilterGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newGroup = createFilterGroup(group);
        saveFilterGroup(newGroup);
        setFilterGroups((prev) => [...prev, newGroup]);
        return newGroup;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add filter group';
        setError(message);
        return null;
      }
    },
    []
  );

  const updateFilterGroup = useCallback((id: string, updates: Partial<FilterGroup>) => {
    try {
      const group = filterGroups.find((g) => g.id === id);
      if (!group) return null;

      const updated = {
        ...group,
        ...updates,
        updatedAt: new Date(),
      };

      saveFilterGroup(updated);
      setFilterGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update filter group';
      setError(message);
      return null;
    }
  }, [filterGroups]);

  const deleteFilterGroupLocal = useCallback((id: string) => {
    try {
      const success = deleteFilterGroup(id);
      if (success) {
        setFilterGroups((prev) => prev.filter((g) => g.id !== id));
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete filter group';
      setError(message);
      return false;
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterGroups([]);
    localStorage.removeItem('filter_groups');
  }, []);

  const toggleGroupActive = useCallback(
    (id: string) => {
      const group = filterGroups.find((g) => g.id === id);
      if (group) {
        return updateFilterGroup(id, { isActive: !group.isActive });
      }
      return null;
    },
    [filterGroups, updateFilterGroup]
  );

  const addCriterion = useCallback(
    (groupId: string, criterion: Omit<FilterCriterion, 'id'>) => {
      try {
        const group = filterGroups.find((g) => g.id === groupId);
        if (!group) return null;

        const newCriterion: FilterCriterion = {
          ...criterion,
          id: `crit_${Date.now()}`,
        };

        return updateFilterGroup(groupId, {
          criteria: [...group.criteria, newCriterion],
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add criterion';
        setError(message);
        return null;
      }
    },
    [filterGroups, updateFilterGroup]
  );

  const removeCriterion = useCallback(
    (groupId: string, criterionId: string) => {
      try {
        const group = filterGroups.find((g) => g.id === groupId);
        if (!group) return null;

        return updateFilterGroup(groupId, {
          criteria: group.criteria.filter((c) => c.id !== criterionId),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove criterion';
        setError(message);
        return null;
      }
    },
    [filterGroups, updateFilterGroup]
  );

  const applyPreset = useCallback(
    (presetName: keyof typeof presetFilters, ...args: any[]) => {
      try {
        const group = (presetFilters[presetName] as any)(...args);
        addFilterGroup(group);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to apply preset';
        setError(message);
      }
    },
    [addFilterGroup]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    items: filteredItems,
    filterGroups,
    globalLogic,

    // State
    isLoading,
    error,

    // Actions
    addFilterGroup,
    updateFilterGroup,
    deleteFilterGroupLocal,
    clearAllFilters,
    toggleGroupActive,
    addCriterion,
    removeCriterion,
    applyPreset,
    setGlobalLogic,

    // Utility
    clearError,

    // Computed
    filterCount: filterGroups.filter((g) => g.isActive).length,
    itemsCount: filteredItems.length,
    filteredItemsCount: items.length - filteredItems.length,
  };
}

/**
 * Hook for saved filters
 */
export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => getAllSavedFilters());
  const [error, setError] = useState<string | null>(null);

  const addSavedFilter = useCallback(
    (data: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const filter = createSavedFilter(data);
        saveSavedFilter(filter);
        setSavedFilters((prev) => [...prev, filter]);
        return filter;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save filter';
        setError(message);
        return null;
      }
    },
    []
  );

  const deleteSavedFilterLocal = useCallback((id: string) => {
    try {
      const success = deleteSavedFilter(id);
      if (success) {
        setSavedFilters((prev) => prev.filter((f) => f.id !== id));
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete filter';
      setError(message);
      return false;
    }
  }, []);

  const search = useCallback((query: string) => {
    return searchSavedFilters(query);
  }, []);

  const getById = useCallback((id: string) => {
    return getSavedFilterById(id);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    savedFilters,
    error,
    addSavedFilter,
    deleteSavedFilterLocal,
    search,
    getById,
    clearError,
  };
}
