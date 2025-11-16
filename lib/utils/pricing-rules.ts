/**
 * Advanced Pricing Rules Engine
 * Supports volume discounts, seasonal pricing, customer tiers, promotional rules, and dynamic pricing
 */

import type { OrderItem, Customer } from '@/types';

// ============================================================================
// Type Definitions
// ============================================================================

export type RuleType =
  | 'volume_discount'
  | 'customer_tier'
  | 'seasonal'
  | 'category_discount'
  | 'promotional'
  | 'time_limited'
  | 'bogo'
  | 'bundle'
  | 'loyalty_multiplier'
  | 'first_purchase'
  | 'referral';

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'not_contains';

export type LogicalOperator = 'and' | 'or';

export type ActionType =
  | 'percentage_discount'
  | 'fixed_discount'
  | 'fixed_price'
  | 'free_shipping'
  | 'bonus_points'
  | 'free_item';

export interface RuleCondition {
  id?: string;
  field: string; // 'quantity', 'customerTier', 'date', 'product', 'category', 'orderTotal', 'dayOfWeek'
  operator: RuleOperator;
  value: any;
  logicalOperator?: LogicalOperator; // Between conditions
}

export interface RuleAction {
  id?: string;
  type: ActionType;
  value: number;
  maxDiscount?: number; // Cap the discount amount
  applyTo?: 'item' | 'order' | 'shipping'; // What to apply the action to
  freeItemId?: string; // For free_item action type
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;

  conditions: RuleCondition[];
  actions: RuleAction[];

  priority: number; // Lower = higher priority (1 is highest)
  isActive: boolean;
  isStackable: boolean; // Can combine with other rules

  startDate: Date;
  endDate?: Date;

  maxUsages?: number;
  usageCount: number;
  maxUsagesPerCustomer?: number;

  applicableProducts?: string[]; // Product IDs
  applicableCategories?: string[]; // Categories
  excludedProducts?: string[]; // Excluded product IDs

  minOrderValue?: number;
  maxOrderValue?: number;

  applicableCustomerTiers?: string[];
  applicableCustomers?: string[]; // Specific customer IDs

  createdAt: Date;
  updatedAt: Date;

  // A/B testing
  abTestGroup?: 'A' | 'B' | 'control';
  abTestPercentage?: number;

  // Metadata
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface PriceCalculation {
  basePrice: number;
  quantity: number;
  subtotal: number;
  discounts: {
    ruleId: string;
    ruleName: string;
    type: ActionType;
    amount: number;
    percentage?: number;
  }[];
  loyaltyPoints: number;
  shippingDiscount: number;
  finalPrice: number;
  finalPricePerUnit: number;
  totalSavings: number;
  breakdown: string; // Human readable explanation
  appliedRules: PricingRule[];
}

export interface PriceHistory {
  id: string;
  productId: string;
  customerId?: string;
  calculation: PriceCalculation;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// Storage & Retrieval
// ============================================================================

const STORAGE_KEY = 'pricing_rules';
const HISTORY_KEY = 'price_history';
const USAGE_KEY = 'rule_usage';
const CACHE_KEY = 'pricing_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all pricing rules
 */
export function getAllRules(): PricingRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultRules();

    const rules = JSON.parse(stored) as PricingRule[];
    return rules.map(deserializeRule);
  } catch {
    return getDefaultRules();
  }
}

/**
 * Get active pricing rules
 */
export function getActiveRules(): PricingRule[] {
  const now = new Date();
  return getAllRules().filter((rule) => {
    if (!rule.isActive) return false;
    if (rule.startDate > now) return false;
    if (rule.endDate && rule.endDate < now) return false;
    if (rule.maxUsages && rule.usageCount >= rule.maxUsages) return false;
    return true;
  });
}

/**
 * Get rule by ID
 */
export function getRuleById(id: string): PricingRule | null {
  const rules = getAllRules();
  return rules.find((r) => r.id === id) || null;
}

/**
 * Create new pricing rule
 */
export function createRule(
  rule: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): PricingRule {
  const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const newRule: PricingRule = {
    ...rule,
    id,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  saveRule(newRule);
  clearPricingCache();
  return newRule;
}

/**
 * Save pricing rule
 */
export function saveRule(rule: PricingRule): void {
  const rules = getAllRules();
  const index = rules.findIndex((r) => r.id === rule.id);

  if (index >= 0) {
    rules[index] = { ...rule, updatedAt: new Date() };
  } else {
    rules.push(rule);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules.map(serializeRule)));
  clearPricingCache();
}

/**
 * Update pricing rule
 */
export function updateRule(
  id: string,
  updates: Partial<Omit<PricingRule, 'id' | 'createdAt'>>
): PricingRule | null {
  const rule = getRuleById(id);
  if (!rule) return null;

  const updated: PricingRule = {
    ...rule,
    ...updates,
    updatedAt: new Date(),
  };

  saveRule(updated);
  return updated;
}

/**
 * Delete pricing rule
 */
export function deleteRule(id: string): boolean {
  const rules = getAllRules();
  const filtered = rules.filter((r) => r.id !== id);

  if (filtered.length === rules.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.map(serializeRule)));
  clearPricingCache();
  return true;
}

/**
 * Toggle rule active status
 */
export function toggleRule(id: string): PricingRule | null {
  const rule = getRuleById(id);
  if (!rule) return null;

  return updateRule(id, { isActive: !rule.isActive });
}

// ============================================================================
// Price Calculation Engine
// ============================================================================

/**
 * Calculate final price for an item with all applicable rules
 */
export function calculatePrice(
  item: OrderItem,
  customer: Customer,
  date: Date = new Date(),
  appliedCoupons: string[] = [],
  orderTotal?: number
): PriceCalculation {
  // Check cache first
  const cacheKey = getCacheKey(item, customer, date, appliedCoupons);
  const cached = getCachedPrice(cacheKey);
  if (cached) return cached;

  const basePrice = item.price;
  const quantity = item.quantity;
  const subtotal = basePrice * quantity;

  // Get applicable rules
  const applicableRules = getApplicableRules(item, customer, date, orderTotal);

  // Resolve conflicts and order by priority
  const orderedRules = resolveConflicts(applicableRules);

  // Apply rules
  let currentPrice = subtotal;
  let shippingDiscount = 0;
  let loyaltyPoints = 0;
  const discounts: PriceCalculation['discounts'] = [];
  const appliedRulesList: PricingRule[] = [];

  for (const rule of orderedRules) {
    const result = applyRule(rule, currentPrice, quantity, item, customer);

    if (result.discount > 0) {
      discounts.push({
        ruleId: rule.id,
        ruleName: rule.name,
        type: result.actionType,
        amount: result.discount,
        percentage: result.percentage,
      });

      if (result.actionType === 'free_shipping') {
        shippingDiscount += result.discount;
      } else {
        currentPrice -= result.discount;
      }

      appliedRulesList.push(rule);

      // Track rule usage
      incrementRuleUsage(rule.id, customer.id);
    }

    if (result.bonusPoints > 0) {
      loyaltyPoints += result.bonusPoints;
    }

    // Stop if rule is not stackable
    if (!rule.isStackable && result.discount > 0) break;
  }

  // Ensure price doesn't go negative
  currentPrice = Math.max(0, currentPrice);

  // Calculate loyalty points (1% of final price by default)
  const basePoints = calculateLoyaltyPoints(currentPrice, customer);
  loyaltyPoints += basePoints;

  const finalPrice = currentPrice;
  const totalSavings = subtotal - finalPrice;
  const breakdown = generatePriceBreakdown(basePrice, quantity, discounts, finalPrice);

  const calculation: PriceCalculation = {
    basePrice,
    quantity,
    subtotal,
    discounts,
    loyaltyPoints: Math.floor(loyaltyPoints),
    shippingDiscount,
    finalPrice,
    finalPricePerUnit: finalPrice / quantity,
    totalSavings,
    breakdown,
    appliedRules: appliedRulesList,
  };

  // Cache the result
  setCachedPrice(cacheKey, calculation);

  // Record in history
  recordPriceHistory(item.productId, customer.id, calculation);

  return calculation;
}

/**
 * Apply a single pricing rule
 */
export function applyRule(
  rule: PricingRule,
  currentPrice: number,
  quantity: number,
  item: OrderItem,
  customer: Customer
): {
  discount: number;
  bonusPoints: number;
  actionType: ActionType;
  percentage?: number;
} {
  let discount = 0;
  let bonusPoints = 0;
  let actionType: ActionType = 'percentage_discount';
  let percentage: number | undefined;

  // Apply each action in the rule
  for (const action of rule.actions) {
    actionType = action.type;

    switch (action.type) {
      case 'percentage_discount': {
        const discountAmount = (currentPrice * action.value) / 100;
        const cappedDiscount = action.maxDiscount
          ? Math.min(discountAmount, action.maxDiscount)
          : discountAmount;
        discount += cappedDiscount;
        percentage = action.value;
        break;
      }

      case 'fixed_discount': {
        const cappedDiscount = action.maxDiscount
          ? Math.min(action.value, action.maxDiscount)
          : action.value;
        discount += cappedDiscount;
        break;
      }

      case 'fixed_price': {
        const originalPrice = item.price * quantity;
        const fixedTotal = action.value * quantity;
        discount += Math.max(0, originalPrice - fixedTotal);
        break;
      }

      case 'free_shipping': {
        discount += action.value; // Shipping cost
        break;
      }

      case 'bonus_points': {
        bonusPoints += action.value;
        break;
      }

      case 'free_item': {
        // Free item handled separately
        break;
      }
    }
  }

  return { discount, bonusPoints, actionType, percentage };
}

/**
 * Get applicable rules for an item and customer
 */
export function getApplicableRules(
  item: OrderItem,
  customer: Customer,
  date: Date = new Date(),
  orderTotal?: number
): PricingRule[] {
  const activeRules = getActiveRules();

  return activeRules.filter((rule) => {
    // Check all conditions
    return evaluateConditions(rule.conditions, item, customer, date, orderTotal);
  });
}

/**
 * Evaluate rule conditions
 */
export function evaluateConditions(
  conditions: RuleCondition[],
  item: OrderItem,
  customer: Customer,
  date: Date,
  orderTotal?: number
): boolean {
  if (conditions.length === 0) return true;

  let result = true;
  let currentLogic: LogicalOperator = 'and';

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const conditionResult = evaluateCondition(condition, item, customer, date, orderTotal);

    if (i === 0) {
      result = conditionResult;
    } else {
      if (currentLogic === 'and') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
    }

    // Set logic for next condition
    if (condition.logicalOperator) {
      currentLogic = condition.logicalOperator;
    }
  }

  return result;
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: RuleCondition,
  item: OrderItem,
  customer: Customer,
  date: Date,
  orderTotal?: number
): boolean {
  const fieldValue = getFieldValue(condition.field, item, customer, date, orderTotal);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'not_equals':
      return fieldValue !== condition.value;

    case 'gt':
      return Number(fieldValue) > Number(condition.value);

    case 'gte':
      return Number(fieldValue) >= Number(condition.value);

    case 'lt':
      return Number(fieldValue) < Number(condition.value);

    case 'lte':
      return Number(fieldValue) <= Number(condition.value);

    case 'between':
      if (!Array.isArray(condition.value) || condition.value.length !== 2) return false;
      const numValue = Number(fieldValue);
      return numValue >= condition.value[0] && numValue <= condition.value[1];

    case 'in':
      if (!Array.isArray(condition.value)) return false;
      return condition.value.includes(fieldValue);

    case 'not_in':
      if (!Array.isArray(condition.value)) return false;
      return !condition.value.includes(fieldValue);

    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());

    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());

    default:
      return false;
  }
}

/**
 * Get field value from item or customer
 */
function getFieldValue(
  field: string,
  item: OrderItem,
  customer: Customer,
  date: Date,
  orderTotal?: number
): any {
  switch (field) {
    case 'quantity':
      return item.quantity;

    case 'product':
    case 'productId':
      return item.productId;

    case 'productName':
      return item.productName;

    case 'price':
      return item.price;

    case 'customerTier':
      return customer.tags?.[0] || 'regular';

    case 'customerId':
      return customer.id;

    case 'customerEmail':
      return customer.email;

    case 'totalOrders':
      return customer.totalOrders;

    case 'totalSpent':
      return customer.totalSpent;

    case 'orderTotal':
      return orderTotal || item.price * item.quantity;

    case 'date':
      return date.toISOString().split('T')[0];

    case 'month':
      return date.getMonth() + 1;

    case 'dayOfWeek':
      return date.getDay();

    case 'hour':
      return date.getHours();

    case 'isWeekend':
      const day = date.getDay();
      return day === 0 || day === 6;

    case 'isNewCustomer':
      return customer.totalOrders === 0;

    default:
      return null;
  }
}

/**
 * Resolve conflicts between rules (order by priority)
 */
export function resolveConflicts(rules: PricingRule[]): PricingRule[] {
  // Sort by priority (lower number = higher priority)
  const sorted = [...rules].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // If same priority, newer rules first
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Filter out conflicting non-stackable rules
  const resolved: PricingRule[] = [];
  let hasNonStackable = false;

  for (const rule of sorted) {
    if (hasNonStackable) break;

    resolved.push(rule);

    if (!rule.isStackable) {
      hasNonStackable = true;
    }
  }

  return resolved;
}

/**
 * Calculate loyalty points
 */
export function calculateLoyaltyPoints(finalPrice: number, customer: Customer): number {
  const tier = customer.tags?.[0] || 'regular';

  let multiplier = 1;
  switch (tier) {
    case 'vip':
      multiplier = 3;
      break;
    case 'wholesale':
      multiplier = 2;
      break;
    case 'regular':
      multiplier = 1;
      break;
    case 'new':
      multiplier = 1.5;
      break;
  }

  // 1% of purchase = loyalty points
  return (finalPrice * 0.01) * multiplier;
}

// ============================================================================
// Price History
// ============================================================================

/**
 * Record price calculation in history
 */
function recordPriceHistory(
  productId: string,
  customerId: string | undefined,
  calculation: PriceCalculation
): void {
  try {
    const history = getPriceHistory();

    const record: PriceHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      customerId,
      calculation,
      timestamp: new Date(),
    };

    history.push(record);

    // Keep last 1000 records
    if (history.length > 1000) {
      history.shift();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.map(serializePriceHistory)));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get price history
 */
export function getPriceHistory(limit: number = 100): PriceHistory[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as any[];
    return history
      .map(deserializePriceHistory)
      .slice(-limit)
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Get price history for a product
 */
export function getProductPriceHistory(productId: string, limit: number = 50): PriceHistory[] {
  const history = getPriceHistory(1000);
  return history
    .filter((h) => h.productId === productId)
    .slice(0, limit);
}

// ============================================================================
// Rule Usage Tracking
// ============================================================================

/**
 * Increment rule usage count
 */
function incrementRuleUsage(ruleId: string, customerId: string): void {
  try {
    // Update global usage count
    const rule = getRuleById(ruleId);
    if (rule) {
      updateRule(ruleId, { usageCount: rule.usageCount + 1 });
    }

    // Track per-customer usage
    const usage = getCustomerRuleUsage(customerId);
    usage[ruleId] = (usage[ruleId] || 0) + 1;

    const allUsage = getAllRuleUsage();
    allUsage[customerId] = usage;

    localStorage.setItem(USAGE_KEY, JSON.stringify(allUsage));
  } catch {
    // Ignore errors
  }
}

/**
 * Get all rule usage data
 */
function getAllRuleUsage(): Record<string, Record<string, number>> {
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get customer rule usage
 */
export function getCustomerRuleUsage(customerId: string): Record<string, number> {
  const allUsage = getAllRuleUsage();
  return allUsage[customerId] || {};
}

/**
 * Check if customer has exceeded max usages for a rule
 */
export function hasExceededMaxUsages(ruleId: string, customerId: string): boolean {
  const rule = getRuleById(ruleId);
  if (!rule || !rule.maxUsagesPerCustomer) return false;

  const usage = getCustomerRuleUsage(customerId);
  return (usage[ruleId] || 0) >= rule.maxUsagesPerCustomer;
}

// ============================================================================
// Caching
// ============================================================================

/**
 * Generate cache key
 */
function getCacheKey(
  item: OrderItem,
  customer: Customer,
  date: Date,
  coupons: string[]
): string {
  return `${item.productId}_${item.quantity}_${customer.id}_${date.toISOString()}_${coupons.join(',')}`;
}

/**
 * Get cached price calculation
 */
function getCachedPrice(key: string): PriceCalculation | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;

    const cache = JSON.parse(stored) as Record<string, { value: any; timestamp: number }>;
    const cached = cache[key];

    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      return null;
    }

    return cached.value;
  } catch {
    return null;
  }
}

/**
 * Set cached price calculation
 */
function setCachedPrice(key: string, calculation: PriceCalculation): void {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    const cache = stored ? JSON.parse(stored) : {};

    cache[key] = {
      value: calculation,
      timestamp: Date.now(),
    };

    // Keep cache size manageable (max 100 entries)
    const keys = Object.keys(cache);
    if (keys.length > 100) {
      // Remove oldest entries
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      sorted.slice(0, keys.length - 100).forEach((k) => delete cache[k]);
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore errors
  }
}

/**
 * Clear pricing cache
 */
export function clearPricingCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate human-readable price breakdown
 */
function generatePriceBreakdown(
  basePrice: number,
  quantity: number,
  discounts: PriceCalculation['discounts'],
  finalPrice: number
): string {
  let breakdown = `Base: $${basePrice.toFixed(2)} × ${quantity} = $${(basePrice * quantity).toFixed(2)}`;

  if (discounts.length > 0) {
    breakdown += '\nDiscounts:';
    discounts.forEach((d) => {
      const percentText = d.percentage ? ` (${d.percentage}%)` : '';
      breakdown += `\n  - ${d.ruleName}: -$${d.amount.toFixed(2)}${percentText}`;
    });
  }

  breakdown += `\nFinal: $${finalPrice.toFixed(2)}`;

  return breakdown;
}

/**
 * Serialize rule for storage
 */
function serializeRule(rule: PricingRule): any {
  return {
    ...rule,
    startDate: rule.startDate.toISOString(),
    endDate: rule.endDate?.toISOString(),
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

/**
 * Deserialize rule from storage
 */
function deserializeRule(rule: any): PricingRule {
  return {
    ...rule,
    startDate: new Date(rule.startDate),
    endDate: rule.endDate ? new Date(rule.endDate) : undefined,
    createdAt: new Date(rule.createdAt),
    updatedAt: new Date(rule.updatedAt),
  };
}

/**
 * Serialize price history for storage
 */
function serializePriceHistory(history: PriceHistory): any {
  return {
    ...history,
    timestamp: history.timestamp.toISOString(),
  };
}

/**
 * Deserialize price history from storage
 */
function deserializePriceHistory(history: any): PriceHistory {
  return {
    ...history,
    timestamp: new Date(history.timestamp),
  };
}

/**
 * Get default pricing rules
 */
export function getDefaultRules(): PricingRule[] {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  return [
    {
      id: 'rule_volume_10',
      name: 'Volume Discount 10+',
      description: 'Get 5% off when buying 10 or more items',
      type: 'volume_discount',
      conditions: [
        {
          field: 'quantity',
          operator: 'gte',
          value: 10,
        },
      ],
      actions: [
        {
          type: 'percentage_discount',
          value: 5,
          applyTo: 'item',
        },
      ],
      priority: 10,
      isActive: true,
      isStackable: true,
      startDate: now,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rule_vip_discount',
      name: 'VIP Customer Discount',
      description: '15% discount for VIP customers',
      type: 'customer_tier',
      conditions: [
        {
          field: 'customerTier',
          operator: 'equals',
          value: 'vip',
        },
      ],
      actions: [
        {
          type: 'percentage_discount',
          value: 15,
          applyTo: 'item',
        },
      ],
      priority: 5,
      isActive: true,
      isStackable: true,
      startDate: now,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'rule_first_purchase',
      name: 'First Purchase Discount',
      description: 'Welcome 20% off for new customers',
      type: 'first_purchase',
      conditions: [
        {
          field: 'isNewCustomer',
          operator: 'equals',
          value: true,
        },
      ],
      actions: [
        {
          type: 'percentage_discount',
          value: 20,
          maxDiscount: 50,
          applyTo: 'order',
        },
      ],
      priority: 1,
      isActive: true,
      isStackable: false,
      startDate: now,
      endDate: endOfYear,
      usageCount: 0,
      maxUsagesPerCustomer: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Validate pricing rule
 */
export function validateRule(rule: Partial<PricingRule>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  }

  if (!rule.type) {
    errors.push('Rule type is required');
  }

  if (!rule.conditions || rule.conditions.length === 0) {
    errors.push('At least one condition is required');
  }

  if (!rule.actions || rule.actions.length === 0) {
    errors.push('At least one action is required');
  }

  if (rule.priority !== undefined && rule.priority < 1) {
    errors.push('Priority must be at least 1');
  }

  if (rule.startDate && rule.endDate && rule.startDate > rule.endDate) {
    errors.push('End date must be after start date');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Duplicate pricing rule
 */
export function duplicateRule(id: string, newName?: string): PricingRule | null {
  const rule = getRuleById(id);
  if (!rule) return null;

  return createRule({
    ...rule,
    name: newName || `${rule.name} (copy)`,
    usageCount: 0,
  } as any);
}

/**
 * Get rule statistics
 */
export function getRuleStatistics(): {
  totalRules: number;
  activeRules: number;
  totalUsages: number;
  topRules: { rule: PricingRule; usages: number }[];
} {
  const allRules = getAllRules();
  const activeRules = getActiveRules();

  const totalUsages = allRules.reduce((sum, rule) => sum + rule.usageCount, 0);

  const topRules = [...allRules]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)
    .map((rule) => ({ rule, usages: rule.usageCount }));

  return {
    totalRules: allRules.length,
    activeRules: activeRules.length,
    totalUsages,
    topRules,
  };
}
