import { useState, useCallback, useMemo } from 'react';

export interface BulkSelectOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
}

export function useBulkSelect<T>({ items, getItemId }: BulkSelectOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get all item IDs
  const allIds = useMemo(() => new Set(items.map(getItemId)), [items, getItemId]);

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Check if some (but not all) items are selected
  const isIndeterminate = useMemo(() => {
    const selectedCount = Array.from(selectedIds).filter((id) => allIds.has(id)).length;
    return selectedCount > 0 && selectedCount < items.length;
  }, [selectedIds, allIds, items.length]);

  // Toggle individual item
  const toggleItem = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    []
  );

  // Toggle all items
  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(items.map(getItemId)));
    }
  }, [isAllSelected, items, getItemId]);

  // Select specific items
  const selectItems = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get selected items
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Check if specific item is selected
  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  return {
    selectedIds: Array.from(selectedIds),
    selectedItems,
    selectedCount: selectedItems.length,
    isAllSelected,
    isIndeterminate,
    isSelected,
    toggleItem,
    toggleAll,
    selectItems,
    clearSelection,
  };
}
