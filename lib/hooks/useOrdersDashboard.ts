/**
 * Custom hook for Orders Management Dashboard
 * Provides centralized state management and business logic for the dashboard
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { OrderItem } from '@/types';
import { useAnalytics } from './useAnalytics';
import { useStockManagement } from './useStockManagement';
import { useOrderTemplates } from './useOrderTemplates';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

export interface DashboardStats {
  totalItems: number;
  totalRevenue: number;
  averageOrderValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingOperationsCount: number;
  selectedItemsCount: number;
}

export interface DashboardFilters {
  searchQuery: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  stockStatus?: 'all' | 'low' | 'out' | 'healthy';
}

export interface DashboardSettings {
  viewMode: 'grid' | 'list';
  itemsPerPage: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

interface UseOrdersDashboardOptions {
  orderId?: string;
  initialItems?: OrderItem[];
  onItemsChange?: (items: OrderItem[]) => void;
  autoSave?: boolean;
}

export function useOrdersDashboard(options: UseOrdersDashboardOptions = {}) {
  const {
    orderId = 'default-order',
    initialItems = [],
    onItemsChange,
    autoSave = true,
  } = options;

  // Core state
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<OrderItem[]>(initialItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard settings
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fall through to defaults
        }
      }
    }
    return {
      viewMode: 'list',
      itemsPerPage: 25,
      sortField: 'productName',
      sortDirection: 'asc',
      autoRefresh: false,
      refreshInterval: 30,
    };
  });

  // Filters
  const [filters, setFilters] = useState<DashboardFilters>({
    searchQuery: '',
  });

  // Integrate other hooks
  const analytics = useAnalytics(
    items.map((item) => ({
      items: [item],
      date: new Date(),
    }))
  );

  const { alerts, lowStockProducts, outOfStockProducts, refresh: refreshStock } =
    useStockManagement();

  const { templates, getStats: getTemplateStats } = useOrderTemplates();
  const shortcuts = useKeyboardShortcuts();

  /**
   * Update settings and persist to localStorage
   */
  const updateSettings = useCallback((updates: Partial<DashboardSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard-settings', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((updates: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Calculate dashboard statistics
   */
  const stats = useMemo<DashboardStats>(() => {
    const totalItems = items.length;
    const totalRevenue = items.reduce(
      (sum, item) => sum + item.price * item.quantity - (item.discount || 0),
      0
    );
    const averageOrderValue = totalItems > 0 ? totalRevenue / totalItems : 0;
    const lowStockCount = lowStockProducts.length;
    const outOfStockCount = outOfStockProducts.length;
    const pendingOperationsCount = 0; // Would come from operation queue
    const selectedItemsCount = selectedItems.size;

    return {
      totalItems,
      totalRevenue,
      averageOrderValue,
      lowStockCount,
      outOfStockCount,
      pendingOperationsCount,
      selectedItemsCount,
    };
  }, [items, lowStockProducts, outOfStockProducts, selectedItems]);

  /**
   * Apply filters to items
   */
  useEffect(() => {
    let result = [...items];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.productName.toLowerCase().includes(query) ||
          item.productId.toLowerCase().includes(query)
      );
    }

    // Price range filter
    if (filters.priceRange) {
      result = result.filter(
        (item) =>
          item.price >= filters.priceRange!.min && item.price <= filters.priceRange!.max
      );
    }

    // Stock status filter (would need stock data for each product)
    if (filters.stockStatus && filters.stockStatus !== 'all') {
      // This would require joining with stock data
      // For now, we'll just pass through
    }

    setFilteredItems(result);
  }, [items, filters]);

  /**
   * Add items
   */
  const addItems = useCallback(
    (newItems: OrderItem[]) => {
      setItems((prev) => {
        const next = [...prev, ...newItems];
        if (autoSave) {
          onItemsChange?.(next);
        }
        return next;
      });
    },
    [autoSave, onItemsChange]
  );

  /**
   * Update item
   */
  const updateItem = useCallback(
    (itemId: string, updates: Partial<OrderItem>) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        if (autoSave) {
          onItemsChange?.(next);
        }
        return next;
      });
    },
    [autoSave, onItemsChange]
  );

  /**
   * Remove items
   */
  const removeItems = useCallback(
    (itemIds: string[]) => {
      setItems((prev) => {
        const next = prev.filter((item) => !itemIds.includes(item.id!));
        if (autoSave) {
          onItemsChange?.(next);
        }
        return next;
      });
      // Clear selection
      setSelectedItems((prev) => {
        const next = new Set(prev);
        itemIds.forEach((id) => next.delete(id));
        return next;
      });
    },
    [autoSave, onItemsChange]
  );

  /**
   * Toggle item selection
   */
  const toggleSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  /**
   * Select all items
   */
  const selectAll = useCallback(() => {
    setSelectedItems(new Set(filteredItems.map((item) => item.id!).filter(Boolean)));
  }, [filteredItems]);

  /**
   * Deselect all items
   */
  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  /**
   * Get selected items
   */
  const getSelectedItems = useCallback(() => {
    return items.filter((item) => selectedItems.has(item.id!));
  }, [items, selectedItems]);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([refreshStock()]);
      // Could add more refresh operations here
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [refreshStock]);

  /**
   * Auto-refresh functionality
   */
  useEffect(() => {
    if (!settings.autoRefresh) return;

    const interval = setInterval(() => {
      refreshAll();
    }, settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval, refreshAll]);

  /**
   * Export data
   */
  const exportData = useCallback(
    (format: 'csv' | 'json', includeFiltered = true) => {
      const dataToExport = includeFiltered ? filteredItems : items;

      const exportData = dataToExport.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        totalPrice: item.price * item.quantity - (item.discount || 0),
      }));

      let content: string;
      let mimeType: string;
      let filename: string;

      if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {}).join(',');
        const rows = exportData.map((row) => Object.values(row).join(','));
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
        filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        filename = `orders-export-${new Date().toISOString().split('T')[0]}.json`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    },
    [filteredItems, items]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    items,
    filteredItems,
    selectedItems,
    stats,

    // Analytics
    analytics,
    alerts,
    lowStockProducts,
    outOfStockProducts,
    templates,
    shortcuts,

    // Settings
    settings,
    updateSettings,

    // Filters
    filters,
    updateFilters,

    // State
    isLoading,
    error,
    clearError,

    // Actions - Items
    addItems,
    updateItem,
    removeItems,
    setItems,

    // Actions - Selection
    toggleSelection,
    selectAll,
    deselectAll,
    getSelectedItems,

    // Actions - Utility
    refreshAll,
    exportData,

    // Template stats
    templateStats: getTemplateStats(),

    // Computed properties
    hasItems: items.length > 0,
    hasFilters: filters.searchQuery.length > 0 || !!filters.dateRange || !!filters.priceRange,
    hasSelection: selectedItems.size > 0,
    isAllSelected:
      filteredItems.length > 0 &&
      filteredItems.every((item) => selectedItems.has(item.id!)),
  };
}

/**
 * Hook for managing dashboard view state
 */
export function useDashboardView() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'filter' | 'bulk' | 'templates' | 'analytics' | 'reports'
  >('overview');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return {
    activeTab,
    setActiveTab,
    showFilterPanel,
    setShowFilterPanel,
    showBulkPanel,
    setShowBulkPanel,
    showShortcutsModal,
    setShowShortcutsModal,
    showSettingsModal,
    setShowSettingsModal,
  };
}

/**
 * Hook for managing pagination
 */
export function useDashboardPagination(totalItems: number, initialItemsPerPage = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const changeItemsPerPage = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Reset to first page when total items change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage: goToPage,
    setItemsPerPage: changeItemsPerPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Hook for managing sort state
 */
export function useDashboardSort<T extends string>(initialField: T, initialDirection: 'asc' | 'desc' = 'asc') {
  const [sortField, setSortField] = useState<T>(initialField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialDirection);

  const toggleSort = useCallback(
    (field: T) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField]
  );

  const setSort = useCallback((field: T, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  return {
    sortField,
    sortDirection,
    toggleSort,
    setSort,
  };
}
