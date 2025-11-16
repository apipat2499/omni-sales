/**
 * Price history tracking utilities
 */

export interface PriceRecord {
  price: number;
  quantity: number;
  timestamp: Date;
  discountPercent?: number;
  notes?: string;
  action?: 'created' | 'updated' | 'discounted';
}

export interface PriceStats {
  currentPrice: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  totalQuantity: number;
  priceChangePercent: number;
  lastChangeTime: Date | null;
}

/**
 * Track price history in memory
 */
class PriceHistoryTracker {
  private history: Map<string, PriceRecord[]> = new Map();

  /**
   * Record a price change
   */
  recordPrice(
    itemId: string,
    price: number,
    quantity: number,
    options?: {
      discountPercent?: number;
      notes?: string;
      action?: 'created' | 'updated' | 'discounted';
    }
  ): void {
    const record: PriceRecord = {
      price,
      quantity,
      timestamp: new Date(),
      discountPercent: options?.discountPercent,
      notes: options?.notes,
      action: options?.action,
    };

    if (!this.history.has(itemId)) {
      this.history.set(itemId, []);
    }

    this.history.get(itemId)!.push(record);
  }

  /**
   * Get price history for an item
   */
  getHistory(itemId: string): PriceRecord[] {
    return (this.history.get(itemId) || []).slice();
  }

  /**
   * Get price statistics
   */
  getStats(itemId: string): PriceStats {
    const records = this.history.get(itemId) || [];

    if (records.length === 0) {
      return {
        currentPrice: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        totalQuantity: 0,
        priceChangePercent: 0,
        lastChangeTime: null,
      };
    }

    const prices = records.map((r) => r.price);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const averagePrice = prices.reduce((a, b) => a + b) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
    const priceChangePercent =
      firstPrice !== 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

    return {
      currentPrice,
      averagePrice,
      minPrice,
      maxPrice,
      totalQuantity,
      priceChangePercent,
      lastChangeTime: records[records.length - 1].timestamp,
    };
  }

  /**
   * Clear history for item
   */
  clearHistory(itemId: string): void {
    this.history.delete(itemId);
  }

  /**
   * Clear all history
   */
  clearAll(): void {
    this.history.clear();
  }
}

/**
 * Global price history tracker instance
 */
export const priceHistoryTracker = new PriceHistoryTracker();

/**
 * LocalStorage-based persistent price history
 */
export class PersistentPriceHistory {
  private prefix = 'price_history_';

  /**
   * Save price history to localStorage
   */
  save(itemId: string, history: PriceRecord[]): void {
    try {
      const key = this.prefix + itemId;
      const serialized = history.map((record) => ({
        ...record,
        timestamp: record.timestamp.toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify(serialized));
    } catch (err) {
      console.error('Error saving price history:', err);
    }
  }

  /**
   * Load price history from localStorage
   */
  load(itemId: string): PriceRecord[] {
    try {
      const key = this.prefix + itemId;
      const data = localStorage.getItem(key);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return parsed.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      }));
    } catch (err) {
      console.error('Error loading price history:', err);
      return [];
    }
  }

  /**
   * Delete history for item
   */
  delete(itemId: string): void {
    try {
      const key = this.prefix + itemId;
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Error deleting price history:', err);
    }
  }

  /**
   * Clear all price histories
   */
  clear(): void {
    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      console.error('Error clearing price history:', err);
    }
  }
}

export const persistentPriceHistory = new PersistentPriceHistory();

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `฿${price.toFixed(2)}`;
}

/**
 * Calculate price trend
 * Returns: "up" | "down" | "stable"
 */
export function calculatePriceTrend(records: PriceRecord[]): 'up' | 'down' | 'stable' {
  if (records.length < 2) return 'stable';

  const oldPrice = records[0].price;
  const newPrice = records[records.length - 1].price;

  const threshold = oldPrice * 0.02; // 2% threshold

  if (newPrice > oldPrice + threshold) return 'up';
  if (newPrice < oldPrice - threshold) return 'down';
  return 'stable';
}

/**
 * Get price change summary
 */
export function getPriceSummary(itemId: string): {
  current: number;
  previous: number | null;
  trend: 'up' | 'down' | 'stable';
  changeAmount: number;
  changePercent: number;
  lastChangeTime: Date | null;
} {
  const tracker = priceHistoryTracker;
  const history = tracker.getHistory(itemId);

  if (history.length === 0) {
    return {
      current: 0,
      previous: null,
      trend: 'stable',
      changeAmount: 0,
      changePercent: 0,
      lastChangeTime: null,
    };
  }

  const current = history[history.length - 1].price;
  const previous = history.length > 1 ? history[history.length - 2].price : null;

  const changeAmount = previous ? current - previous : 0;
  const changePercent = previous ? (changeAmount / previous) * 100 : 0;
  const trend = calculatePriceTrend(history);

  return {
    current,
    previous,
    trend,
    changeAmount,
    changePercent,
    lastChangeTime: history[history.length - 1].timestamp,
  };
}

/**
 * Get price history for time range
 */
export function getPriceHistoryInRange(
  itemId: string,
  startDate: Date,
  endDate: Date
): PriceRecord[] {
  const tracker = priceHistoryTracker;
  const history = tracker.getHistory(itemId);

  return history.filter(
    (record) => record.timestamp >= startDate && record.timestamp <= endDate
  );
}

/**
 * Calculate price volatility (standard deviation)
 */
export function calculatePriceVolatility(itemId: string): number {
  const tracker = priceHistoryTracker;
  const history = tracker.getHistory(itemId);

  if (history.length < 2) return 0;

  const prices = history.map((r) => r.price);
  const mean = prices.reduce((a, b) => a + b) / prices.length;
  const variance =
    prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
    prices.length;

  return Math.sqrt(variance);
}

/**
 * Get average price for period
 */
export function getAveragePriceForPeriod(
  itemId: string,
  days: number = 30
): number {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const records = getPriceHistoryInRange(itemId, startDate, now);
  if (records.length === 0) return 0;

  const sum = records.reduce((total, record) => total + record.price, 0);
  return sum / records.length;
}

/**
 * Export price history as CSV
 */
export function exportPriceHistoryToCSV(
  itemId: string,
  itemName: string
): string {
  const tracker = priceHistoryTracker;
  const history = tracker.getHistory(itemId);

  let csv = 'Date,Time,Price,Quantity,Action,Notes\n';

  history.forEach((record) => {
    const date = record.timestamp.toLocaleDateString('th-TH');
    const time = record.timestamp.toLocaleTimeString('th-TH');
    const price = record.price.toFixed(2);
    const action = record.action || '';
    const notes = record.notes?.replace(/,/g, ';') || '';

    csv += `"${date}","${time}","${price}","${record.quantity}","${action}","${notes}"\n`;
  });

  return csv;
}

/**
 * Generate price history report
 */
export function generatePriceReport(itemId: string, itemName: string): string {
  const tracker = priceHistoryTracker;
  const stats = tracker.getStats(itemId);
  const summary = getPriceSummary(itemId);
  const volatility = calculatePriceVolatility(itemId);

  return `
PRICE HISTORY REPORT
Item: ${itemName}
Date: ${new Date().toLocaleDateString('th-TH')}

SUMMARY
-------
Current Price:      ${formatPrice(stats.currentPrice)}
Previous Price:     ${summary.previous ? formatPrice(summary.previous) : 'N/A'}
Price Change:       ${summary.trend === 'up' ? '↑' : summary.trend === 'down' ? '↓' : '→'} ${formatPrice(summary.changeAmount)} (${summary.changePercent.toFixed(2)}%)

STATISTICS
----------
Average Price:      ${formatPrice(stats.averagePrice)}
Minimum Price:      ${formatPrice(stats.minPrice)}
Maximum Price:      ${formatPrice(stats.maxPrice)}
Price Range:        ${formatPrice(stats.maxPrice - stats.minPrice)}
Volatility (σ):     ${volatility.toFixed(2)}
Total Quantity:     ${stats.totalQuantity} units
Last Change:        ${stats.lastChangeTime ? stats.lastChangeTime.toLocaleString('th-TH') : 'N/A'}

TREND
-----
Trend: ${summary.trend.toUpperCase()}
${summary.trend === 'up' ? 'Prices are increasing' : summary.trend === 'down' ? 'Prices are decreasing' : 'Prices are stable'}
  `;
}
