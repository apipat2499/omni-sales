import { useState, useCallback, useEffect } from 'react';
import {
  Warehouse,
  WarehouseLocation,
  InventoryLevel,
  InventoryCount,
  WarehouseZone,
  WarehouseMetrics,
  getAllWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getActiveWarehouses,
  getAllLocations,
  getLocationsByWarehouse,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  getEmptyLocations,
  getOccupiedLocations,
  findAvailableLocation,
  getAllInventoryLevels,
  getInventoryByProduct,
  getInventoryByWarehouse,
  getInventoryLevel,
  updateInventoryLevel,
  addStockToLocation,
  removeStockFromLocation,
  moveStockBetweenLocations,
  getTotalInventoryByProduct,
  getAvailableInventoryByProduct,
  getAllZones,
  getZonesByWarehouse,
  createZone,
  updateZone,
  deleteZone,
  getZoneUtilization,
  getAllInventoryCounts,
  createInventoryCount,
  updateInventoryCount,
  completeInventoryCount,
  getWarehouseUtilization,
  getWarehouseCapacityStatus,
  calculateWarehouseMetrics,
  getLowStockItemsInWarehouse,
  getOverstockItemsInWarehouse,
  generateLocationBarcode,
} from '@/lib/utils/warehouse-management';

/**
 * Hook for warehouse management
 */
export function useWarehouseManagement(warehouseId?: string) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [inventory, setInventory] = useState<InventoryLevel[]>([]);
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [metrics, setMetrics] = useState<WarehouseMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allWarehouses = getAllWarehouses();
      setWarehouses(allWarehouses);

      if (warehouseId) {
        const wh = getWarehouse(warehouseId);
        setWarehouse(wh);

        const locs = getLocationsByWarehouse(warehouseId);
        setLocations(locs);

        const inv = getInventoryByWarehouse(warehouseId);
        setInventory(inv);

        const z = getZonesByWarehouse(warehouseId);
        setZones(z);

        const c = getAllInventoryCounts().filter(
          ct => ct.warehouseId === warehouseId
        );
        setCounts(c);

        const m = calculateWarehouseMetrics(warehouseId);
        setMetrics(m);
      } else {
        const allLocations = getAllLocations();
        setLocations(allLocations);

        const allInventory = getAllInventoryLevels();
        setInventory(allInventory);

        const allZones = getAllZones();
        setZones(allZones);

        const allCounts = getAllInventoryCounts();
        setCounts(allCounts);
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Warehouse operations
  const addWarehouse = useCallback(
    async (warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newWarehouse = createWarehouse(warehouse);
        await loadData();
        return newWarehouse;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create warehouse';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const editWarehouse = useCallback(
    async (id: string, updates: Partial<Warehouse>) => {
      try {
        const updated = updateWarehouse(id, updates);
        await loadData();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update warehouse';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const removeWarehouse = useCallback(
    async (id: string) => {
      try {
        const success = deleteWarehouse(id);
        if (success) {
          await loadData();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete warehouse';
        setError(message);
        return false;
      }
    },
    [loadData]
  );

  // Location operations
  const addLocation = useCallback(
    async (location: Omit<WarehouseLocation, 'id' | 'createdAt' | 'updatedAt' | 'barcode'>) => {
      try {
        const newLocation = createLocation(location);
        await loadData();
        return newLocation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create location';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const editLocation = useCallback(
    async (id: string, updates: Partial<WarehouseLocation>) => {
      try {
        const updated = updateLocation(id, updates);
        await loadData();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update location';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const removeLocation = useCallback(
    async (id: string) => {
      try {
        const success = deleteLocation(id);
        if (success) {
          await loadData();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete location';
        setError(message);
        return false;
      }
    },
    [loadData]
  );

  // Inventory operations
  const getInventoryForProduct = useCallback(
    (productId: string) => {
      return getInventoryByProduct(productId);
    },
    []
  );

  const getInventoryForWarehouse = useCallback(
    (whId: string) => {
      return getInventoryByWarehouse(whId);
    },
    []
  );

  const updateInventory = useCallback(
    async (productId: string, whId: string, updates: Partial<InventoryLevel>) => {
      try {
        const updated = updateInventoryLevel(productId, whId, updates);
        await loadData();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update inventory';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const addStock = useCallback(
    async (locationId: string, productId: string, quantity: number) => {
      try {
        const success = addStockToLocation(locationId, productId, quantity);
        if (success) {
          await loadData();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add stock';
        setError(message);
        return false;
      }
    },
    [loadData]
  );

  const removeStock = useCallback(
    async (locationId: string, productId: string, quantity: number) => {
      try {
        const success = removeStockFromLocation(locationId, productId, quantity);
        if (success) {
          await loadData();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove stock';
        setError(message);
        return false;
      }
    },
    [loadData]
  );

  const moveStock = useCallback(
    async (fromLocationId: string, toLocationId: string, productId: string, quantity: number) => {
      try {
        const success = moveStockBetweenLocations(fromLocationId, toLocationId, productId, quantity);
        if (success) {
          await loadData();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to move stock';
        setError(message);
        return false;
      }
    },
    [loadData]
  );

  // Zone operations
  const addZone = useCallback(
    async (zone: Omit<WarehouseZone, 'id'>) => {
      try {
        const newZone = createZone(zone);
        await loadData();
        return newZone;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create zone';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const editZone = useCallback(
    async (id: string, updates: Partial<WarehouseZone>) => {
      try {
        const updated = updateZone(id, updates);
        await loadData();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update zone';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const removeZone = useCallback(
    async (id: string) => {
      try {
        const success = deleteZone(id);
        if (success) {
          await loadData();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete zone';
        setError(message);
        return false;
      }
    },
    [loadData]
  );

  // Counting operations
  const scheduleCount = useCallback(
    async (count: Omit<InventoryCount, 'id'>) => {
      try {
        const newCount = createInventoryCount(count);
        await loadData();
        return newCount;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to schedule count';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const updateCount = useCallback(
    async (id: string, updates: Partial<InventoryCount>) => {
      try {
        const updated = updateInventoryCount(id, updates);
        await loadData();
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update count';
        setError(message);
        throw err;
      }
    },
    [loadData]
  );

  const completeCount = useCallback(
    async (id: string) => {
      try {
        const success = completeInventoryCount(id);
        if (success) {
          await loadData();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to complete count';
        setError(message);
        return false;
      }
    },
    [loadData]
  );

  // Utility functions
  const getEmptyLocationsList = useCallback(
    (whId: string) => {
      return getEmptyLocations(whId);
    },
    []
  );

  const getOccupiedLocationsList = useCallback(
    (whId: string) => {
      return getOccupiedLocations(whId);
    },
    []
  );

  const findLocationForProduct = useCallback(
    (whId: string, productId: string, quantity: number) => {
      return findAvailableLocation(whId, productId, quantity);
    },
    []
  );

  const getUtilization = useCallback(
    (whId: string) => {
      return getWarehouseUtilization(whId);
    },
    []
  );

  const getCapacityStatus = useCallback(
    (whId: string) => {
      return getWarehouseCapacityStatus(whId);
    },
    []
  );

  const getLowStockItems = useCallback(
    (whId: string) => {
      return getLowStockItemsInWarehouse(whId);
    },
    []
  );

  const getOverstockItems = useCallback(
    (whId: string) => {
      return getOverstockItemsInWarehouse(whId);
    },
    []
  );

  const generateBarcode = useCallback(
    (whId: string, zone: string, aisle: number, shelf: number, bin: number) => {
      return generateLocationBarcode(whId, zone, aisle, shelf, bin);
    },
    []
  );

  return {
    // Data
    warehouses,
    warehouse,
    locations,
    inventory,
    zones,
    counts,
    metrics,

    // State
    isLoading,
    error,

    // Warehouse operations
    addWarehouse,
    editWarehouse,
    removeWarehouse,

    // Location operations
    addLocation,
    editLocation,
    removeLocation,

    // Inventory operations
    getInventoryForProduct,
    getInventoryForWarehouse,
    updateInventory,
    addStock,
    removeStock,
    moveStock,

    // Zone operations
    addZone,
    editZone,
    removeZone,

    // Counting operations
    scheduleCount,
    updateCount,
    completeCount,

    // Utility functions
    getEmptyLocationsList,
    getOccupiedLocationsList,
    findLocationForProduct,
    getUtilization,
    getCapacityStatus,
    getLowStockItems,
    getOverstockItems,
    generateBarcode,
    getTotalInventoryByProduct,
    getAvailableInventoryByProduct,
    getZoneUtilization,

    // Refresh
    refresh: loadData,
  };
}

/**
 * Hook for warehouse list and overview
 */
export function useWarehouseOverview() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouses, setActiveWarehouses] = useState<Warehouse[]>([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [averageUtilization, setAverageUtilization] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = getAllWarehouses();
      setWarehouses(all);

      const active = getActiveWarehouses();
      setActiveWarehouses(active);

      const allInventory = getAllInventoryLevels();
      const total = allInventory.reduce((sum, inv) => sum + inv.totalQuantity, 0);
      setTotalInventory(total);

      // Calculate average utilization
      const utilizations = active.map(w => getWarehouseUtilization(w.id));
      const avgUtil = utilizations.length > 0
        ? utilizations.reduce((sum, u) => sum + u, 0) / utilizations.length
        : 0;
      setAverageUtilization(avgUtil);

      // Count low stock items across all warehouses
      const lowStock = active.reduce((count, w) => {
        return count + getLowStockItemsInWarehouse(w.id).length;
      }, 0);
      setLowStockCount(lowStock);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return {
    warehouses,
    activeWarehouses,
    totalInventory,
    totalValue,
    averageUtilization,
    lowStockCount,
    isLoading,
    refresh: loadOverview,
  };
}
