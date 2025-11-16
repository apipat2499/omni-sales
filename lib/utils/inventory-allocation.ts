/**
 * Inventory Allocation System
 *
 * This module provides smart inventory allocation functionality including:
 * - Smart allocation algorithms (nearest, inventory-based, cost-optimized, hybrid)
 * - Demand forecasting and prediction
 * - Stock distribution optimization
 * - Transfer management and optimization
 * - Allocation rules and priorities
 */

import {
  Warehouse,
  InventoryLevel,
  getWarehouse,
  getAllWarehouses,
  getInventoryLevel,
  getInventoryByProduct,
  updateInventoryLevel,
} from './warehouse-management';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Order {
  id: string;
  customerId: string;
  customerLocation?: {
    lat: number;
    lng: number;
  };
  items: {
    productId: string;
    quantity: number;
  }[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
}

export interface AllocationResult {
  orderId: string;
  allocations: {
    warehouseId: string;
    warehouseName: string;
    items: {
      productId: string;
      quantity: number;
      locationIds: string[];
    }[];
    estimatedShippingCost?: number;
    estimatedDeliveryDays?: number;
    distance?: number;
  }[];
  status: 'full' | 'partial' | 'failed';
  unallocatedItems?: {
    productId: string;
    requestedQty: number;
    allocatedQty: number;
    shortfall: number;
  }[];
}

export interface InventoryTransfer {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;

  items: {
    productId: string;
    quantity: number;
  }[];

  status: 'pending' | 'in-transit' | 'received' | 'cancelled';

  reason: 'rebalancing' | 'demand_forecast' | 'consolidation' | 'manual';

  initiatedAt: Date;
  shipmentDate?: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;

  cost?: number;
  notes?: string;
}

export interface AllocationRule {
  id: string;
  name: string;

  priority: number;
  conditions: {
    productCategory?: string;
    customerRegion?: string;
    orderSize?: 'small' | 'medium' | 'large';
    orderValue?: { min?: number; max?: number };
  };

  algorithm: 'nearest' | 'inventory' | 'cost' | 'hybrid';

  weights?: {
    distance?: number;
    inventory?: number;
    cost?: number;
  };

  isActive: boolean;
  createdAt: Date;
}

export interface DemandForecast {
  productId: string;
  warehouseId?: string;

  period: 'daily' | 'weekly' | 'monthly';
  horizon: number; // days

  forecasts: {
    date: Date;
    predictedDemand: number;
    confidence: number; // 0-1
    upperBound: number;
    lowerBound: number;
  }[];

  algorithm: 'moving_average' | 'exponential_smoothing' | 'linear_regression';
  accuracy?: number;
}

export interface RebalancingPlan {
  id: string;
  createdAt: Date;
  transfers: InventoryTransfer[];
  estimatedCost: number;
  expectedImprovement: number; // percentage
  reason: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRANSFERS_KEY = 'inventory_transfers';
const ALLOCATION_RULES_KEY = 'allocation_rules';
const DEMAND_FORECASTS_KEY = 'demand_forecasts';

// Allocation algorithm weights (for hybrid)
const DEFAULT_WEIGHTS = {
  distance: 0.4,
  inventory: 0.3,
  cost: 0.3,
};

// ============================================================================
// ALLOCATION ALGORITHMS
// ============================================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate shipping cost based on distance and weight
 */
function estimateShippingCost(distance: number, weight: number): number {
  // Simple cost model: base cost + distance cost + weight cost
  const baseCost = 50;
  const distanceCost = distance * 2; // 2 per km
  const weightCost = weight * 5; // 5 per kg
  return baseCost + distanceCost + weightCost;
}

/**
 * Estimate delivery days based on distance
 */
function estimateDeliveryDays(distance: number): number {
  if (distance < 50) return 1;
  if (distance < 200) return 2;
  if (distance < 500) return 3;
  if (distance < 1000) return 5;
  return 7;
}

/**
 * Nearest warehouse allocation
 * Allocates to the closest warehouse that has sufficient stock
 */
export function allocateByNearest(
  order: Order,
  warehouses: Warehouse[]
): AllocationResult {
  if (!order.customerLocation) {
    throw new Error('Customer location required for nearest allocation');
  }

  const { lat: custLat, lng: custLng } = order.customerLocation;
  const allocations: AllocationResult['allocations'] = [];
  const unallocatedItems: AllocationResult['unallocatedItems'] = [];

  // Calculate distances to all warehouses
  const warehousesWithDistance = warehouses
    .filter(w => w.isActive && w.address.coordinates)
    .map(w => ({
      warehouse: w,
      distance: calculateDistance(
        custLat,
        custLng,
        w.address.coordinates!.lat,
        w.address.coordinates!.lng
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  // Try to allocate all items from nearest warehouse
  for (const { warehouse, distance } of warehousesWithDistance) {
    const items: AllocationResult['allocations'][0]['items'] = [];
    let canFulfillAll = true;

    for (const orderItem of order.items) {
      const inventory = getInventoryLevel(orderItem.productId, warehouse.id);

      if (!inventory || inventory.available < orderItem.quantity) {
        canFulfillAll = false;
        break;
      }

      items.push({
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        locationIds: inventory.byLocation.map(l => l.locationId),
      });
    }

    if (canFulfillAll) {
      // Can fulfill entire order from this warehouse
      const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0); // Simplified
      allocations.push({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        items,
        distance,
        estimatedShippingCost: estimateShippingCost(distance, totalWeight),
        estimatedDeliveryDays: estimateDeliveryDays(distance),
      });
      break;
    }
  }

  if (allocations.length === 0) {
    // Partial allocation from multiple warehouses
    return allocatePartial(order, warehousesWithDistance.map(w => w.warehouse));
  }

  return {
    orderId: order.id,
    allocations,
    status: 'full',
  };
}

/**
 * Inventory-based allocation
 * Allocates to warehouse with highest stock to balance inventory
 */
export function allocateByInventory(
  order: Order,
  warehouses: Warehouse[]
): AllocationResult {
  const allocations: AllocationResult['allocations'] = [];

  for (const orderItem of order.items) {
    const inventoryLevels = getInventoryByProduct(orderItem.productId);

    // Sort warehouses by inventory level (descending)
    const warehousesByStock = inventoryLevels
      .filter(inv => inv.available >= orderItem.quantity)
      .sort((a, b) => b.available - a.available);

    if (warehousesByStock.length === 0) {
      // Not enough stock anywhere
      continue;
    }

    const bestInventory = warehousesByStock[0];
    const warehouse = warehouses.find(w => w.id === bestInventory.warehouseId);

    if (!warehouse) continue;

    // Find or create allocation for this warehouse
    let allocation = allocations.find(a => a.warehouseId === warehouse.id);
    if (!allocation) {
      allocation = {
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        items: [],
      };
      allocations.push(allocation);
    }

    allocation.items.push({
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      locationIds: bestInventory.byLocation.map(l => l.locationId),
    });
  }

  return {
    orderId: order.id,
    allocations,
    status: allocations.length > 0 ? 'full' : 'failed',
  };
}

/**
 * Cost-optimized allocation
 * Minimizes total shipping cost
 */
export function allocateByCost(
  order: Order,
  warehouses: Warehouse[]
): AllocationResult {
  if (!order.customerLocation) {
    throw new Error('Customer location required for cost-based allocation');
  }

  const { lat: custLat, lng: custLng } = order.customerLocation;

  // Calculate cost for each warehouse
  const warehousesWithCost = warehouses
    .filter(w => w.isActive && w.address.coordinates)
    .map(w => {
      const distance = calculateDistance(
        custLat,
        custLng,
        w.address.coordinates!.lat,
        w.address.coordinates!.lng
      );
      const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const cost = estimateShippingCost(distance, totalWeight);

      return { warehouse: w, cost, distance };
    })
    .sort((a, b) => a.cost - b.cost);

  // Try warehouses from lowest to highest cost
  for (const { warehouse, cost, distance } of warehousesWithCost) {
    const items: AllocationResult['allocations'][0]['items'] = [];
    let canFulfillAll = true;

    for (const orderItem of order.items) {
      const inventory = getInventoryLevel(orderItem.productId, warehouse.id);

      if (!inventory || inventory.available < orderItem.quantity) {
        canFulfillAll = false;
        break;
      }

      items.push({
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        locationIds: inventory.byLocation.map(l => l.locationId),
      });
    }

    if (canFulfillAll) {
      return {
        orderId: order.id,
        allocations: [
          {
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            items,
            distance,
            estimatedShippingCost: cost,
            estimatedDeliveryDays: estimateDeliveryDays(distance),
          },
        ],
        status: 'full',
      };
    }
  }

  // Partial allocation
  return allocatePartial(order, warehousesWithCost.map(w => w.warehouse));
}

/**
 * Hybrid allocation
 * Combines distance, inventory level, and cost with configurable weights
 */
export function allocateByHybrid(
  order: Order,
  warehouses: Warehouse[],
  weights: typeof DEFAULT_WEIGHTS = DEFAULT_WEIGHTS
): AllocationResult {
  if (!order.customerLocation) {
    throw new Error('Customer location required for hybrid allocation');
  }

  const { lat: custLat, lng: custLng } = order.customerLocation;

  // Calculate scores for each warehouse
  const warehouseScores = warehouses
    .filter(w => w.isActive && w.address.coordinates)
    .map(w => {
      const distance = calculateDistance(
        custLat,
        custLng,
        w.address.coordinates!.lat,
        w.address.coordinates!.lng
      );

      // Calculate total available inventory for this order
      const totalAvailable = order.items.reduce((sum, item) => {
        const inv = getInventoryLevel(item.productId, w.id);
        return sum + (inv?.available || 0);
      }, 0);

      const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const cost = estimateShippingCost(distance, totalWeight);

      // Normalize scores (lower is better)
      const maxDistance = 1000; // km
      const maxCost = 5000;
      const maxInventory = 10000;

      const distanceScore = (1 - Math.min(distance / maxDistance, 1)) * weights.distance;
      const inventoryScore = (totalAvailable / maxInventory) * weights.inventory;
      const costScore = (1 - Math.min(cost / maxCost, 1)) * weights.cost;

      const totalScore = distanceScore + inventoryScore + costScore;

      return {
        warehouse: w,
        score: totalScore,
        distance,
        cost,
      };
    })
    .sort((a, b) => b.score - a.score); // Higher score is better

  // Try warehouses from highest to lowest score
  for (const { warehouse, distance, cost } of warehouseScores) {
    const items: AllocationResult['allocations'][0]['items'] = [];
    let canFulfillAll = true;

    for (const orderItem of order.items) {
      const inventory = getInventoryLevel(orderItem.productId, warehouse.id);

      if (!inventory || inventory.available < orderItem.quantity) {
        canFulfillAll = false;
        break;
      }

      items.push({
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        locationIds: inventory.byLocation.map(l => l.locationId),
      });
    }

    if (canFulfillAll) {
      return {
        orderId: order.id,
        allocations: [
          {
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            items,
            distance,
            estimatedShippingCost: cost,
            estimatedDeliveryDays: estimateDeliveryDays(distance),
          },
        ],
        status: 'full',
      };
    }
  }

  // Partial allocation
  return allocatePartial(order, warehouseScores.map(w => w.warehouse));
}

/**
 * Partial allocation when no single warehouse can fulfill entire order
 */
function allocatePartial(order: Order, warehouses: Warehouse[]): AllocationResult {
  const allocations: AllocationResult['allocations'] = [];
  const unallocatedItems: AllocationResult['unallocatedItems'] = [];

  for (const orderItem of order.items) {
    let remainingQty = orderItem.quantity;
    let allocatedQty = 0;

    for (const warehouse of warehouses) {
      if (remainingQty === 0) break;

      const inventory = getInventoryLevel(orderItem.productId, warehouse.id);
      if (!inventory || inventory.available === 0) continue;

      const qtyToAllocate = Math.min(remainingQty, inventory.available);

      let allocation = allocations.find(a => a.warehouseId === warehouse.id);
      if (!allocation) {
        allocation = {
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          items: [],
        };
        allocations.push(allocation);
      }

      allocation.items.push({
        productId: orderItem.productId,
        quantity: qtyToAllocate,
        locationIds: inventory.byLocation.map(l => l.locationId),
      });

      remainingQty -= qtyToAllocate;
      allocatedQty += qtyToAllocate;
    }

    if (remainingQty > 0) {
      unallocatedItems.push({
        productId: orderItem.productId,
        requestedQty: orderItem.quantity,
        allocatedQty,
        shortfall: remainingQty,
      });
    }
  }

  return {
    orderId: order.id,
    allocations,
    status: unallocatedItems.length === 0 ? 'full' : unallocatedItems.length === order.items.length ? 'failed' : 'partial',
    unallocatedItems: unallocatedItems.length > 0 ? unallocatedItems : undefined,
  };
}

/**
 * Get optimal warehouse for an order using specified algorithm
 */
export function getOptimalWarehouse(
  order: Order,
  algorithm: AllocationRule['algorithm'] = 'hybrid',
  weights?: typeof DEFAULT_WEIGHTS
): Warehouse | null {
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

  if (result.allocations.length === 0) {
    return null;
  }

  return getWarehouse(result.allocations[0].warehouseId);
}

// ============================================================================
// TRANSFER MANAGEMENT
// ============================================================================

/**
 * Get all transfers
 */
export function getAllTransfers(): InventoryTransfer[] {
  try {
    const data = localStorage.getItem(TRANSFERS_KEY);
    if (!data) return [];

    const transfers: InventoryTransfer[] = JSON.parse(data);
    return transfers.map(t => ({
      ...t,
      initiatedAt: new Date(t.initiatedAt),
      shipmentDate: t.shipmentDate ? new Date(t.shipmentDate) : undefined,
      estimatedDelivery: t.estimatedDelivery ? new Date(t.estimatedDelivery) : undefined,
      actualDelivery: t.actualDelivery ? new Date(t.actualDelivery) : undefined,
    }));
  } catch (err) {
    console.error('Error getting transfers:', err);
    return [];
  }
}

/**
 * Create transfer
 */
export function createTransfer(
  transfer: Omit<InventoryTransfer, 'id' | 'initiatedAt'>
): InventoryTransfer {
  try {
    const transfers = getAllTransfers();

    // Validate warehouses exist
    const fromWarehouse = getWarehouse(transfer.fromWarehouse);
    const toWarehouse = getWarehouse(transfer.toWarehouse);

    if (!fromWarehouse || !toWarehouse) {
      throw new Error('Invalid warehouse');
    }

    // Validate inventory availability
    for (const item of transfer.items) {
      const inventory = getInventoryLevel(item.productId, transfer.fromWarehouse);
      if (!inventory || inventory.available < item.quantity) {
        throw new Error(`Insufficient inventory for product ${item.productId}`);
      }
    }

    const newTransfer: InventoryTransfer = {
      ...transfer,
      id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      initiatedAt: new Date(),
    };

    transfers.push(newTransfer);
    localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));

    // Update inventory levels (mark as in-transit)
    for (const item of transfer.items) {
      const fromInventory = getInventoryLevel(item.productId, transfer.fromWarehouse);
      if (fromInventory) {
        updateInventoryLevel(item.productId, transfer.fromWarehouse, {
          available: fromInventory.available - item.quantity,
          inTransit: fromInventory.inTransit + item.quantity,
        });
      }
    }

    return newTransfer;
  } catch (err) {
    console.error('Error creating transfer:', err);
    throw err;
  }
}

/**
 * Update transfer status
 */
export function updateTransferStatus(
  id: string,
  status: InventoryTransfer['status']
): InventoryTransfer | null {
  try {
    const transfers = getAllTransfers();
    const index = transfers.findIndex(t => t.id === id);

    if (index === -1) {
      throw new Error('Transfer not found');
    }

    const transfer = transfers[index];
    const updated: InventoryTransfer = {
      ...transfer,
      status,
    };

    if (status === 'in-transit' && !transfer.shipmentDate) {
      updated.shipmentDate = new Date();
    }

    if (status === 'received') {
      updated.actualDelivery = new Date();

      // Update inventory levels
      for (const item of transfer.items) {
        // Remove from source in-transit
        const fromInventory = getInventoryLevel(item.productId, transfer.fromWarehouse);
        if (fromInventory) {
          updateInventoryLevel(item.productId, transfer.fromWarehouse, {
            totalQuantity: fromInventory.totalQuantity - item.quantity,
            inTransit: fromInventory.inTransit - item.quantity,
          });
        }

        // Add to destination
        const toInventory = getInventoryLevel(item.productId, transfer.toWarehouse);
        const newTotal = (toInventory?.totalQuantity || 0) + item.quantity;
        const newAvailable = (toInventory?.available || 0) + item.quantity;

        updateInventoryLevel(item.productId, transfer.toWarehouse, {
          totalQuantity: newTotal,
          available: newAvailable,
        });
      }
    }

    if (status === 'cancelled') {
      // Return inventory to available
      for (const item of transfer.items) {
        const fromInventory = getInventoryLevel(item.productId, transfer.fromWarehouse);
        if (fromInventory) {
          updateInventoryLevel(item.productId, transfer.fromWarehouse, {
            available: fromInventory.available + item.quantity,
            inTransit: fromInventory.inTransit - item.quantity,
          });
        }
      }
    }

    transfers[index] = updated;
    localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));

    return updated;
  } catch (err) {
    console.error('Error updating transfer:', err);
    return null;
  }
}

/**
 * Get transfers by warehouse
 */
export function getTransfersByWarehouse(warehouseId: string): InventoryTransfer[] {
  return getAllTransfers().filter(
    t => t.fromWarehouse === warehouseId || t.toWarehouse === warehouseId
  );
}

/**
 * Get pending transfers
 */
export function getPendingTransfers(): InventoryTransfer[] {
  return getAllTransfers().filter(t => t.status === 'pending' || t.status === 'in-transit');
}

// ============================================================================
// DEMAND FORECASTING
// ============================================================================

/**
 * Simple moving average forecast
 */
export function forecastDemandMovingAverage(
  historicalDemand: { date: Date; quantity: number }[],
  horizon: number = 7,
  windowSize: number = 7
): DemandForecast['forecasts'] {
  if (historicalDemand.length < windowSize) {
    throw new Error('Insufficient historical data');
  }

  const forecasts: DemandForecast['forecasts'] = [];

  // Calculate moving average
  const recentData = historicalDemand.slice(-windowSize);
  const avgDemand = recentData.reduce((sum, d) => sum + d.quantity, 0) / windowSize;

  // Calculate standard deviation for confidence bounds
  const variance = recentData.reduce((sum, d) => sum + Math.pow(d.quantity - avgDemand, 2), 0) / windowSize;
  const stdDev = Math.sqrt(variance);

  // Generate forecasts
  for (let i = 1; i <= horizon; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i);

    forecasts.push({
      date: forecastDate,
      predictedDemand: Math.round(avgDemand),
      confidence: 0.7, // 70% confidence for simple MA
      upperBound: Math.round(avgDemand + 1.96 * stdDev), // 95% confidence interval
      lowerBound: Math.max(0, Math.round(avgDemand - 1.96 * stdDev)),
    });
  }

  return forecasts;
}

/**
 * Exponential smoothing forecast
 */
export function forecastDemandExponentialSmoothing(
  historicalDemand: { date: Date; quantity: number }[],
  horizon: number = 7,
  alpha: number = 0.3
): DemandForecast['forecasts'] {
  if (historicalDemand.length === 0) {
    throw new Error('No historical data');
  }

  const forecasts: DemandForecast['forecasts'] = [];

  // Initialize with first value
  let smoothed = historicalDemand[0].quantity;

  // Apply exponential smoothing to historical data
  for (let i = 1; i < historicalDemand.length; i++) {
    smoothed = alpha * historicalDemand[i].quantity + (1 - alpha) * smoothed;
  }

  // Calculate error for confidence bounds
  const errors = historicalDemand.slice(1).map((d, i) => {
    let s = historicalDemand[0].quantity;
    for (let j = 1; j <= i; j++) {
      s = alpha * historicalDemand[j].quantity + (1 - alpha) * s;
    }
    return Math.abs(d.quantity - s);
  });

  const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;

  // Generate forecasts
  for (let i = 1; i <= horizon; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i);

    forecasts.push({
      date: forecastDate,
      predictedDemand: Math.round(smoothed),
      confidence: 0.75,
      upperBound: Math.round(smoothed + 1.5 * avgError),
      lowerBound: Math.max(0, Math.round(smoothed - 1.5 * avgError)),
    });
  }

  return forecasts;
}

/**
 * Predict demand for a product
 */
export function predictDemand(
  productId: string,
  warehouseId: string | undefined,
  days: number = 30
): DemandForecast | null {
  try {
    // In a real implementation, this would fetch actual historical sales data
    // For now, we'll generate sample data
    const historicalDemand: { date: Date; quantity: number }[] = [];

    for (let i = 30; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      historicalDemand.push({
        date,
        quantity: Math.floor(Math.random() * 50) + 10, // Random data
      });
    }

    const forecasts = forecastDemandExponentialSmoothing(historicalDemand, days);

    return {
      productId,
      warehouseId,
      period: 'daily',
      horizon: days,
      forecasts,
      algorithm: 'exponential_smoothing',
      accuracy: 0.85,
    };
  } catch (err) {
    console.error('Error predicting demand:', err);
    return null;
  }
}

// ============================================================================
// REBALANCING
// ============================================================================

/**
 * Generate rebalancing plan to optimize inventory distribution
 */
export function generateRebalancingPlan(): RebalancingPlan {
  const warehouses = getAllWarehouses().filter(w => w.isActive);
  const transfers: InventoryTransfer[] = [];

  // Analyze inventory distribution
  const products = new Set<string>();
  warehouses.forEach(w => {
    getInventoryByWarehouse(w.id).forEach(inv => products.add(inv.productId));
  });

  for (const productId of products) {
    const inventoryLevels = getInventoryByProduct(productId);

    if (inventoryLevels.length < 2) continue;

    // Find warehouses with excess and deficit
    const avgStock = inventoryLevels.reduce((sum, inv) => sum + inv.totalQuantity, 0) / inventoryLevels.length;

    const excess = inventoryLevels.filter(inv => inv.totalQuantity > avgStock * 1.5);
    const deficit = inventoryLevels.filter(inv => inv.totalQuantity < avgStock * 0.5 && inv.reorderPoint);

    // Create transfers from excess to deficit
    for (const excessInv of excess) {
      for (const deficitInv of deficit) {
        const transferQty = Math.floor((excessInv.totalQuantity - avgStock) / 2);

        if (transferQty > 0 && excessInv.available >= transferQty) {
          transfers.push({
            id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fromWarehouse: excessInv.warehouseId,
            toWarehouse: deficitInv.warehouseId,
            items: [{ productId, quantity: transferQty }],
            status: 'pending',
            reason: 'rebalancing',
            initiatedAt: new Date(),
          });
        }
      }
    }
  }

  const estimatedCost = transfers.reduce((sum, t) => sum + (t.cost || 100), 0);

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date(),
    transfers,
    estimatedCost,
    expectedImprovement: 15, // Percentage
    reason: 'Optimize inventory distribution across warehouses',
  };
}
