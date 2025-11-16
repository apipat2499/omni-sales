'use client';

/**
 * useCustomerManagement Hook
 *
 * React hook for managing customer data, operations, and state
 * Provides CRUD operations, search, filtering, and customer insights
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrders } from './useOrders';
import {
  ExtendedCustomer,
  CustomerFilters,
  CustomerSortOptions,
  CustomerInsights,
  CustomerNote,
  PurchaseHistory,
  BulkOperationOptions,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  sortCustomers,
  getCustomerPurchaseHistory,
  calculateCustomerInsights,
  updateCustomerMetrics,
  addCustomerNote,
  getCustomerNotes,
  deleteCustomerNote,
  addCustomerTag,
  removeCustomerTag,
  getAllCustomerTags,
  updateCustomerPreferences,
  performBulkOperation,
  exportCustomersToCSV,
  getCustomerStatistics,
  CustomerPreferences,
} from '../utils/customer-management';

export interface UseCustomerManagementOptions {
  autoLoadOrders?: boolean;
  enableCache?: boolean;
  syncInterval?: number; // ms
}

export interface UseCustomerManagementReturn {
  // Customer data
  customers: ExtendedCustomer[];
  selectedCustomer: ExtendedCustomer | null;
  filteredCustomers: ExtendedCustomer[];
  isLoading: boolean;
  error: string | null;

  // Filters and sorting
  filters: CustomerFilters;
  sortOptions: CustomerSortOptions;
  setFilters: (filters: CustomerFilters) => void;
  setSortOptions: (options: CustomerSortOptions) => void;
  clearFilters: () => void;

  // Customer operations
  loadCustomers: () => void;
  getCustomer: (id: string) => ExtendedCustomer | null;
  createNewCustomer: (data: Partial<ExtendedCustomer>) => Promise<ExtendedCustomer>;
  updateExistingCustomer: (id: string, updates: Partial<ExtendedCustomer>) => Promise<ExtendedCustomer | null>;
  removeCustomer: (id: string) => Promise<boolean>;
  selectCustomer: (id: string | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => ExtendedCustomer[];

  // Purchase history
  getPurchaseHistory: (customerId: string) => PurchaseHistory[];
  getInsights: (customerId: string) => CustomerInsights;
  refreshMetrics: (customerId: string) => void;

  // Notes
  notes: CustomerNote[];
  loadNotes: (customerId: string) => void;
  addNote: (customerId: string, content: string, author: string) => Promise<CustomerNote>;
  deleteNote: (noteId: string) => Promise<boolean>;

  // Tags
  availableTags: string[];
  addTag: (customerId: string, tag: string) => Promise<boolean>;
  removeTag: (customerId: string, tag: string) => Promise<boolean>;

  // Preferences
  updatePreferences: (customerId: string, prefs: Partial<CustomerPreferences>) => Promise<boolean>;

  // Bulk operations
  selectedCustomerIds: string[];
  setSelectedCustomerIds: (ids: string[]) => void;
  selectAllCustomers: () => void;
  deselectAllCustomers: () => void;
  bulkOperation: (options: BulkOperationOptions) => Promise<{ success: number; failed: number }>;

  // Export
  exportToCSV: () => string;

  // Statistics
  statistics: {
    total: number;
    active: number;
    inactive: number;
    bySegment: Record<string, number>;
    totalLifetimeValue: number;
    averageLifetimeValue: number;
    totalOrders: number;
    averageOrders: number;
  };
}

const DEFAULT_FILTERS: CustomerFilters = {
  search: '',
  segment: 'all',
  tags: [],
  status: 'all',
};

const DEFAULT_SORT: CustomerSortOptions = {
  field: 'name',
  direction: 'asc',
};

export function useCustomerManagement(
  options: UseCustomerManagementOptions = {}
): UseCustomerManagementReturn {
  const {
    autoLoadOrders = true,
    enableCache = true,
    syncInterval = 0,
  } = options;

  // Load orders for metrics calculation
  const { orders } = useOrders();

  // State
  const [customers, setCustomers] = useState<ExtendedCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ExtendedCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CustomerFilters>(DEFAULT_FILTERS);
  const [sortOptions, setSortOptions] = useState<CustomerSortOptions>(DEFAULT_SORT);
  const [searchQuery, setSearchQuery] = useState('');

  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Load customers
  const loadCustomers = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedCustomers = getCustomers();
      setCustomers(loadedCustomers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Periodic sync
  useEffect(() => {
    if (syncInterval > 0) {
      const interval = setInterval(loadCustomers, syncInterval);
      return () => clearInterval(interval);
    }
  }, [syncInterval, loadCustomers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    let filtered = getCustomers(filters);

    // Apply sorting
    filtered = sortCustomers(filtered, sortOptions);

    return filtered;
  }, [customers, filters, sortOptions]);

  // Get customer by ID
  const getCustomer = useCallback((id: string): ExtendedCustomer | null => {
    return getCustomerById(id);
  }, []);

  // Create customer
  const createNewCustomer = useCallback(
    async (data: Partial<ExtendedCustomer>): Promise<ExtendedCustomer> => {
      setIsLoading(true);
      setError(null);

      try {
        const newCustomer = createCustomer(data);
        loadCustomers();
        return newCustomer;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create customer';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCustomers]
  );

  // Update customer
  const updateExistingCustomer = useCallback(
    async (id: string, updates: Partial<ExtendedCustomer>): Promise<ExtendedCustomer | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = updateCustomer(id, updates);
        if (!updated) {
          throw new Error('Customer not found');
        }

        loadCustomers();

        // Update selected customer if it's the one being updated
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(updated);
        }

        return updated;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update customer';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCustomers, selectedCustomer]
  );

  // Delete customer
  const removeCustomer = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const success = deleteCustomer(id);
        if (!success) {
          throw new Error('Customer not found');
        }

        loadCustomers();

        // Clear selected customer if it was deleted
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
        }

        // Remove from selected IDs
        setSelectedCustomerIds(prev => prev.filter(cid => cid !== id));

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete customer';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCustomers, selectedCustomer]
  );

  // Select customer
  const selectCustomer = useCallback(
    (id: string | null) => {
      if (id === null) {
        setSelectedCustomer(null);
        setNotes([]);
      } else {
        const customer = getCustomer(id);
        setSelectedCustomer(customer);

        if (customer) {
          // Load notes
          const customerNotes = getCustomerNotes(id);
          setNotes(customerNotes);
        }
      }
    },
    [getCustomer]
  );

  // Search
  const performSearch = useCallback((query: string): ExtendedCustomer[] => {
    return searchCustomers(query);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  }, []);

  // Purchase history
  const getPurchaseHistory = useCallback(
    (customerId: string): PurchaseHistory[] => {
      if (!autoLoadOrders) {
        console.warn('Orders not loaded. Set autoLoadOrders to true.');
        return [];
      }
      return getCustomerPurchaseHistory(customerId, orders);
    },
    [orders, autoLoadOrders]
  );

  // Insights
  const getInsights = useCallback(
    (customerId: string): CustomerInsights => {
      if (!autoLoadOrders) {
        console.warn('Orders not loaded. Set autoLoadOrders to true.');
        return {
          purchaseFrequency: 0,
          topProducts: [],
          categoryPreferences: [],
          churnRisk: 'low',
          reorderLikelihood: 0,
          seasonalPatterns: [],
          daysSinceLastPurchase: Infinity,
        };
      }
      return calculateCustomerInsights(customerId, orders);
    },
    [orders, autoLoadOrders]
  );

  // Refresh metrics
  const refreshMetrics = useCallback(
    (customerId: string) => {
      if (!autoLoadOrders) {
        console.warn('Orders not loaded. Set autoLoadOrders to true.');
        return;
      }
      updateCustomerMetrics(customerId, orders);
      loadCustomers();
    },
    [orders, autoLoadOrders, loadCustomers]
  );

  // Notes
  const loadNotes = useCallback((customerId: string) => {
    const customerNotes = getCustomerNotes(customerId);
    setNotes(customerNotes);
  }, []);

  const addNote = useCallback(
    async (customerId: string, content: string, author: string): Promise<CustomerNote> => {
      try {
        const note = addCustomerNote(customerId, content, author);
        loadNotes(customerId);
        return note;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add note';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadNotes]
  );

  const deleteNote = useCallback(
    async (noteId: string): Promise<boolean> => {
      try {
        const success = deleteCustomerNote(noteId);
        if (selectedCustomer) {
          loadNotes(selectedCustomer.id);
        }
        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete note';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [selectedCustomer, loadNotes]
  );

  // Tags
  const availableTags = useMemo(() => {
    return getAllCustomerTags();
  }, [customers]);

  const addTag = useCallback(
    async (customerId: string, tag: string): Promise<boolean> => {
      try {
        const success = addCustomerTag(customerId, tag);
        loadCustomers();
        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to add tag';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadCustomers]
  );

  const removeTag = useCallback(
    async (customerId: string, tag: string): Promise<boolean> => {
      try {
        const success = removeCustomerTag(customerId, tag);
        loadCustomers();
        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to remove tag';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadCustomers]
  );

  // Preferences
  const updatePreferences = useCallback(
    async (customerId: string, prefs: Partial<CustomerPreferences>): Promise<boolean> => {
      try {
        const success = updateCustomerPreferences(customerId, prefs);
        loadCustomers();
        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update preferences';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadCustomers]
  );

  // Bulk operations
  const selectAllCustomers = useCallback(() => {
    setSelectedCustomerIds(filteredCustomers.map(c => c.id));
  }, [filteredCustomers]);

  const deselectAllCustomers = useCallback(() => {
    setSelectedCustomerIds([]);
  }, []);

  const bulkOperation = useCallback(
    async (options: BulkOperationOptions): Promise<{ success: number; failed: number }> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = performBulkOperation(options);
        loadCustomers();
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Bulk operation failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadCustomers]
  );

  // Export
  const exportToCSV = useCallback((): string => {
    return exportCustomersToCSV(filteredCustomers);
  }, [filteredCustomers]);

  // Statistics
  const statistics = useMemo(() => {
    return getCustomerStatistics();
  }, [customers]);

  return {
    // Customer data
    customers,
    selectedCustomer,
    filteredCustomers,
    isLoading,
    error,

    // Filters and sorting
    filters,
    sortOptions,
    setFilters,
    setSortOptions,
    clearFilters,

    // Customer operations
    loadCustomers,
    getCustomer,
    createNewCustomer,
    updateExistingCustomer,
    removeCustomer,
    selectCustomer,

    // Search
    searchQuery,
    setSearchQuery,
    performSearch,

    // Purchase history
    getPurchaseHistory,
    getInsights,
    refreshMetrics,

    // Notes
    notes,
    loadNotes,
    addNote,
    deleteNote,

    // Tags
    availableTags,
    addTag,
    removeTag,

    // Preferences
    updatePreferences,

    // Bulk operations
    selectedCustomerIds,
    setSelectedCustomerIds,
    selectAllCustomers,
    deselectAllCustomers,
    bulkOperation,

    // Export
    exportToCSV,

    // Statistics
    statistics,
  };
}
