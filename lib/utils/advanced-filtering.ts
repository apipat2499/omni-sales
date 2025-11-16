/**
 * Advanced filtering utilities for orders and items
 */

import type { OrderItem } from '@/types';

export type FilterOperator = 'equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'regex';
export type FilterLogic = 'and' | 'or';

/**
 * Filter criterion
 */
export interface FilterCriterion {
  id: string;
  field: string; // e.g., 'productName', 'price', 'quantity'
  operator: FilterOperator;
  value: any;
  value2?: any; // For 'between' operator
  caseSensitive?: boolean;
}

/**
 * Filter group
 */
export interface FilterGroup {
  id: string;
  name: string;
  description?: string;
  criteria: FilterCriterion[];
  logic: FilterLogic; // 'and' or 'or'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  savedFilters?: string[]; // IDs of saved filters in this group
}

/**
 * Saved filter
 */
export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  criteria: FilterCriterion[];
  logic: FilterLogic;
  color?: string;
  icon?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Filter result with metadata
 */
export interface FilterResult {
  items: OrderItem[];
  total: number;
  matched: number;
  filters: FilterCriterion[];
  executionTime: number;
}

/**
 * Apply single criterion to items
 */
export function applyCriterion(items: OrderItem[], criterion: FilterCriterion): OrderItem[] {
  return items.filter((item) => {
    const fieldValue = getFieldValue(item, criterion.field);

    switch (criterion.operator) {
      case 'equals':
        if (criterion.caseSensitive === false && typeof fieldValue === 'string') {
          return fieldValue.toLowerCase() === String(criterion.value).toLowerCase();
        }
        return fieldValue === criterion.value;

      case 'contains':
        if (typeof fieldValue === 'string') {
          const searchStr = criterion.caseSensitive === false
            ? fieldValue.toLowerCase()
            : fieldValue;
          const searchVal = criterion.caseSensitive === false
            ? String(criterion.value).toLowerCase()
            : String(criterion.value);
          return searchStr.includes(searchVal);
        }
        return false;

      case 'gt':
        return Number(fieldValue) > Number(criterion.value);

      case 'gte':
        return Number(fieldValue) >= Number(criterion.value);

      case 'lt':
        return Number(fieldValue) < Number(criterion.value);

      case 'lte':
        return Number(fieldValue) <= Number(criterion.value);

      case 'between':
        return (
          Number(fieldValue) >= Number(criterion.value) &&
          Number(fieldValue) <= Number(criterion.value2)
        );

      case 'in':
        const valueArray = Array.isArray(criterion.value) ? criterion.value : [criterion.value];
        return valueArray.includes(fieldValue);

      case 'regex':
        try {
          const regex = new RegExp(criterion.value, criterion.caseSensitive === false ? 'i' : '');
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }

      default:
        return true;
    }
  });
}

/**
 * Apply filter group to items
 */
export function applyFilterGroup(items: OrderItem[], group: FilterGroup): OrderItem[] {
  if (!group.isActive || group.criteria.length === 0) {
    return items;
  }

  if (group.logic === 'and') {
    let result = items;
    for (const criterion of group.criteria) {
      result = applyCriterion(result, criterion);
    }
    return result;
  } else {
    // OR logic
    const resultSets = group.criteria.map((criterion) => applyCriterion(items, criterion));
    const uniqueIds = new Set<string>();
    const result: OrderItem[] = [];

    resultSets.forEach((items) => {
      items.forEach((item) => {
        if (!uniqueIds.has(item.id)) {
          uniqueIds.add(item.id);
          result.push(item);
        }
      });
    });

    return result;
  }
}

/**
 * Apply multiple filter groups
 */
export function applyMultipleFilters(
  items: OrderItem[],
  groups: FilterGroup[],
  globalLogic: FilterLogic = 'and'
): FilterResult {
  const startTime = performance.now();

  let result = items;

  if (globalLogic === 'and') {
    for (const group of groups) {
      result = applyFilterGroup(result, group);
    }
  } else {
    // OR logic for groups
    const resultSets = groups.map((group) => applyFilterGroup(items, group));
    const uniqueIds = new Set<string>();
    result = [];

    resultSets.forEach((items) => {
      items.forEach((item) => {
        if (!uniqueIds.has(item.id)) {
          uniqueIds.add(item.id);
          result.push(item);
        }
      });
    });
  }

  const executionTime = performance.now() - startTime;

  return {
    items: result,
    total: items.length,
    matched: result.length,
    filters: groups.flatMap((g) => g.criteria),
    executionTime,
  };
}

/**
 * Get field value from item
 */
function getFieldValue(item: OrderItem, field: string): any {
  const fields = field.split('.');
  let value: any = item;

  for (const f of fields) {
    value = value?.[f as keyof typeof value];
  }

  return value;
}

/**
 * Get all saved filters
 */
export function getAllSavedFilters(): SavedFilter[] {
  try {
    const stored = localStorage.getItem('saved_filters');
    if (!stored) return [];

    const filters = JSON.parse(stored) as SavedFilter[];
    return filters.map((f) => ({
      ...f,
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Save filter
 */
export function saveSavedFilter(filter: SavedFilter): void {
  const filters = getAllSavedFilters();
  const index = filters.findIndex((f) => f.id === filter.id);

  if (index >= 0) {
    filters[index] = filter;
  } else {
    filters.push(filter);
  }

  // Keep last 100 filters
  if (filters.length > 100) {
    filters.shift();
  }

  localStorage.setItem('saved_filters', JSON.stringify(filters));
}

/**
 * Create new saved filter
 */
export function createSavedFilter(
  data: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>
): SavedFilter {
  const id = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Delete saved filter
 */
export function deleteSavedFilter(id: string): boolean {
  const filters = getAllSavedFilters();
  const filtered = filters.filter((f) => f.id !== id);

  if (filtered.length === filters.length) {
    return false;
  }

  localStorage.setItem('saved_filters', JSON.stringify(filtered));
  return true;
}

/**
 * Get filter by ID
 */
export function getSavedFilterById(id: string): SavedFilter | null {
  const filters = getAllSavedFilters();
  return filters.find((f) => f.id === id) || null;
}

/**
 * Search saved filters
 */
export function searchSavedFilters(query: string): SavedFilter[] {
  const filters = getAllSavedFilters();
  const lowerQuery = query.toLowerCase();

  return filters.filter(
    (f) =>
      f.name.toLowerCase().includes(lowerQuery) ||
      (f.description && f.description.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get filter groups
 */
export function getFilterGroups(): FilterGroup[] {
  try {
    const stored = localStorage.getItem('filter_groups');
    if (!stored) return [];

    const groups = JSON.parse(stored) as FilterGroup[];
    return groups.map((g) => ({
      ...g,
      createdAt: new Date(g.createdAt),
      updatedAt: new Date(g.updatedAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Save filter group
 */
export function saveFilterGroup(group: FilterGroup): void {
  const groups = getFilterGroups();
  const index = groups.findIndex((g) => g.id === group.id);

  if (index >= 0) {
    groups[index] = group;
  } else {
    groups.push(group);
  }

  localStorage.setItem('filter_groups', JSON.stringify(groups));
}

/**
 * Create new filter group
 */
export function createFilterGroup(
  data: Omit<FilterGroup, 'id' | 'createdAt' | 'updatedAt'>
): FilterGroup {
  const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    ...data,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Delete filter group
 */
export function deleteFilterGroup(id: string): boolean {
  const groups = getFilterGroups();
  const filtered = groups.filter((g) => g.id !== id);

  if (filtered.length === groups.length) {
    return false;
  }

  localStorage.setItem('filter_groups', JSON.stringify(filtered));
  return true;
}

/**
 * Get preset filters
 */
export const presetFilters = {
  highValue: (): FilterGroup =>
    createFilterGroup({
      name: 'High Value Orders',
      description: 'Orders with total > 5000',
      criteria: [
        {
          id: 'price_gt_5000',
          field: 'price',
          operator: 'gt',
          value: 5000,
        } as FilterCriterion,
      ],
      logic: 'and',
      isActive: true,
    }),

  discounted: (): FilterGroup =>
    createFilterGroup({
      name: 'Discounted Items',
      description: 'Items with discount applied',
      criteria: [
        {
          id: 'has_discount',
          field: 'discount',
          operator: 'gt',
          value: 0,
        } as FilterCriterion,
      ],
      logic: 'and',
      isActive: true,
    }),

  bulkOrders: (): FilterGroup =>
    createFilterGroup({
      name: 'Bulk Orders',
      description: 'Items with quantity >= 10',
      criteria: [
        {
          id: 'qty_gte_10',
          field: 'quantity',
          operator: 'gte',
          value: 10,
        } as FilterCriterion,
      ],
      logic: 'and',
      isActive: true,
    }),

  specificProduct: (productId: string): FilterGroup =>
    createFilterGroup({
      name: `Product: ${productId}`,
      criteria: [
        {
          id: 'product_id',
          field: 'productId',
          operator: 'equals',
          value: productId,
        } as FilterCriterion,
      ],
      logic: 'and',
      isActive: true,
    }),
};

/**
 * Export filters as JSON
 */
export function exportFilters(filters: SavedFilter[]): string {
  return JSON.stringify(filters, null, 2);
}

/**
 * Import filters from JSON
 */
export function importFilters(jsonString: string): SavedFilter[] {
  try {
    const imported = JSON.parse(jsonString) as SavedFilter[];
    imported.forEach((filter) => {
      const newFilter = {
        ...filter,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      saveSavedFilter(newFilter);
    });
    return imported;
  } catch (err) {
    throw new Error('Failed to import filters');
  }
}
