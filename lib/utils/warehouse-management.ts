/**
 * Multi-warehouse Location Management System
 *
 * This module provides comprehensive warehouse management functionality including:
 * - Warehouse CRUD operations
 * - Location management (zones, aisles, shelves, bins)
 * - Inventory distribution across warehouses
 * - Zone management and organization
 * - Barcode generation for locations
 * - Stock tracking and counting
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: 'primary' | 'secondary' | 'regional' | 'pop-up';

  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };

  capacity: {
    totalSlots: number;
    usedSlots: number;
    volume?: number; // cubic meters
  };

  hours: {
    open: string; // HH:mm
    close: string;
    timezone: string;
  };

  staff: {
    managers: string[];
    capacity: number;
  };

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  zone: string; // A, B, C, etc.
  aisle: number;
  shelf: number;
  bin: number;

  barcode?: string;

  currentStock: {
    productId: string;
    quantity: number;
  }[];

  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: 'cm' | 'in';
  };

  maxWeight?: number;
  temperature?: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLevel {
  productId: string;
  warehouseId: string;

  totalQuantity: number;

  byLocation: {
    locationId: string;
    quantity: number;
  }[];

  inTransit: number; // From other warehouses
  reserved: number; // For orders
  available: number; // Free to allocate

  lastCountDate: Date;
  nextCountSchedule: Date;

  reorderPoint?: number;
  maxStock?: number;
}

export interface InventoryCount {
  id: string;
  warehouseId: string;
  locationId?: string;
  type: 'full' | 'cycle' | 'spot';

  items: {
    productId: string;
    expectedQty: number;
    actualQty: number;
    variance: number;
  }[];

  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

  scheduledDate: Date;
  startedAt?: Date;
  completedAt?: Date;

  conductedBy?: string;
  notes?: string;
}

export interface WarehouseZone {
  id: string;
  warehouseId: string;
  name: string;
  code: string;

  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'quarantine';

  aisleRange: {
    start: number;
    end: number;
  };

  capacity: number;
  usedCapacity: number;

  temperature?: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };

  isActive: boolean;
}

export interface WarehouseMetrics {
  warehouseId: string;
  date: Date;

  utilization: number; // Percentage
  throughput: number; // Items per day
  accuracy: number; // Percentage

  inboundVolume: number;
  outboundVolume: number;

  cycleCountAccuracy: number;
  pickAccuracy: number;

  avgPickTime: number; // minutes
  avgPackTime: number; // minutes
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WAREHOUSES_KEY = 'warehouses';
const LOCATIONS_KEY = 'warehouse_locations';
const INVENTORY_LEVELS_KEY = 'inventory_levels';
const INVENTORY_COUNTS_KEY = 'inventory_counts';
const ZONES_KEY = 'warehouse_zones';
const METRICS_KEY = 'warehouse_metrics';

// ============================================================================
// WAREHOUSE CRUD OPERATIONS
// ============================================================================

/**
 * Get all warehouses
 */
export function getAllWarehouses(): Warehouse[] {
  try {
    const data = localStorage.getItem(WAREHOUSES_KEY);
    if (!data) return [];

    const warehouses: Warehouse[] = JSON.parse(data);
    return warehouses.map(w => ({
      ...w,
      createdAt: new Date(w.createdAt),
      updatedAt: new Date(w.updatedAt),
    }));
  } catch (err) {
    console.error('Error getting warehouses:', err);
    return [];
  }
}

/**
 * Get warehouse by ID
 */
export function getWarehouse(id: string): Warehouse | null {
  try {
    const warehouses = getAllWarehouses();
    return warehouses.find(w => w.id === id) || null;
  } catch (err) {
    console.error('Error getting warehouse:', err);
    return null;
  }
}

/**
 * Get warehouse by code
 */
export function getWarehouseByCode(code: string): Warehouse | null {
  try {
    const warehouses = getAllWarehouses();
    return warehouses.find(w => w.code.toLowerCase() === code.toLowerCase()) || null;
  } catch (err) {
    console.error('Error getting warehouse by code:', err);
    return null;
  }
}

/**
 * Create a new warehouse
 */
export function createWarehouse(warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Warehouse {
  try {
    const warehouses = getAllWarehouses();

    // Validate unique code
    if (warehouses.some(w => w.code.toLowerCase() === warehouse.code.toLowerCase())) {
      throw new Error('Warehouse code already exists');
    }

    const newWarehouse: Warehouse = {
      ...warehouse,
      id: `wh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    warehouses.push(newWarehouse);
    localStorage.setItem(WAREHOUSES_KEY, JSON.stringify(warehouses));

    return newWarehouse;
  } catch (err) {
    console.error('Error creating warehouse:', err);
    throw err;
  }
}

/**
 * Update warehouse
 */
export function updateWarehouse(id: string, updates: Partial<Warehouse>): Warehouse | null {
  try {
    const warehouses = getAllWarehouses();
    const index = warehouses.findIndex(w => w.id === id);

    if (index === -1) {
      throw new Error('Warehouse not found');
    }

    // Validate unique code if being updated
    if (updates.code) {
      const existingCode = warehouses.find(
        w => w.id !== id && w.code.toLowerCase() === updates.code!.toLowerCase()
      );
      if (existingCode) {
        throw new Error('Warehouse code already exists');
      }
    }

    const updated: Warehouse = {
      ...warehouses[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    warehouses[index] = updated;
    localStorage.setItem(WAREHOUSES_KEY, JSON.stringify(warehouses));

    return updated;
  } catch (err) {
    console.error('Error updating warehouse:', err);
    throw err;
  }
}

/**
 * Delete warehouse
 */
export function deleteWarehouse(id: string): boolean {
  try {
    const warehouses = getAllWarehouses();
    const filtered = warehouses.filter(w => w.id !== id);

    if (filtered.length === warehouses.length) {
      return false; // Warehouse not found
    }

    // Also delete associated locations, inventory, etc.
    deleteWarehouseLocations(id);
    deleteWarehouseInventory(id);
    deleteWarehouseZones(id);

    localStorage.setItem(WAREHOUSES_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Error deleting warehouse:', err);
    return false;
  }
}

/**
 * Get active warehouses
 */
export function getActiveWarehouses(): Warehouse[] {
  return getAllWarehouses().filter(w => w.isActive);
}

/**
 * Get warehouses by type
 */
export function getWarehousesByType(type: Warehouse['type']): Warehouse[] {
  return getAllWarehouses().filter(w => w.type === type);
}

// ============================================================================
// LOCATION MANAGEMENT
// ============================================================================

/**
 * Get all locations
 */
export function getAllLocations(): WarehouseLocation[] {
  try {
    const data = localStorage.getItem(LOCATIONS_KEY);
    if (!data) return [];

    const locations: WarehouseLocation[] = JSON.parse(data);
    return locations.map(l => ({
      ...l,
      createdAt: new Date(l.createdAt),
      updatedAt: new Date(l.updatedAt),
    }));
  } catch (err) {
    console.error('Error getting locations:', err);
    return [];
  }
}

/**
 * Get locations by warehouse
 */
export function getLocationsByWarehouse(warehouseId: string): WarehouseLocation[] {
  return getAllLocations().filter(l => l.warehouseId === warehouseId);
}

/**
 * Get location by ID
 */
export function getLocation(id: string): WarehouseLocation | null {
  const locations = getAllLocations();
  return locations.find(l => l.id === id) || null;
}

/**
 * Get location by barcode
 */
export function getLocationByBarcode(barcode: string): WarehouseLocation | null {
  const locations = getAllLocations();
  return locations.find(l => l.barcode === barcode) || null;
}

/**
 * Create warehouse location
 */
export function createLocation(
  location: Omit<WarehouseLocation, 'id' | 'createdAt' | 'updatedAt' | 'barcode'>
): WarehouseLocation {
  try {
    const locations = getAllLocations();

    // Check if location already exists
    const existing = locations.find(
      l =>
        l.warehouseId === location.warehouseId &&
        l.zone === location.zone &&
        l.aisle === location.aisle &&
        l.shelf === location.shelf &&
        l.bin === location.bin
    );

    if (existing) {
      throw new Error('Location already exists');
    }

    // Generate barcode
    const barcode = generateLocationBarcode(
      location.warehouseId,
      location.zone,
      location.aisle,
      location.shelf,
      location.bin
    );

    const newLocation: WarehouseLocation = {
      ...location,
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      barcode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    locations.push(newLocation);
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));

    // Update warehouse capacity
    updateWarehouseCapacity(location.warehouseId);

    return newLocation;
  } catch (err) {
    console.error('Error creating location:', err);
    throw err;
  }
}

/**
 * Update location
 */
export function updateLocation(id: string, updates: Partial<WarehouseLocation>): WarehouseLocation | null {
  try {
    const locations = getAllLocations();
    const index = locations.findIndex(l => l.id === id);

    if (index === -1) {
      throw new Error('Location not found');
    }

    const updated: WarehouseLocation = {
      ...locations[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    locations[index] = updated;
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));

    return updated;
  } catch (err) {
    console.error('Error updating location:', err);
    throw err;
  }
}

/**
 * Delete location
 */
export function deleteLocation(id: string): boolean {
  try {
    const locations = getAllLocations();
    const location = locations.find(l => l.id === id);

    if (!location) {
      return false;
    }

    const filtered = locations.filter(l => l.id !== id);
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(filtered));

    // Update warehouse capacity
    updateWarehouseCapacity(location.warehouseId);

    return true;
  } catch (err) {
    console.error('Error deleting location:', err);
    return false;
  }
}

/**
 * Delete all locations for a warehouse
 */
function deleteWarehouseLocations(warehouseId: string): void {
  const locations = getAllLocations();
  const filtered = locations.filter(l => l.warehouseId !== warehouseId);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(filtered));
}

/**
 * Generate location barcode
 */
export function generateLocationBarcode(
  warehouseId: string,
  zone: string,
  aisle: number,
  shelf: number,
  bin: number
): string {
  const warehouse = getWarehouse(warehouseId);
  const whCode = warehouse?.code || 'WH';

  return `${whCode}-${zone}${String(aisle).padStart(2, '0')}${String(shelf).padStart(2, '0')}${String(bin).padStart(2, '0')}`;
}

/**
 * Get locations by zone
 */
export function getLocationsByZone(warehouseId: string, zone: string): WarehouseLocation[] {
  return getAllLocations().filter(l => l.warehouseId === warehouseId && l.zone === zone);
}

/**
 * Get empty locations
 */
export function getEmptyLocations(warehouseId: string): WarehouseLocation[] {
  return getAllLocations().filter(
    l => l.warehouseId === warehouseId && l.isActive && l.currentStock.length === 0
  );
}

/**
 * Get occupied locations
 */
export function getOccupiedLocations(warehouseId: string): WarehouseLocation[] {
  return getAllLocations().filter(
    l => l.warehouseId === warehouseId && l.currentStock.length > 0
  );
}

/**
 * Find available location for product
 */
export function findAvailableLocation(
  warehouseId: string,
  productId: string,
  quantity: number
): WarehouseLocation | null {
  const locations = getLocationsByWarehouse(warehouseId).filter(l => l.isActive);

  // First try to find existing location with same product
  const existingLocation = locations.find(l =>
    l.currentStock.some(s => s.productId === productId)
  );

  if (existingLocation) {
    return existingLocation;
  }

  // Find empty location
  const emptyLocation = locations.find(l => l.currentStock.length === 0);
  return emptyLocation || null;
}

// ============================================================================
// INVENTORY DISTRIBUTION
// ============================================================================

/**
 * Get all inventory levels
 */
export function getAllInventoryLevels(): InventoryLevel[] {
  try {
    const data = localStorage.getItem(INVENTORY_LEVELS_KEY);
    if (!data) return [];

    const levels: InventoryLevel[] = JSON.parse(data);
    return levels.map(l => ({
      ...l,
      lastCountDate: new Date(l.lastCountDate),
      nextCountSchedule: new Date(l.nextCountSchedule),
    }));
  } catch (err) {
    console.error('Error getting inventory levels:', err);
    return [];
  }
}

/**
 * Get inventory levels by product
 */
export function getInventoryByProduct(productId: string): InventoryLevel[] {
  return getAllInventoryLevels().filter(l => l.productId === productId);
}

/**
 * Get inventory levels by warehouse
 */
export function getInventoryByWarehouse(warehouseId: string): InventoryLevel[] {
  return getAllInventoryLevels().filter(l => l.warehouseId === warehouseId);
}

/**
 * Get specific inventory level
 */
export function getInventoryLevel(productId: string, warehouseId: string): InventoryLevel | null {
  const levels = getAllInventoryLevels();
  return levels.find(l => l.productId === productId && l.warehouseId === warehouseId) || null;
}

/**
 * Update inventory level
 */
export function updateInventoryLevel(
  productId: string,
  warehouseId: string,
  updates: Partial<InventoryLevel>
): InventoryLevel {
  try {
    const levels = getAllInventoryLevels();
    const index = levels.findIndex(l => l.productId === productId && l.warehouseId === warehouseId);

    let updated: InventoryLevel;

    if (index === -1) {
      // Create new inventory level
      updated = {
        productId,
        warehouseId,
        totalQuantity: 0,
        byLocation: [],
        inTransit: 0,
        reserved: 0,
        available: 0,
        lastCountDate: new Date(),
        nextCountSchedule: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        ...updates,
      };
      levels.push(updated);
    } else {
      updated = {
        ...levels[index],
        ...updates,
      };
      levels[index] = updated;
    }

    // Recalculate available
    updated.available = updated.totalQuantity - updated.reserved - updated.inTransit;

    localStorage.setItem(INVENTORY_LEVELS_KEY, JSON.stringify(levels));
    return updated;
  } catch (err) {
    console.error('Error updating inventory level:', err);
    throw err;
  }
}

/**
 * Add stock to location
 */
export function addStockToLocation(
  locationId: string,
  productId: string,
  quantity: number
): boolean {
  try {
    const location = getLocation(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    // Update location stock
    const existingStock = location.currentStock.find(s => s.productId === productId);
    if (existingStock) {
      existingStock.quantity += quantity;
    } else {
      location.currentStock.push({ productId, quantity });
    }

    updateLocation(locationId, { currentStock: location.currentStock });

    // Update inventory level
    const inventoryLevel = getInventoryLevel(productId, location.warehouseId);
    const totalQuantity = (inventoryLevel?.totalQuantity || 0) + quantity;

    const byLocation = inventoryLevel?.byLocation || [];
    const locationIndex = byLocation.findIndex(l => l.locationId === locationId);

    if (locationIndex === -1) {
      byLocation.push({ locationId, quantity });
    } else {
      byLocation[locationIndex].quantity += quantity;
    }

    updateInventoryLevel(productId, location.warehouseId, {
      totalQuantity,
      byLocation,
    });

    return true;
  } catch (err) {
    console.error('Error adding stock to location:', err);
    return false;
  }
}

/**
 * Remove stock from location
 */
export function removeStockFromLocation(
  locationId: string,
  productId: string,
  quantity: number
): boolean {
  try {
    const location = getLocation(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    const stockIndex = location.currentStock.findIndex(s => s.productId === productId);
    if (stockIndex === -1) {
      throw new Error('Product not found in location');
    }

    const currentQty = location.currentStock[stockIndex].quantity;
    if (currentQty < quantity) {
      throw new Error('Insufficient stock in location');
    }

    // Update location stock
    location.currentStock[stockIndex].quantity -= quantity;
    if (location.currentStock[stockIndex].quantity === 0) {
      location.currentStock.splice(stockIndex, 1);
    }

    updateLocation(locationId, { currentStock: location.currentStock });

    // Update inventory level
    const inventoryLevel = getInventoryLevel(productId, location.warehouseId);
    if (!inventoryLevel) {
      throw new Error('Inventory level not found');
    }

    const totalQuantity = inventoryLevel.totalQuantity - quantity;
    const byLocation = inventoryLevel.byLocation.map(l =>
      l.locationId === locationId
        ? { ...l, quantity: l.quantity - quantity }
        : l
    ).filter(l => l.quantity > 0);

    updateInventoryLevel(productId, location.warehouseId, {
      totalQuantity,
      byLocation,
    });

    return true;
  } catch (err) {
    console.error('Error removing stock from location:', err);
    return false;
  }
}

/**
 * Move stock between locations
 */
export function moveStockBetweenLocations(
  fromLocationId: string,
  toLocationId: string,
  productId: string,
  quantity: number
): boolean {
  try {
    const fromLocation = getLocation(fromLocationId);
    const toLocation = getLocation(toLocationId);

    if (!fromLocation || !toLocation) {
      throw new Error('Location not found');
    }

    if (fromLocation.warehouseId !== toLocation.warehouseId) {
      throw new Error('Locations must be in the same warehouse');
    }

    // Remove from source
    removeStockFromLocation(fromLocationId, productId, quantity);

    // Add to destination
    addStockToLocation(toLocationId, productId, quantity);

    return true;
  } catch (err) {
    console.error('Error moving stock between locations:', err);
    return false;
  }
}

/**
 * Delete warehouse inventory
 */
function deleteWarehouseInventory(warehouseId: string): void {
  const levels = getAllInventoryLevels();
  const filtered = levels.filter(l => l.warehouseId !== warehouseId);
  localStorage.setItem(INVENTORY_LEVELS_KEY, JSON.stringify(filtered));
}

/**
 * Get total inventory across all warehouses
 */
export function getTotalInventoryByProduct(productId: string): number {
  const levels = getInventoryByProduct(productId);
  return levels.reduce((sum, l) => sum + l.totalQuantity, 0);
}

/**
 * Get available inventory (not reserved or in transit)
 */
export function getAvailableInventoryByProduct(productId: string): number {
  const levels = getInventoryByProduct(productId);
  return levels.reduce((sum, l) => sum + l.available, 0);
}

// ============================================================================
// ZONE MANAGEMENT
// ============================================================================

/**
 * Get all zones
 */
export function getAllZones(): WarehouseZone[] {
  try {
    const data = localStorage.getItem(ZONES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Error getting zones:', err);
    return [];
  }
}

/**
 * Get zones by warehouse
 */
export function getZonesByWarehouse(warehouseId: string): WarehouseZone[] {
  return getAllZones().filter(z => z.warehouseId === warehouseId);
}

/**
 * Create zone
 */
export function createZone(zone: Omit<WarehouseZone, 'id'>): WarehouseZone {
  try {
    const zones = getAllZones();

    const newZone: WarehouseZone = {
      ...zone,
      id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    zones.push(newZone);
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones));

    return newZone;
  } catch (err) {
    console.error('Error creating zone:', err);
    throw err;
  }
}

/**
 * Update zone
 */
export function updateZone(id: string, updates: Partial<WarehouseZone>): WarehouseZone | null {
  try {
    const zones = getAllZones();
    const index = zones.findIndex(z => z.id === id);

    if (index === -1) {
      return null;
    }

    const updated = {
      ...zones[index],
      ...updates,
      id,
    };

    zones[index] = updated;
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones));

    return updated;
  } catch (err) {
    console.error('Error updating zone:', err);
    return null;
  }
}

/**
 * Delete zone
 */
export function deleteZone(id: string): boolean {
  try {
    const zones = getAllZones();
    const filtered = zones.filter(z => z.id !== id);

    if (filtered.length === zones.length) {
      return false;
    }

    localStorage.setItem(ZONES_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Error deleting zone:', err);
    return false;
  }
}

/**
 * Delete warehouse zones
 */
function deleteWarehouseZones(warehouseId: string): void {
  const zones = getAllZones();
  const filtered = zones.filter(z => z.warehouseId !== warehouseId);
  localStorage.setItem(ZONES_KEY, JSON.stringify(filtered));
}

/**
 * Get zone utilization
 */
export function getZoneUtilization(zoneId: string): number {
  const zone = getAllZones().find(z => z.id === zoneId);
  if (!zone || zone.capacity === 0) return 0;
  return (zone.usedCapacity / zone.capacity) * 100;
}

// ============================================================================
// INVENTORY COUNTING
// ============================================================================

/**
 * Get all inventory counts
 */
export function getAllInventoryCounts(): InventoryCount[] {
  try {
    const data = localStorage.getItem(INVENTORY_COUNTS_KEY);
    if (!data) return [];

    const counts: InventoryCount[] = JSON.parse(data);
    return counts.map(c => ({
      ...c,
      scheduledDate: new Date(c.scheduledDate),
      startedAt: c.startedAt ? new Date(c.startedAt) : undefined,
      completedAt: c.completedAt ? new Date(c.completedAt) : undefined,
    }));
  } catch (err) {
    console.error('Error getting inventory counts:', err);
    return [];
  }
}

/**
 * Create inventory count
 */
export function createInventoryCount(
  count: Omit<InventoryCount, 'id'>
): InventoryCount {
  try {
    const counts = getAllInventoryCounts();

    const newCount: InventoryCount = {
      ...count,
      id: `count-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    counts.push(newCount);
    localStorage.setItem(INVENTORY_COUNTS_KEY, JSON.stringify(counts));

    return newCount;
  } catch (err) {
    console.error('Error creating inventory count:', err);
    throw err;
  }
}

/**
 * Update inventory count
 */
export function updateInventoryCount(
  id: string,
  updates: Partial<InventoryCount>
): InventoryCount | null {
  try {
    const counts = getAllInventoryCounts();
    const index = counts.findIndex(c => c.id === id);

    if (index === -1) {
      return null;
    }

    const updated = {
      ...counts[index],
      ...updates,
      id,
    };

    counts[index] = updated;
    localStorage.setItem(INVENTORY_COUNTS_KEY, JSON.stringify(counts));

    return updated;
  } catch (err) {
    console.error('Error updating inventory count:', err);
    return null;
  }
}

/**
 * Complete inventory count and adjust stock
 */
export function completeInventoryCount(id: string): boolean {
  try {
    const count = getAllInventoryCounts().find(c => c.id === id);
    if (!count) {
      throw new Error('Count not found');
    }

    // Update inventory levels based on actual counts
    count.items.forEach(item => {
      if (item.variance !== 0) {
        const inventoryLevel = getInventoryLevel(item.productId, count.warehouseId);
        if (inventoryLevel) {
          const newTotal = inventoryLevel.totalQuantity + item.variance;
          updateInventoryLevel(item.productId, count.warehouseId, {
            totalQuantity: newTotal,
            lastCountDate: new Date(),
          });
        }
      }
    });

    // Mark count as completed
    updateInventoryCount(id, {
      status: 'completed',
      completedAt: new Date(),
    });

    return true;
  } catch (err) {
    console.error('Error completing inventory count:', err);
    return false;
  }
}

// ============================================================================
// WAREHOUSE CAPACITY MANAGEMENT
// ============================================================================

/**
 * Update warehouse capacity based on locations
 */
export function updateWarehouseCapacity(warehouseId: string): void {
  const locations = getLocationsByWarehouse(warehouseId);
  const totalSlots = locations.length;
  const usedSlots = locations.filter(l => l.currentStock.length > 0).length;

  updateWarehouse(warehouseId, {
    capacity: {
      totalSlots,
      usedSlots,
    },
  });
}

/**
 * Get warehouse utilization percentage
 */
export function getWarehouseUtilization(warehouseId: string): number {
  const warehouse = getWarehouse(warehouseId);
  if (!warehouse || warehouse.capacity.totalSlots === 0) return 0;
  return (warehouse.capacity.usedSlots / warehouse.capacity.totalSlots) * 100;
}

/**
 * Get warehouse capacity status
 */
export function getWarehouseCapacityStatus(warehouseId: string): 'low' | 'medium' | 'high' | 'full' {
  const utilization = getWarehouseUtilization(warehouseId);

  if (utilization >= 95) return 'full';
  if (utilization >= 80) return 'high';
  if (utilization >= 50) return 'medium';
  return 'low';
}

// ============================================================================
// METRICS AND ANALYTICS
// ============================================================================

/**
 * Calculate warehouse metrics
 */
export function calculateWarehouseMetrics(warehouseId: string): WarehouseMetrics {
  const warehouse = getWarehouse(warehouseId);
  const inventory = getInventoryByWarehouse(warehouseId);
  const counts = getAllInventoryCounts().filter(
    c => c.warehouseId === warehouseId && c.status === 'completed'
  );

  // Calculate utilization
  const utilization = getWarehouseUtilization(warehouseId);

  // Calculate accuracy from recent counts
  const recentCounts = counts.slice(-10);
  const totalVariance = recentCounts.reduce((sum, count) => {
    const variance = count.items.reduce((s, item) => s + Math.abs(item.variance), 0);
    const expected = count.items.reduce((s, item) => s + item.expectedQty, 0);
    return sum + (expected > 0 ? (1 - variance / expected) : 1);
  }, 0);
  const accuracy = recentCounts.length > 0 ? (totalVariance / recentCounts.length) * 100 : 100;

  return {
    warehouseId,
    date: new Date(),
    utilization,
    throughput: 0, // Would be calculated from actual transaction data
    accuracy,
    inboundVolume: 0,
    outboundVolume: 0,
    cycleCountAccuracy: accuracy,
    pickAccuracy: 0,
    avgPickTime: 0,
    avgPackTime: 0,
  };
}

/**
 * Get low stock items in warehouse
 */
export function getLowStockItemsInWarehouse(warehouseId: string): InventoryLevel[] {
  const inventory = getInventoryByWarehouse(warehouseId);
  return inventory.filter(item => {
    if (!item.reorderPoint) return false;
    return item.totalQuantity <= item.reorderPoint;
  });
}

/**
 * Get overstock items in warehouse
 */
export function getOverstockItemsInWarehouse(warehouseId: string): InventoryLevel[] {
  const inventory = getInventoryByWarehouse(warehouseId);
  return inventory.filter(item => {
    if (!item.maxStock) return false;
    return item.totalQuantity > item.maxStock;
  });
}
