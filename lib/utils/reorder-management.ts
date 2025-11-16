/**
 * Reorder Management Utility
 *
 * Handles automatic reorder calculations and purchase order generation:
 * - Reorder point calculation
 * - Safety stock calculation
 * - Economic Order Quantity (EOQ)
 * - Purchase order generation
 * - Supplier management
 */

import { DemandHistory } from './inventory-forecasting';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ReorderRule {
  id: string;
  productId: string;
  productName?: string;
  productSKU?: string;
  reorderPoint: number;
  reorderQuantity: number;
  minimumStock: number;
  maximumStock: number;
  leadTime: number;
  supplierId: string;
  supplierName?: string;
  isActive: boolean;
  autoGenerate: boolean;
  lastTriggered?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  supplierId: string;
  supplierName: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  daysUntilStockout: number;
}

export interface SafetyStockParams {
  avgDailyDemand: number;
  demandVariability: number;
  leadTime: number;
  leadTimeVariability?: number;
  serviceLevel?: number;
}

export interface EOQParams {
  annualDemand: number;
  orderingCost: number;
  holdingCost: number;
  unitCost?: number;
}

export interface PurchaseOrderInput {
  supplierId: string;
  warehouseId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
  notes?: string;
  expectedDeliveryDays?: number;
}

export interface PurchaseOrderResult {
  id?: string;
  supplierId: string;
  warehouseId: string;
  items: Array<{
    productId: string;
    productName?: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  totalCost: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDeliveryDate: Date;
  notes?: string;
}

// ============================================================================
// Z-SCORE TABLE FOR SERVICE LEVELS
// ============================================================================

const SERVICE_LEVEL_Z_SCORES: Record<number, number> = {
  0.50: 0.000,
  0.75: 0.674,
  0.80: 0.842,
  0.85: 1.036,
  0.90: 1.282,
  0.95: 1.645,
  0.97: 1.881,
  0.98: 2.054,
  0.99: 2.326,
  0.995: 2.576,
};

/**
 * Get Z-score for a given service level
 */
function getServiceLevelZScore(serviceLevel: number): number {
  // Find closest service level in table
  const levels = Object.keys(SERVICE_LEVEL_Z_SCORES).map(Number).sort((a, b) => a - b);
  const closest = levels.reduce((prev, curr) =>
    Math.abs(curr - serviceLevel) < Math.abs(prev - serviceLevel) ? curr : prev
  );
  return SERVICE_LEVEL_Z_SCORES[closest] || 1.645;
}

// ============================================================================
// SAFETY STOCK CALCULATIONS
// ============================================================================

/**
 * Calculate safety stock to buffer against demand and lead time variability
 *
 * Formula: SS = Z × σ × √(lead time)
 * Where:
 * - Z = service level factor (e.g., 1.645 for 95%)
 * - σ = standard deviation of demand
 * - lead time = supplier lead time in days
 */
export function calculateSafetyStock(params: SafetyStockParams): number {
  const {
    avgDailyDemand,
    demandVariability,
    leadTime,
    leadTimeVariability = 0,
    serviceLevel = 0.95,
  } = params;

  const zScore = getServiceLevelZScore(serviceLevel);

  // If we have lead time variability, use more complex formula
  if (leadTimeVariability > 0) {
    // SS = Z × √(LT × σD² + D² × σLT²)
    const demandVariance = Math.pow(demandVariability, 2);
    const leadTimeVariance = Math.pow(leadTimeVariability, 2);
    const variance =
      leadTime * demandVariance + Math.pow(avgDailyDemand, 2) * leadTimeVariance;
    return Math.ceil(zScore * Math.sqrt(variance));
  }

  // Simpler formula when lead time is constant
  // SS = Z × σD × √LT
  return Math.ceil(zScore * demandVariability * Math.sqrt(leadTime));
}

/**
 * Calculate demand variability from historical data
 */
export function calculateDemandVariability(history: DemandHistory[]): number {
  if (history.length < 2) return 0;

  const quantities = history.map(h => h.quantity);
  const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
  const variance =
    quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length;

  return Math.sqrt(variance);
}

/**
 * Calculate average daily demand from historical data
 */
export function calculateAvgDailyDemand(history: DemandHistory[]): number {
  if (history.length === 0) return 0;

  const totalDemand = history.reduce((sum, h) => sum + h.quantity, 0);
  return totalDemand / history.length;
}

// ============================================================================
// REORDER POINT CALCULATIONS
// ============================================================================

/**
 * Calculate optimal reorder point
 *
 * Formula: ROP = (Average Daily Demand × Lead Time) + Safety Stock
 */
export function calculateReorderPoint(
  avgDailyDemand: number,
  leadTime: number,
  safetyStock: number
): number {
  return Math.ceil(avgDailyDemand * leadTime + safetyStock);
}

/**
 * Calculate reorder point from historical demand data
 */
export function calculateReorderPointFromHistory(
  history: DemandHistory[],
  leadTime: number,
  serviceLevel: number = 0.95
): number {
  const avgDailyDemand = calculateAvgDailyDemand(history);
  const demandVariability = calculateDemandVariability(history);

  const safetyStock = calculateSafetyStock({
    avgDailyDemand,
    demandVariability,
    leadTime,
    serviceLevel,
  });

  return calculateReorderPoint(avgDailyDemand, leadTime, safetyStock);
}

// ============================================================================
// ECONOMIC ORDER QUANTITY (EOQ)
// ============================================================================

/**
 * Calculate Economic Order Quantity
 *
 * Formula: EOQ = √(2 × D × S / H)
 * Where:
 * - D = Annual demand
 * - S = Ordering cost per order
 * - H = Holding cost per unit per year
 */
export function calculateEOQ(params: EOQParams): number {
  const { annualDemand, orderingCost, holdingCost } = params;

  if (annualDemand <= 0 || orderingCost <= 0 || holdingCost <= 0) {
    return 0;
  }

  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
  return Math.ceil(eoq);
}

/**
 * Calculate EOQ with quantity discounts
 */
export function calculateEOQWithDiscounts(
  params: EOQParams,
  discounts: Array<{ minQuantity: number; unitCost: number }>
): { quantity: number; totalCost: number; unitCost: number } {
  const baseEOQ = calculateEOQ(params);

  // Sort discounts by quantity
  const sortedDiscounts = [...discounts].sort((a, b) => a.minQuantity - b.minQuantity);

  let bestOption = {
    quantity: baseEOQ,
    totalCost: Infinity,
    unitCost: params.unitCost || 0,
  };

  // Test base EOQ
  const baseUnitCost = params.unitCost || 0;
  const baseTotalCost =
    params.annualDemand * baseUnitCost +
    (params.annualDemand / baseEOQ) * params.orderingCost +
    (baseEOQ / 2) * params.holdingCost;

  if (baseTotalCost < bestOption.totalCost) {
    bestOption = {
      quantity: baseEOQ,
      totalCost: baseTotalCost,
      unitCost: baseUnitCost,
    };
  }

  // Test each discount tier
  for (const discount of sortedDiscounts) {
    const quantity = Math.max(discount.minQuantity, baseEOQ);
    const totalCost =
      params.annualDemand * discount.unitCost +
      (params.annualDemand / quantity) * params.orderingCost +
      (quantity / 2) * params.holdingCost;

    if (totalCost < bestOption.totalCost) {
      bestOption = {
        quantity,
        totalCost,
        unitCost: discount.unitCost,
      };
    }
  }

  return bestOption;
}

/**
 * Calculate annual holding cost percentage
 * Typically 20-30% of unit cost
 */
export function estimateHoldingCost(
  unitCost: number,
  holdingCostPercent: number = 0.25
): number {
  return unitCost * holdingCostPercent;
}

// ============================================================================
// REORDER QUANTITY CALCULATIONS
// ============================================================================

/**
 * Calculate optimal reorder quantity considering EOQ and constraints
 */
export function calculateReorderQuantity(
  avgDailyDemand: number,
  leadTime: number,
  currentStock: number,
  reorderPoint: number,
  maxStock: number,
  eoq?: number
): number {
  // Calculate quantity needed to reach max stock
  const quantityToMax = Math.max(0, maxStock - currentStock);

  // If EOQ provided, use it unless it exceeds max stock
  if (eoq && eoq > 0) {
    return Math.min(eoq, quantityToMax);
  }

  // Otherwise, order enough to reach max stock
  return quantityToMax;
}

/**
 * Calculate maximum stock level
 * Formula: Max Stock = (Average Daily Demand × Lead Time × 2) + Safety Stock
 */
export function calculateMaxStock(
  avgDailyDemand: number,
  leadTime: number,
  safetyStock: number,
  multiplier: number = 2
): number {
  return Math.ceil(avgDailyDemand * leadTime * multiplier + safetyStock);
}

// ============================================================================
// DAYS UNTIL STOCKOUT
// ============================================================================

/**
 * Calculate estimated days until stockout
 */
export function calculateDaysUntilStockout(
  currentStock: number,
  avgDailyDemand: number
): number {
  if (avgDailyDemand <= 0) return Infinity;
  if (currentStock <= 0) return 0;

  return Math.floor(currentStock / avgDailyDemand);
}

// ============================================================================
// REORDER SUGGESTIONS
// ============================================================================

/**
 * Generate reorder suggestions based on current stock levels
 */
export function generateReorderSuggestions(
  products: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    reorderQuantity: number;
    supplierId: string;
    supplierName: string;
    unitCost: number;
    avgDailyDemand: number;
  }>
): ReorderSuggestion[] {
  const suggestions: ReorderSuggestion[] = [];

  for (const product of products) {
    // Only suggest if stock is at or below reorder point
    if (product.currentStock <= product.reorderPoint) {
      const daysUntilStockout = calculateDaysUntilStockout(
        product.currentStock,
        product.avgDailyDemand
      );

      let priority: 'high' | 'medium' | 'low' = 'low';
      if (daysUntilStockout <= 3) priority = 'high';
      else if (daysUntilStockout <= 7) priority = 'medium';

      suggestions.push({
        productId: product.productId,
        productName: product.productName,
        currentStock: product.currentStock,
        reorderPoint: product.reorderPoint,
        suggestedQuantity: product.reorderQuantity,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        estimatedCost: product.reorderQuantity * product.unitCost,
        priority,
        daysUntilStockout,
      });
    }
  }

  // Sort by priority and days until stockout
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.daysUntilStockout - b.daysUntilStockout;
  });

  return suggestions;
}

// ============================================================================
// PURCHASE ORDER GENERATION
// ============================================================================

/**
 * Generate a purchase order
 */
export function generatePurchaseOrder(input: PurchaseOrderInput): PurchaseOrderResult {
  const {
    supplierId,
    warehouseId,
    items,
    notes,
    expectedDeliveryDays = 7,
  } = input;

  // Calculate total cost
  let totalCost = 0;
  const enrichedItems = items.map(item => {
    const itemTotal = item.quantity * item.unitCost;
    totalCost += itemTotal;

    return {
      ...item,
      totalCost: itemTotal,
    };
  });

  // Calculate expected delivery date
  const orderDate = new Date();
  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + expectedDeliveryDays);

  return {
    supplierId,
    warehouseId,
    items: enrichedItems,
    totalCost,
    status: 'draft',
    orderDate,
    expectedDeliveryDate,
    notes,
  };
}

/**
 * Consolidate multiple reorder suggestions into optimized purchase orders
 */
export function consolidatePurchaseOrders(
  suggestions: ReorderSuggestion[],
  productCosts: Record<string, number>,
  supplierMinimums: Record<string, { minValue: number; minQuantity: number }> = {}
): PurchaseOrderInput[] {
  // Group by supplier
  const bySupplier = new Map<string, ReorderSuggestion[]>();

  for (const suggestion of suggestions) {
    const existing = bySupplier.get(suggestion.supplierId) || [];
    existing.push(suggestion);
    bySupplier.set(suggestion.supplierId, existing);
  }

  const purchaseOrders: PurchaseOrderInput[] = [];

  // Create PO for each supplier
  for (const [supplierId, items] of bySupplier) {
    const poItems = items.map(item => ({
      productId: item.productId,
      quantity: item.suggestedQuantity,
      unitCost: productCosts[item.productId] || 0,
    }));

    // Check if meets minimum requirements
    const minimum = supplierMinimums[supplierId];
    const totalValue = poItems.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );
    const totalQuantity = poItems.reduce((sum, item) => sum + item.quantity, 0);

    // Skip if doesn't meet minimums (in real app, might want to adjust quantities)
    if (minimum) {
      if (
        totalValue < minimum.minValue ||
        totalQuantity < minimum.minQuantity
      ) {
        continue;
      }
    }

    purchaseOrders.push({
      supplierId,
      warehouseId: '', // Would need to be specified
      items: poItems,
      notes: `Auto-generated from ${items.length} reorder suggestion(s)`,
    });
  }

  return purchaseOrders;
}

// ============================================================================
// REORDER RULE VALIDATION
// ============================================================================

/**
 * Validate reorder rule parameters
 */
export function validateReorderRule(rule: Partial<ReorderRule>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!rule.productId) {
    errors.push('Product ID is required');
  }

  if (!rule.supplierId) {
    errors.push('Supplier ID is required');
  }

  if (rule.reorderPoint !== undefined && rule.reorderPoint < 0) {
    errors.push('Reorder point must be non-negative');
  }

  if (rule.reorderQuantity !== undefined && rule.reorderQuantity <= 0) {
    errors.push('Reorder quantity must be positive');
  }

  if (rule.minimumStock !== undefined && rule.minimumStock < 0) {
    errors.push('Minimum stock must be non-negative');
  }

  if (rule.maximumStock !== undefined && rule.maximumStock < 0) {
    errors.push('Maximum stock must be non-negative');
  }

  if (
    rule.minimumStock !== undefined &&
    rule.maximumStock !== undefined &&
    rule.minimumStock > rule.maximumStock
  ) {
    errors.push('Minimum stock cannot exceed maximum stock');
  }

  if (
    rule.reorderPoint !== undefined &&
    rule.maximumStock !== undefined &&
    rule.reorderPoint > rule.maximumStock
  ) {
    errors.push('Reorder point cannot exceed maximum stock');
  }

  if (rule.leadTime !== undefined && rule.leadTime < 0) {
    errors.push('Lead time must be non-negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// REORDER METRICS
// ============================================================================

/**
 * Calculate inventory turnover ratio
 * Higher is better - indicates how many times inventory is sold/used per period
 */
export function calculateInventoryTurnover(
  costOfGoodsSold: number,
  averageInventoryValue: number
): number {
  if (averageInventoryValue === 0) return 0;
  return costOfGoodsSold / averageInventoryValue;
}

/**
 * Calculate days of inventory on hand
 * Lower is better - indicates how many days current inventory will last
 */
export function calculateDaysInventoryOnHand(
  averageInventory: number,
  avgDailyDemand: number
): number {
  if (avgDailyDemand === 0) return Infinity;
  return averageInventory / avgDailyDemand;
}

/**
 * Calculate fill rate (service level achieved)
 * Percentage of demand met from stock
 */
export function calculateFillRate(
  demandMet: number,
  totalDemand: number
): number {
  if (totalDemand === 0) return 1;
  return demandMet / totalDemand;
}

/**
 * Calculate stockout frequency
 * Number of stockout occurrences in a period
 */
export function calculateStockoutFrequency(
  stockoutDays: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0;
  return stockoutDays / totalDays;
}

// ============================================================================
// SUPPLIER PERFORMANCE
// ============================================================================

export interface SupplierPerformance {
  supplierId: string;
  onTimeDeliveryRate: number;
  averageLeadTime: number;
  qualityScore: number;
  costScore: number;
  overallScore: number;
}

/**
 * Calculate supplier performance metrics
 */
export function calculateSupplierPerformance(
  supplierId: string,
  deliveries: Array<{
    expectedDate: Date;
    actualDate: Date;
    qualityRating?: number;
    cost: number;
  }>,
  benchmarkCost: number
): SupplierPerformance {
  if (deliveries.length === 0) {
    return {
      supplierId,
      onTimeDeliveryRate: 0,
      averageLeadTime: 0,
      qualityScore: 0,
      costScore: 0,
      overallScore: 0,
    };
  }

  // Calculate on-time delivery rate
  const onTimeCount = deliveries.filter(
    d => d.actualDate <= d.expectedDate
  ).length;
  const onTimeDeliveryRate = onTimeCount / deliveries.length;

  // Calculate average lead time
  const leadTimes = deliveries.map(d => {
    const diff = d.actualDate.getTime() - d.expectedDate.getTime();
    return Math.max(0, diff / (1000 * 60 * 60 * 24)); // Days late
  });
  const averageLeadTime = leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length;

  // Calculate quality score (average of ratings)
  const qualityRatings = deliveries
    .filter(d => d.qualityRating !== undefined)
    .map(d => d.qualityRating!);
  const qualityScore =
    qualityRatings.length > 0
      ? qualityRatings.reduce((sum, r) => sum + r, 0) / qualityRatings.length / 5
      : 0.5;

  // Calculate cost score (lower cost is better)
  const avgCost = deliveries.reduce((sum, d) => sum + d.cost, 0) / deliveries.length;
  const costScore = benchmarkCost > 0 ? Math.min(1, benchmarkCost / avgCost) : 0.5;

  // Overall score (weighted average)
  const overallScore =
    onTimeDeliveryRate * 0.4 +
    (1 - Math.min(1, averageLeadTime / 7)) * 0.3 +
    qualityScore * 0.2 +
    costScore * 0.1;

  return {
    supplierId,
    onTimeDeliveryRate,
    averageLeadTime,
    qualityScore,
    costScore,
    overallScore,
  };
}
