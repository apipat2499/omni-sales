/**
 * Real-time stock management and inventory tracking
 */

export interface StockLevel {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  lastUpdated: Date;
  status: 'in-stock' | 'low-stock' | 'critical' | 'out-of-stock';
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  timestamp: Date;
  updatedBy?: string;
  notes?: string;
}

export interface StockAlert {
  productId: string;
  productName: string;
  type: 'low-stock' | 'out-of-stock' | 'overstock';
  currentStock: number;
  threshold: number;
  createdAt: Date;
  acknowledged: boolean;
}

const STOCK_KEY = 'product_stock';
const MOVEMENTS_KEY = 'stock_movements';
const ALERTS_KEY = 'stock_alerts';

/**
 * Get current stock level
 */
export function getStockLevel(productId: string): StockLevel | null {
  try {
    const data = localStorage.getItem(STOCK_KEY);
    if (!data) return null;

    const stocks: StockLevel[] = JSON.parse(data);
    const stock = stocks.find((s) => s.productId === productId);

    if (stock) {
      return {
        ...stock,
        lastUpdated: new Date(stock.lastUpdated),
      };
    }

    return null;
  } catch (err) {
    console.error('Error getting stock level:', err);
    return null;
  }
}

/**
 * Get all stock levels
 */
export function getAllStockLevels(): StockLevel[] {
  try {
    const data = localStorage.getItem(STOCK_KEY);
    if (!data) return [];

    const stocks: StockLevel[] = JSON.parse(data);
    return stocks.map((s) => ({
      ...s,
      lastUpdated: new Date(s.lastUpdated),
    }));
  } catch (err) {
    console.error('Error getting all stock levels:', err);
    return [];
  }
}

/**
 * Update stock level
 */
export function updateStockLevel(
  productId: string,
  quantity: number,
  options?: {
    minimumStock?: number;
    maximumStock?: number;
    notes?: string;
    type?: 'in' | 'out' | 'adjustment';
    reason?: string;
    updatedBy?: string;
  }
): StockLevel | null {
  try {
    const stocks = getAllStockLevels();
    const existing = stocks.find((s) => s.productId === productId);

    if (!existing) {
      return null;
    }

    const newQuantity = Math.max(0, existing.currentStock + quantity);

    // Determine status
    let status: StockLevel['status'] = 'in-stock';
    if (newQuantity === 0) {
      status = 'out-of-stock';
    } else if (newQuantity <= existing.minimumStock) {
      status = 'critical';
    } else if (newQuantity <= existing.minimumStock * 1.5) {
      status = 'low-stock';
    }

    const updated: StockLevel = {
      ...existing,
      currentStock: newQuantity,
      minimumStock: options?.minimumStock ?? existing.minimumStock,
      maximumStock: options?.maximumStock ?? existing.maximumStock,
      status,
      notes: options?.notes,
      lastUpdated: new Date(),
    };

    // Update stock
    const idx = stocks.findIndex((s) => s.productId === productId);
    stocks[idx] = updated;
    localStorage.setItem(STOCK_KEY, JSON.stringify(stocks));

    // Record movement
    recordMovement(productId, options?.type ?? 'adjustment', quantity, {
      reason: options?.reason,
      updatedBy: options?.updatedBy,
      notes: options?.notes,
    });

    // Check for alerts
    checkStockAlerts(updated);

    return updated;
  } catch (err) {
    console.error('Error updating stock level:', err);
    return null;
  }
}

/**
 * Initialize stock for product
 */
export function initializeStock(
  productId: string,
  productName: string,
  quantity: number,
  minimumStock: number = 5,
  maximumStock: number = 100
): StockLevel {
  try {
    const stocks = getAllStockLevels();

    // Check if exists
    if (stocks.some((s) => s.productId === productId)) {
      throw new Error('Product stock already exists');
    }

    let status: StockLevel['status'] = 'in-stock';
    if (quantity === 0) {
      status = 'out-of-stock';
    } else if (quantity <= minimumStock) {
      status = 'critical';
    }

    const newStock: StockLevel = {
      productId,
      productName,
      currentStock: quantity,
      minimumStock,
      maximumStock,
      status,
      lastUpdated: new Date(),
    };

    stocks.push(newStock);
    localStorage.setItem(STOCK_KEY, JSON.stringify(stocks));

    // Record initial movement
    recordMovement(productId, 'in', quantity, {
      reason: 'Initial stock',
    });

    return newStock;
  } catch (err) {
    console.error('Error initializing stock:', err);
    throw err;
  }
}

/**
 * Record stock movement
 */
export function recordMovement(
  productId: string,
  type: 'in' | 'out' | 'adjustment',
  quantity: number,
  options?: {
    reason?: string;
    updatedBy?: string;
    notes?: string;
  }
): StockMovement {
  try {
    const movements = getMovementHistory(productId);

    const movement: StockMovement = {
      id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      type,
      quantity,
      reason: options?.reason,
      timestamp: new Date(),
      updatedBy: options?.updatedBy,
      notes: options?.notes,
    };

    movements.push(movement);

    // Keep last 1000 movements per product
    if (movements.length > 1000) {
      movements.shift();
    }

    const allMovements = getAllMovements();
    const filtered = allMovements.filter((m) => m.productId !== productId);
    localStorage.setItem(
      MOVEMENTS_KEY,
      JSON.stringify([...filtered, ...movements])
    );

    return movement;
  } catch (err) {
    console.error('Error recording movement:', err);
    throw err;
  }
}

/**
 * Get movement history for product
 */
export function getMovementHistory(productId: string): StockMovement[] {
  try {
    const data = localStorage.getItem(MOVEMENTS_KEY);
    if (!data) return [];

    const movements: StockMovement[] = JSON.parse(data);
    return movements
      .filter((m) => m.productId === productId)
      .map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
  } catch (err) {
    console.error('Error getting movement history:', err);
    return [];
  }
}

/**
 * Get all movements
 */
export function getAllMovements(): StockMovement[] {
  try {
    const data = localStorage.getItem(MOVEMENTS_KEY);
    if (!data) return [];

    const movements: StockMovement[] = JSON.parse(data);
    return movements.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch (err) {
    console.error('Error getting all movements:', err);
    return [];
  }
}

/**
 * Check and create stock alerts
 */
export function checkStockAlerts(stock: StockLevel): void {
  try {
    const alerts = getAllAlerts();
    const filtered = alerts.filter((a) => a.productId !== stock.productId);

    if (stock.status === 'low-stock') {
      filtered.push({
        productId: stock.productId,
        productName: stock.productName,
        type: 'low-stock',
        currentStock: stock.currentStock,
        threshold: stock.minimumStock,
        createdAt: new Date(),
        acknowledged: false,
      });
    } else if (stock.status === 'out-of-stock') {
      filtered.push({
        productId: stock.productId,
        productName: stock.productName,
        type: 'out-of-stock',
        currentStock: 0,
        threshold: stock.minimumStock,
        createdAt: new Date(),
        acknowledged: false,
      });
    } else if (stock.currentStock > stock.maximumStock) {
      filtered.push({
        productId: stock.productId,
        productName: stock.productName,
        type: 'overstock',
        currentStock: stock.currentStock,
        threshold: stock.maximumStock,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    localStorage.setItem(ALERTS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error checking stock alerts:', err);
  }
}

/**
 * Get all alerts
 */
export function getAllAlerts(): StockAlert[] {
  try {
    const data = localStorage.getItem(ALERTS_KEY);
    if (!data) return [];

    const alerts: StockAlert[] = JSON.parse(data);
    return alerts.map((a) => ({
      ...a,
      createdAt: new Date(a.createdAt),
    }));
  } catch (err) {
    console.error('Error getting alerts:', err);
    return [];
  }
}

/**
 * Acknowledge alert
 */
export function acknowledgeAlert(productId: string, type: StockAlert['type']): boolean {
  try {
    const alerts = getAllAlerts();
    const alert = alerts.find((a) => a.productId === productId && a.type === type);

    if (alert) {
      alert.acknowledged = true;
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error acknowledging alert:', err);
    return false;
  }
}

/**
 * Get low stock products
 */
export function getLowStockProducts(): StockLevel[] {
  return getAllStockLevels().filter((s) => s.status === 'low-stock' || s.status === 'critical');
}

/**
 * Get out of stock products
 */
export function getOutOfStockProducts(): StockLevel[] {
  return getAllStockLevels().filter((s) => s.status === 'out-of-stock');
}

/**
 * Forecast stock levels based on history
 */
export function forecastStock(
  productId: string,
  daysAhead: number = 7
): Array<{
  date: string;
  predictedStock: number;
}> {
  try {
    const movements = getMovementHistory(productId);
    const stock = getStockLevel(productId);

    if (!stock) return [];

    // Simple moving average forecast
    const outMovements = movements
      .filter((m) => m.type === 'out')
      .slice(-30);

    const avgDailyOutflow =
      outMovements.reduce((sum, m) => sum + m.quantity, 0) / 30;

    const forecasts = [];

    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const predictedStock = Math.max(
        0,
        stock.currentStock - avgDailyOutflow * i
      );

      forecasts.push({
        date: date.toLocaleDateString('th-TH'),
        predictedStock: Math.round(predictedStock),
      });
    }

    return forecasts;
  } catch (err) {
    console.error('Error forecasting stock:', err);
    return [];
  }
}
