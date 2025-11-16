'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReorderRule,
  ReorderSuggestion,
  PurchaseOrderInput,
  PurchaseOrderResult,
  generateReorderSuggestions,
  calculateReorderPointFromHistory,
  calculateEOQ,
  validateReorderRule,
  generatePurchaseOrder,
  consolidatePurchaseOrders,
  calculateDaysUntilStockout,
  calculateSupplierPerformance,
  SupplierPerformance,
} from '@/lib/utils/reorder-management';
import { DemandHistory } from '@/lib/utils/inventory-forecasting';
import { Supplier, PurchaseOrder } from '@/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UseReorderSystemOptions {
  userId?: string;
  autoCheckReorders?: boolean;
  checkInterval?: number; // milliseconds
}

export interface UseReorderSystemReturn {
  rules: ReorderRule[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  suggestions: ReorderSuggestion[];
  isLoading: boolean;
  error: string | null;

  // Reorder Rules
  createReorderRule: (data: Partial<ReorderRule>) => Promise<ReorderRule | null>;
  updateReorderRule: (id: string, updates: Partial<ReorderRule>) => Promise<boolean>;
  deleteReorderRule: (id: string) => Promise<boolean>;
  toggleReorderRule: (id: string, isActive: boolean) => Promise<boolean>;
  getReorderRule: (id: string) => ReorderRule | undefined;
  calculateOptimalReorderPoint: (
    productId: string,
    history: DemandHistory[],
    leadTime: number
  ) => number;

  // Purchase Orders
  generatePurchaseOrder: (input: PurchaseOrderInput) => Promise<PurchaseOrder | null>;
  approvePurchaseOrder: (poId: string) => Promise<boolean>;
  cancelPurchaseOrder: (poId: string) => Promise<boolean>;
  receivePurchaseOrder: (poId: string) => Promise<boolean>;
  getPurchaseOrder: (id: string) => PurchaseOrder | undefined;

  // Suggestions
  getUpcomingReorders: () => ReorderRule[];
  getReorderSuggestions: () => ReorderSuggestion[];
  refreshSuggestions: () => Promise<void>;

  // Suppliers
  getSupplierPerformance: (supplierId: string) => Promise<SupplierPerformance | null>;

  // Refresh
  refreshRules: () => Promise<void>;
  refreshPurchaseOrders: () => Promise<void>;
  refreshSuppliers: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing reorder system (rules, POs, suppliers)
 */
export function useReorderSystem(
  options: UseReorderSystemOptions = {}
): UseReorderSystemReturn {
  const { userId, autoCheckReorders = false, checkInterval = 60000 } = options;

  // State
  const [rules, setRules] = useState<ReorderRule[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch reorder rules from API
   */
  const fetchRules = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/inventory/reorder-rules?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch reorder rules');

      const data = await response.json();
      setRules(data);
    } catch (err) {
      console.error('Error fetching reorder rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reorder rules');
    }
  }, [userId]);

  /**
   * Fetch purchase orders from API
   */
  const fetchPurchaseOrders = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/inventory/purchase-orders?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch purchase orders');

      const data = await response.json();
      setPurchaseOrders(data);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders');
    }
  }, [userId]);

  /**
   * Fetch suppliers from API
   */
  const fetchSuppliers = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/inventory/suppliers?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch suppliers');

      const data = await response.json();
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    }
  }, [userId]);

  /**
   * Fetch reorder suggestions
   */
  const fetchSuggestions = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/inventory/reorder-suggestions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch reorder suggestions');

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching reorder suggestions:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch reorder suggestions'
      );
    }
  }, [userId]);

  // ============================================================================
  // REORDER RULES MANAGEMENT
  // ============================================================================

  /**
   * Create new reorder rule
   */
  const createReorderRule = useCallback(
    async (data: Partial<ReorderRule>): Promise<ReorderRule | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Validate rule
        const validation = validateReorderRule(data);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }

        const response = await fetch('/api/inventory/reorder-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, userId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create reorder rule');
        }

        const newRule = await response.json();
        setRules(prev => [...prev, newRule]);

        return newRule;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create reorder rule';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  /**
   * Update existing reorder rule
   */
  const updateReorderRule = useCallback(
    async (id: string, updates: Partial<ReorderRule>): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Validate updates
        const validation = validateReorderRule(updates);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }

        const response = await fetch(`/api/inventory/reorder-rules/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update reorder rule');
        }

        const updatedRule = await response.json();
        setRules(prev => prev.map(rule => (rule.id === id ? updatedRule : rule)));

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update reorder rule';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete reorder rule
   */
  const deleteReorderRule = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/reorder-rules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete reorder rule');
      }

      setRules(prev => prev.filter(rule => rule.id !== id));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete reorder rule';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Toggle reorder rule active status
   */
  const toggleReorderRule = useCallback(
    async (id: string, isActive: boolean): Promise<boolean> => {
      return updateReorderRule(id, { isActive });
    },
    [updateReorderRule]
  );

  /**
   * Get specific reorder rule
   */
  const getReorderRule = useCallback(
    (id: string): ReorderRule | undefined => {
      return rules.find(rule => rule.id === id);
    },
    [rules]
  );

  /**
   * Calculate optimal reorder point based on history
   */
  const calculateOptimalReorderPoint = useCallback(
    (productId: string, history: DemandHistory[], leadTime: number): number => {
      return calculateReorderPointFromHistory(history, leadTime, 0.95);
    },
    []
  );

  // ============================================================================
  // PURCHASE ORDERS MANAGEMENT
  // ============================================================================

  /**
   * Generate new purchase order
   */
  const generatePurchaseOrderFromInput = useCallback(
    async (input: PurchaseOrderInput): Promise<PurchaseOrder | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Generate PO structure
        const poData = generatePurchaseOrder(input);

        // Send to API
        const response = await fetch('/api/inventory/purchase-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...poData, userId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create purchase order');
        }

        const newPO = await response.json();
        setPurchaseOrders(prev => [...prev, newPO]);

        return newPO;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create purchase order';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  /**
   * Approve purchase order (change status to sent)
   */
  const approvePurchaseOrder = useCallback(async (poId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/purchase-orders/${poId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve purchase order');
      }

      const updatedPO = await response.json();
      setPurchaseOrders(prev => prev.map(po => (po.id === poId ? updatedPO : po)));

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to approve purchase order';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cancel purchase order
   */
  const cancelPurchaseOrder = useCallback(async (poId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/purchase-orders/${poId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel purchase order');
      }

      const updatedPO = await response.json();
      setPurchaseOrders(prev => prev.map(po => (po.id === poId ? updatedPO : po)));

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to cancel purchase order';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Receive purchase order (mark as received and update inventory)
   */
  const receivePurchaseOrder = useCallback(async (poId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/purchase-orders/${poId}/receive`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to receive purchase order');
      }

      const updatedPO = await response.json();
      setPurchaseOrders(prev => prev.map(po => (po.id === poId ? updatedPO : po)));

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to receive purchase order';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get specific purchase order
   */
  const getPurchaseOrder = useCallback(
    (id: string): PurchaseOrder | undefined => {
      return purchaseOrders.find(po => po.id === id);
    },
    [purchaseOrders]
  );

  // ============================================================================
  // SUGGESTIONS
  // ============================================================================

  /**
   * Get upcoming reorders (rules that will trigger soon)
   */
  const getUpcomingReorders = useCallback((): ReorderRule[] => {
    return rules.filter(rule => rule.isActive);
  }, [rules]);

  /**
   * Get current reorder suggestions
   */
  const getReorderSuggestions = useCallback((): ReorderSuggestion[] => {
    return suggestions;
  }, [suggestions]);

  /**
   * Refresh reorder suggestions
   */
  const refreshSuggestions = useCallback(async () => {
    await fetchSuggestions();
  }, [fetchSuggestions]);

  // ============================================================================
  // SUPPLIER PERFORMANCE
  // ============================================================================

  /**
   * Get supplier performance metrics
   */
  const getSupplierPerformance = useCallback(
    async (supplierId: string): Promise<SupplierPerformance | null> => {
      try {
        const response = await fetch(
          `/api/inventory/suppliers/${supplierId}/performance`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch supplier performance');
        }

        return await response.json();
      } catch (err) {
        console.error('Error fetching supplier performance:', err);
        return null;
      }
    },
    []
  );

  // ============================================================================
  // REFRESH FUNCTIONS
  // ============================================================================

  const refreshRules = useCallback(async () => {
    setIsLoading(true);
    await fetchRules();
    setIsLoading(false);
  }, [fetchRules]);

  const refreshPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    await fetchPurchaseOrders();
    setIsLoading(false);
  }, [fetchPurchaseOrders]);

  const refreshSuppliers = useCallback(async () => {
    setIsLoading(true);
    await fetchSuppliers();
    setIsLoading(false);
  }, [fetchSuppliers]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initial data load
   */
  useEffect(() => {
    if (userId) {
      Promise.all([
        fetchRules(),
        fetchPurchaseOrders(),
        fetchSuppliers(),
        fetchSuggestions(),
      ]);
    }
  }, [userId, fetchRules, fetchPurchaseOrders, fetchSuppliers, fetchSuggestions]);

  /**
   * Auto-check reorders at interval
   */
  useEffect(() => {
    if (!autoCheckReorders || !userId) return;

    const interval = setInterval(() => {
      fetchSuggestions();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [autoCheckReorders, userId, checkInterval, fetchSuggestions]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    rules,
    purchaseOrders,
    suppliers,
    suggestions,
    isLoading,
    error,

    // Reorder Rules
    createReorderRule,
    updateReorderRule,
    deleteReorderRule,
    toggleReorderRule,
    getReorderRule,
    calculateOptimalReorderPoint,

    // Purchase Orders
    generatePurchaseOrder: generatePurchaseOrderFromInput,
    approvePurchaseOrder,
    cancelPurchaseOrder,
    receivePurchaseOrder,
    getPurchaseOrder,

    // Suggestions
    getUpcomingReorders,
    getReorderSuggestions,
    refreshSuggestions,

    // Suppliers
    getSupplierPerformance,

    // Refresh
    refreshRules,
    refreshPurchaseOrders,
    refreshSuppliers,
  };
}

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for managing EOQ calculations
 */
export function useEOQCalculation() {
  const [eoq, setEOQ] = useState<number>(0);

  const calculate = useCallback(
    (annualDemand: number, orderingCost: number, holdingCost: number) => {
      const result = calculateEOQ({
        annualDemand,
        orderingCost,
        holdingCost,
      });
      setEOQ(result);
      return result;
    },
    []
  );

  return {
    eoq,
    calculate,
  };
}

/**
 * Hook for monitoring stock levels and triggering alerts
 */
export function useStockMonitoring(
  products: Array<{
    id: string;
    name: string;
    currentStock: number;
    reorderPoint: number;
  }>
) {
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.currentStock <= p.reorderPoint);
  }, [products]);

  const criticalStockProducts = useMemo(() => {
    return products.filter(p => p.currentStock === 0);
  }, [products]);

  return {
    lowStockProducts,
    criticalStockProducts,
    hasLowStock: lowStockProducts.length > 0,
    hasCriticalStock: criticalStockProducts.length > 0,
  };
}
