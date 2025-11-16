import { useState, useCallback, useEffect } from 'react';
import {
  Order,
  AllocationResult,
  InventoryTransfer,
  AllocationRule,
  DemandForecast,
  RebalancingPlan,
  allocateByNearest,
  allocateByInventory,
  allocateByCost,
  allocateByHybrid,
  getOptimalWarehouse,
  getAllTransfers,
  createTransfer,
  updateTransferStatus,
  getTransfersByWarehouse,
  getPendingTransfers,
  predictDemand,
  generateRebalancingPlan,
} from '@/lib/utils/inventory-allocation';
import { getAllWarehouses, Warehouse } from '@/lib/utils/warehouse-management';

/**
 * Hook for inventory allocation
 */
export function useInventoryAllocation() {
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<InventoryTransfer[]>([]);
  const [rebalancingPlan, setRebalancingPlan] = useState<RebalancingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allTransfers = getAllTransfers();
      setTransfers(allTransfers);

      const pending = getPendingTransfers();
      setPendingTransfers(pending);

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Allocate order
  const allocateOrder = useCallback(
    async (
      order: Order,
      algorithm: AllocationRule['algorithm'] = 'hybrid',
      weights?: { distance?: number; inventory?: number; cost?: number }
    ): Promise<AllocationResult> => {
      try {
        const warehouses = getAllWarehouses().filter(w => w.isActive);
        let result: AllocationResult;

        switch (algorithm) {
          case 'nearest':
            result = allocateByNearest(order, warehouses);
            break;
          case 'inventory':
            result = allocateByInventory(order, warehouses);
            break;
          case 'cost':
            result = allocateByCost(order, warehouses);
            break;
          case 'hybrid':
            result = allocateByHybrid(order, warehouses, weights);
            break;
          default:
            result = allocateByHybrid(order, warehouses);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to allocate order';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Get optimal warehouse
  const findOptimalWarehouse = useCallback(
    async (
      order: Order,
      algorithm: AllocationRule['algorithm'] = 'hybrid',
      weights?: { distance?: number; inventory?: number; cost?: number }
    ): Promise<Warehouse | null> => {
      try {
        return getOptimalWarehouse(order, algorithm, weights);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to find optimal warehouse';
        setError(message);
        return null;
      }
    },
    []
  );

  // Transfer operations
  const initiateTransfer = useCallback(
    async (transfer: Omit<InventoryTransfer, 'id' | 'initiatedAt'>) => {
      try {
        const newTransfer = createTransfer(transfer);
        await loadData();
        return newTransfer;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create transfer';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const updateTransfer = useCallback(
    async (id: string, status: InventoryTransfer['status']) => {
      try {
        const updated = updateTransferStatus(id, status);
        await loadData();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update transfer';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const getTransfersForWarehouse = useCallback(
    (warehouseId: string) => {
      return getTransfersByWarehouse(warehouseId);
    },
    []
  );

  // Demand forecasting
  const forecastDemand = useCallback(
    async (productId: string, warehouseId: string | undefined, days: number = 30): Promise<DemandForecast | null> => {
      try {
        return predictDemand(productId, warehouseId, days);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to forecast demand';
        setError(message);
        return null;
      }
    },
    []
  );

  // Rebalancing
  const createRebalancingPlan = useCallback(
    async () => {
      try {
        const plan = generateRebalancingPlan();
        setRebalancingPlan(plan);
        return plan;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create rebalancing plan';
        setError(message);
        throw err;
      }
    },
    []
  );

  const executeRebalancingPlan = useCallback(
    async (plan: RebalancingPlan) => {
      try {
        // Create all transfers in the plan
        for (const transfer of plan.transfers) {
          await initiateTransfer({
            fromWarehouse: transfer.fromWarehouse,
            toWarehouse: transfer.toWarehouse,
            items: transfer.items,
            status: 'pending',
            reason: 'rebalancing',
          });
        }
        await loadData();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to execute rebalancing plan';
        setError(message);
        return false;
      }
    },
    [initiateTransfer, loadData]
  );

  return {
    // Data
    transfers,
    pendingTransfers,
    rebalancingPlan,

    // State
    isLoading,
    error,

    // Allocation
    allocateOrder,
    findOptimalWarehouse,

    // Transfers
    initiateTransfer,
    updateTransfer,
    getTransfersForWarehouse,

    // Forecasting
    forecastDemand,

    // Rebalancing
    createRebalancingPlan,
    executeRebalancingPlan,

    // Refresh
    refresh: loadData,
  };
}

/**
 * Hook for allocation rules management
 */
export function useAllocationRules() {
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would load from storage
      // For now, return default rules
      const defaultRules: AllocationRule[] = [
        {
          id: 'rule-1',
          name: 'High Priority Orders - Nearest',
          priority: 1,
          conditions: {
            orderSize: 'small',
          },
          algorithm: 'nearest',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'rule-2',
          name: 'Bulk Orders - Cost Optimized',
          priority: 2,
          conditions: {
            orderSize: 'large',
          },
          algorithm: 'cost',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'rule-3',
          name: 'Default - Hybrid',
          priority: 999,
          conditions: {},
          algorithm: 'hybrid',
          weights: {
            distance: 0.4,
            inventory: 0.3,
            cost: 0.3,
          },
          isActive: true,
          createdAt: new Date(),
        },
      ];
      setRules(defaultRules);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const getApplicableRule = useCallback(
    (order: Order): AllocationRule | null => {
      // Find the first matching rule based on priority
      const sortedRules = [...rules]
        .filter(r => r.isActive)
        .sort((a, b) => a.priority - b.priority);

      for (const rule of sortedRules) {
        // Check if rule conditions match order
        if (rule.conditions.orderSize) {
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const orderSize =
            totalItems < 10 ? 'small' : totalItems < 100 ? 'medium' : 'large';

          if (orderSize !== rule.conditions.orderSize) {
            continue;
          }
        }

        // If all conditions match, return this rule
        return rule;
      }

      // Return default rule if no match
      return sortedRules.find(r => r.name === 'Default - Hybrid') || null;
    },
    [rules]
  );

  return {
    rules,
    isLoading,
    getApplicableRule,
    refresh: loadRules,
  };
}

/**
 * Hook for transfer tracking
 */
export function useTransferTracking(transferId?: string) {
  const [transfer, setTransfer] = useState<InventoryTransfer | null>(null);
  const [history, setHistory] = useState<InventoryTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allTransfers = getAllTransfers();

      if (transferId) {
        const t = allTransfers.find(tr => tr.id === transferId);
        setTransfer(t || null);
      }

      setHistory(allTransfers.slice(-50)); // Last 50 transfers
    } finally {
      setIsLoading(false);
    }
  }, [transferId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusColor = useCallback((status: InventoryTransfer['status']) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'in-transit':
        return 'blue';
      case 'received':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  }, []);

  const getStatusLabel = useCallback((status: InventoryTransfer['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-transit':
        return 'In Transit';
      case 'received':
        return 'Received';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }, []);

  const getProgressPercentage = useCallback((transfer: InventoryTransfer): number => {
    switch (transfer.status) {
      case 'pending':
        return 25;
      case 'in-transit':
        return 50;
      case 'received':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  }, []);

  const getEstimatedArrival = useCallback((transfer: InventoryTransfer): Date | null => {
    if (transfer.estimatedDelivery) {
      return transfer.estimatedDelivery;
    }

    if (transfer.shipmentDate) {
      // Estimate 3 days from shipment
      const estimated = new Date(transfer.shipmentDate);
      estimated.setDate(estimated.getDate() + 3);
      return estimated;
    }

    return null;
  }, []);

  return {
    transfer,
    history,
    isLoading,
    getStatusColor,
    getStatusLabel,
    getProgressPercentage,
    getEstimatedArrival,
    refresh: loadData,
  };
}
