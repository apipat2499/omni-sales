/**
 * Tax calculation utilities
 */

import type { OrderItem } from '@/types';

export type TaxType = 'vat' | 'gst' | 'sales-tax' | 'flat-fee' | 'percentage' | 'custom';

/**
 * Tax configuration
 */
export interface TaxConfig {
  id: string;
  name: string;
  type: TaxType;
  rate: number; // Percentage for most types, or flat amount for flat-fee
  isInclusive: boolean; // Whether tax is included in the price
  applicableItems?: string[]; // Product IDs that this tax applies to, empty = all
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxBreakdown: {
    taxId: string;
    taxName: string;
    rate: number;
    amount: number;
  }[];
  isInclusive: boolean;
}

/**
 * Tax record for history
 */
export interface TaxRecord {
  id: string;
  date: Date;
  items: OrderItem[];
  taxConfigs: TaxConfig[];
  calculation: TaxCalculation;
  notes?: string;
}

/**
 * Get all tax configurations
 */
export function getAllTaxConfigs(): TaxConfig[] {
  try {
    const stored = localStorage.getItem('tax_configs');
    if (!stored) return [];

    const configs = JSON.parse(stored) as TaxConfig[];
    return configs.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Get active tax configurations
 */
export function getActiveTaxConfigs(): TaxConfig[] {
  return getAllTaxConfigs().filter((c) => c.isActive);
}

/**
 * Get tax config by ID
 */
export function getTaxConfigById(id: string): TaxConfig | null {
  const configs = getAllTaxConfigs();
  return configs.find((c) => c.id === id) || null;
}

/**
 * Create new tax configuration
 */
export function createTaxConfig(
  taxConfig: Omit<TaxConfig, 'id' | 'createdAt' | 'updatedAt'>
): TaxConfig {
  const id = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  return {
    ...taxConfig,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Save tax configuration
 */
export function saveTaxConfig(config: TaxConfig): void {
  const configs = getAllTaxConfigs();
  const index = configs.findIndex((c) => c.id === config.id);

  if (index >= 0) {
    configs[index] = config;
  } else {
    configs.push(config);
  }

  // Limit to 50 configs
  if (configs.length > 50) {
    configs.shift();
  }

  localStorage.setItem('tax_configs', JSON.stringify(configs));
}

/**
 * Update tax configuration
 */
export function updateTaxConfig(
  id: string,
  updates: Partial<Omit<TaxConfig, 'id' | 'createdAt'>>
): TaxConfig | null {
  const config = getTaxConfigById(id);
  if (!config) return null;

  const updated: TaxConfig = {
    ...config,
    ...updates,
    updatedAt: new Date(),
  };

  saveTaxConfig(updated);
  return updated;
}

/**
 * Delete tax configuration
 */
export function deleteTaxConfig(id: string): boolean {
  const configs = getAllTaxConfigs();
  const filtered = configs.filter((c) => c.id !== id);

  if (filtered.length === configs.length) {
    return false;
  }

  localStorage.setItem('tax_configs', JSON.stringify(filtered));
  return true;
}

/**
 * Calculate taxes for order items
 */
export function calculateTax(
  items: OrderItem[],
  taxConfigs?: TaxConfig[],
  isInclusive: boolean = false
): TaxCalculation {
  const configs = taxConfigs || getActiveTaxConfigs();

  if (configs.length === 0) {
    const subtotal = calculateItemsSubtotal(items);
    return {
      subtotal,
      taxAmount: 0,
      total: subtotal,
      taxBreakdown: [],
      isInclusive,
    };
  }

  // Calculate subtotal (before tax)
  const subtotal = calculateItemsSubtotal(items);

  // Calculate tax breakdown
  const taxBreakdown: TaxCalculation['taxBreakdown'] = [];
  let totalTax = 0;

  configs.forEach((config) => {
    if (!config.isActive) return;

    // Check if tax applies to these items
    const applicableItems =
      !config.applicableItems || config.applicableItems.length === 0
        ? items
        : items.filter((item) => config.applicableItems?.includes(item.productId));

    if (applicableItems.length === 0) return;

    const applicableSubtotal = calculateItemsSubtotal(applicableItems);
    let taxAmount = 0;

    if (config.type === 'flat-fee') {
      taxAmount = config.rate;
    } else if (config.type === 'percentage' || config.type === 'vat' || config.type === 'gst' || config.type === 'sales-tax') {
      const baseAmount = isInclusive
        ? applicableSubtotal / (1 + config.rate / 100)
        : applicableSubtotal;
      taxAmount = (baseAmount * config.rate) / 100;
    } else if (config.type === 'custom') {
      // Custom tax types would be handled by the application
      taxAmount = (applicableSubtotal * config.rate) / 100;
    }

    taxBreakdown.push({
      taxId: config.id,
      taxName: config.name,
      rate: config.rate,
      amount: Math.round(taxAmount * 100) / 100,
    });

    totalTax += taxAmount;
  });

  // Round total tax
  totalTax = Math.round(totalTax * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: totalTax,
    total: Math.round((subtotal + totalTax) * 100) / 100,
    taxBreakdown,
    isInclusive,
  };
}

/**
 * Calculate subtotal from items (excluding items' discounts)
 */
export function calculateItemsSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.price - (item.discount || 0);
    return sum + Math.max(0, itemTotal);
  }, 0);
}

/**
 * Calculate total from items including discounts
 */
export function calculateItemsTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.price - (item.discount || 0);
    return sum + itemTotal;
  }, 0);
}

/**
 * Calculate tax percentage for an item
 */
export function calculateItemTax(
  item: OrderItem,
  taxConfigs?: TaxConfig[],
  isInclusive: boolean = false
): number {
  const result = calculateTax([item], taxConfigs, isInclusive);
  return result.taxAmount;
}

/**
 * Apply tax to an item's price
 */
export function applyTaxToItem(
  item: OrderItem,
  taxRate: number,
  isInclusive: boolean = false
): OrderItem {
  const itemSubtotal = item.quantity * item.price - (item.discount || 0);

  if (isInclusive) {
    // Tax is already included in price, so extract it
    const baseAmount = itemSubtotal / (1 + taxRate / 100);
    const itemTax = itemSubtotal - baseAmount;
    return {
      ...item,
      // Price remains the same, but note tax is included
    };
  } else {
    // Tax is not included, add to total
    return {
      ...item,
      // Item remains the same, tax will be calculated separately
    };
  }
}

/**
 * Get tax exemption status for an item
 */
export function isItemTaxExempt(item: OrderItem, exemptProductIds?: string[]): boolean {
  if (!exemptProductIds) return false;
  return exemptProductIds.includes(item.productId);
}

/**
 * Record tax calculation for audit trail
 */
export function recordTaxCalculation(
  items: OrderItem[],
  taxConfigs: TaxConfig[],
  notes?: string
): TaxRecord {
  const id = `tax_record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const calculation = calculateTax(items, taxConfigs);

  const record: TaxRecord = {
    id,
    date: new Date(),
    items,
    taxConfigs,
    calculation,
    notes,
  };

  // Store in localStorage
  try {
    const records = getTaxHistory();
    records.push(record);

    // Keep last 1000 records
    if (records.length > 1000) {
      records.shift();
    }

    localStorage.setItem(
      'tax_records',
      JSON.stringify(records.map((r) => ({ ...r, date: r.date.toISOString() })))
    );
  } catch {
    // Ignore storage errors
  }

  return record;
}

/**
 * Get tax calculation history
 */
export function getTaxHistory(limit: number = 100): TaxRecord[] {
  try {
    const stored = localStorage.getItem('tax_records');
    if (!stored) return [];

    const records = JSON.parse(stored) as any[];
    return records
      .map((r) => ({
        ...r,
        date: new Date(r.date),
      }))
      .slice(-limit)
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Get tax statistics
 */
export function getTaxStatistics(
  records?: TaxRecord[]
): {
  totalTaxCollected: number;
  averageTaxRate: number;
  transactionCount: number;
  taxTypeBreakdown: Record<string, number>;
} {
  const history = records || getTaxHistory(1000);

  const totalTaxCollected = history.reduce((sum, record) => sum + record.calculation.taxAmount, 0);
  const transactionCount = history.length;
  const averageTaxRate = transactionCount > 0 ? totalTaxCollected / transactionCount : 0;

  const taxTypeBreakdown: Record<string, number> = {};
  history.forEach((record) => {
    record.calculation.taxBreakdown.forEach((tax) => {
      taxTypeBreakdown[tax.taxName] = (taxTypeBreakdown[tax.taxName] || 0) + tax.amount;
    });
  });

  return {
    totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
    averageTaxRate: Math.round(averageTaxRate * 100) / 100,
    transactionCount,
    taxTypeBreakdown,
  };
}

/**
 * Export tax report for period
 */
export function exportTaxReport(startDate: Date, endDate: Date): {
  period: { start: string; end: string };
  statistics: ReturnType<typeof getTaxStatistics>;
  records: TaxRecord[];
} {
  const allRecords = getTaxHistory(10000);
  const filteredRecords = allRecords.filter((r) => r.date >= startDate && r.date <= endDate);

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    statistics: getTaxStatistics(filteredRecords),
    records: filteredRecords,
  };
}

/**
 * Get default tax configurations for different countries/regions
 */
export function getDefaultTaxConfigs(region: 'thailand' | 'us' | 'eu' | 'custom' = 'custom'): TaxConfig[] {
  switch (region) {
    case 'thailand':
      return [
        createTaxConfig({
          name: 'VAT',
          type: 'vat',
          rate: 7,
          isInclusive: true,
          description: 'Thailand Value Added Tax (7%)',
          isActive: true,
        }),
      ];

    case 'us':
      return [
        createTaxConfig({
          name: 'Sales Tax',
          type: 'sales-tax',
          rate: 5, // Varies by state
          isInclusive: false,
          description: 'US Sales Tax (varies by state)',
          isActive: true,
        }),
      ];

    case 'eu':
      return [
        createTaxConfig({
          name: 'VAT',
          type: 'vat',
          rate: 21, // Varies by country
          isInclusive: true,
          description: 'EU VAT (varies by country)',
          isActive: true,
        }),
      ];

    default:
      return [];
  }
}

/**
 * Validate tax configuration
 */
export function validateTaxConfig(config: Partial<TaxConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name || config.name.trim() === '') {
    errors.push('Tax name is required');
  }

  if (!config.type) {
    errors.push('Tax type is required');
  }

  if (config.rate === undefined || config.rate < 0) {
    errors.push('Tax rate must be non-negative');
  }

  if (config.type === 'percentage' && config.rate && config.rate > 100) {
    errors.push('Percentage tax rate cannot exceed 100%');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Duplicate tax configuration
 */
export function duplicateTaxConfig(id: string, newName?: string): TaxConfig | null {
  const config = getTaxConfigById(id);
  if (!config) return null;

  const duplicated = createTaxConfig({
    ...config,
    name: newName || `${config.name} (copy)`,
  });

  saveTaxConfig(duplicated);
  return duplicated;
}
