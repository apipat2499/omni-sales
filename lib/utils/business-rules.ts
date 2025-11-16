/**
 * Business Rules Engine
 *
 * Provides comprehensive business rule evaluation for:
 * - Pricing rules (bulk discounts, volume discounts, max limits)
 * - Stock rules (availability, low stock, reorder alerts)
 * - Tax rules (consistency, exemptions)
 * - Order rules (status transitions, modifications)
 * - Template rules (validation, duplicate prevention)
 *
 * Features:
 * - Rule definition and registration
 * - Rule evaluation engine
 * - Conflict detection
 * - Context-aware rule filtering
 * - Caching for performance
 */

import { t } from './i18n';
import { ValidationError, ValidationResult } from './data-validation';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Business rule definition
 */
export interface BusinessRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Detailed description of the rule */
  description: string;
  /** Entity type this rule applies to */
  entityType: 'order' | 'orderItem' | 'stock' | 'tax' | 'template';
  /** Rule category for organization */
  category: 'pricing' | 'stock' | 'tax' | 'order' | 'template';
  /** Condition function - returns true if rule should be evaluated */
  condition: (entity: any, context?: RuleContext) => boolean;
  /** Violation check - returns error if rule is violated */
  violation: (entity: any, context?: RuleContext) => ValidationError | null;
  /** Error severity */
  severity: 'error' | 'warning';
  /** Rule priority (higher = evaluated first) */
  priority?: number;
  /** Whether rule is enabled */
  enabled?: boolean;
}

/**
 * Result of rule evaluation
 */
export interface RuleResult {
  /** The rule that was evaluated */
  rule: BusinessRule;
  /** Whether the rule was violated */
  violated: boolean;
  /** Validation error if violated */
  error?: ValidationError;
  /** Execution time in ms */
  executionTime?: number;
}

/**
 * Context for rule evaluation
 */
export interface RuleContext {
  /** Current user ID */
  userId?: string;
  /** Language for error messages */
  language?: 'th' | 'en';
  /** Additional context data */
  [key: string]: any;
}

/**
 * Rule conflict detection result
 */
export interface RuleConflict {
  /** First conflicting rule */
  rule1: BusinessRule;
  /** Second conflicting rule */
  rule2: BusinessRule;
  /** Description of the conflict */
  description: string;
  /** How to resolve the conflict */
  resolution?: string;
}

// ============================================================================
// Business Rules Registry
// ============================================================================

/**
 * Registry for all business rules
 */
class BusinessRulesRegistry {
  private rules: Map<string, BusinessRule> = new Map();

  /**
   * Register a new business rule
   */
  register(rule: BusinessRule): void {
    this.rules.set(rule.id, {
      ...rule,
      enabled: rule.enabled !== false,
      priority: rule.priority || 0,
    });
  }

  /**
   * Register multiple rules
   */
  registerMany(rules: BusinessRule[]): void {
    rules.forEach((rule) => this.register(rule));
  }

  /**
   * Get rule by ID
   */
  getRule(id: string): BusinessRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get all rules for entity type
   */
  getRulesForEntity(entityType: BusinessRule['entityType']): BusinessRule[] {
    return Array.from(this.rules.values())
      .filter((rule) => rule.entityType === entityType && rule.enabled)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get all rules for category
   */
  getRulesForCategory(category: BusinessRule['category']): BusinessRule[] {
    return Array.from(this.rules.values())
      .filter((rule) => rule.category === category && rule.enabled)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Get all rules
   */
  getAllRules(): BusinessRule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.enabled);
  }

  /**
   * Disable a rule
   */
  disable(id: string): void {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.set(id, { ...rule, enabled: false });
    }
  }

  /**
   * Enable a rule
   */
  enable(id: string): void {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.set(id, { ...rule, enabled: true });
    }
  }

  /**
   * Clear all rules
   */
  clear(): void {
    this.rules.clear();
  }
}

// Singleton registry
export const rulesRegistry = new BusinessRulesRegistry();

// ============================================================================
// Pricing Rules
// ============================================================================

/**
 * Rule: Price must be positive
 */
const RULE_PRICE_POSITIVE: BusinessRule = {
  id: 'price-positive',
  name: 'Price Must Be Positive',
  description: 'Item price must be greater than zero',
  entityType: 'orderItem',
  category: 'pricing',
  priority: 100,
  severity: 'error',
  condition: (item: any) => item.price !== undefined,
  violation: (item: any, context?: RuleContext) => {
    if (item.price <= 0) {
      return {
        field: 'price',
        message: t('business-rules.errors.priceNotPositive', context?.language),
        code: 'PRICE_NOT_POSITIVE',
        severity: 'error',
        value: item.price,
      };
    }
    return null;
  },
};

/**
 * Rule: Bulk discount (10%+ quantity >= 100 units = 5% discount)
 */
const RULE_BULK_DISCOUNT: BusinessRule = {
  id: 'bulk-discount',
  name: 'Bulk Discount',
  description: 'Quantities >= 100 units automatically receive 5% discount',
  entityType: 'orderItem',
  category: 'pricing',
  priority: 80,
  severity: 'warning',
  condition: (item: any) => item.quantity >= 100,
  violation: (item: any, context?: RuleContext) => {
    const discountType = item.discountType || 'percentage';
    const currentDiscount = item.discount || 0;

    // If percentage discount is less than 5%, suggest applying bulk discount
    if (discountType === 'percentage' && currentDiscount < 5) {
      return {
        field: 'discount',
        message: t('business-rules.warnings.bulkDiscountAvailable', context?.language),
        code: 'BULK_DISCOUNT_AVAILABLE',
        severity: 'warning',
        value: currentDiscount,
        context: { quantity: item.quantity, suggestedDiscount: 5 },
      };
    }
    return null;
  },
};

/**
 * Rule: Volume discount (Quantity >= 500 = 10% discount)
 */
const RULE_VOLUME_DISCOUNT: BusinessRule = {
  id: 'volume-discount',
  name: 'Volume Discount',
  description: 'Quantities >= 500 units automatically receive 10% discount',
  entityType: 'orderItem',
  category: 'pricing',
  priority: 90,
  severity: 'warning',
  condition: (item: any) => item.quantity >= 500,
  violation: (item: any, context?: RuleContext) => {
    const discountType = item.discountType || 'percentage';
    const currentDiscount = item.discount || 0;

    // If percentage discount is less than 10%, suggest applying volume discount
    if (discountType === 'percentage' && currentDiscount < 10) {
      return {
        field: 'discount',
        message: t('business-rules.warnings.volumeDiscountAvailable', context?.language),
        code: 'VOLUME_DISCOUNT_AVAILABLE',
        severity: 'warning',
        value: currentDiscount,
        context: { quantity: item.quantity, suggestedDiscount: 10 },
      };
    }
    return null;
  },
};

/**
 * Rule: Max discount is 50% per item
 */
const RULE_MAX_DISCOUNT: BusinessRule = {
  id: 'max-discount',
  name: 'Maximum Discount Limit',
  description: 'Discount cannot exceed 50% of item price',
  entityType: 'orderItem',
  category: 'pricing',
  priority: 100,
  severity: 'error',
  condition: (item: any) => item.discount !== undefined && item.discount > 0,
  violation: (item: any, context?: RuleContext) => {
    const discountType = item.discountType || 'percentage';
    const discount = item.discount || 0;

    if (discountType === 'percentage' && discount > 50) {
      return {
        field: 'discount',
        message: t('business-rules.errors.discountExceedsMaximum', context?.language),
        code: 'DISCOUNT_EXCEEDS_MAXIMUM',
        severity: 'error',
        value: discount,
        context: { maxDiscount: 50 },
      };
    }

    // For fixed discount, check if it exceeds 50% of total price
    if (discountType === 'fixed') {
      const totalPrice = item.price * item.quantity;
      const discountPercent = (discount / totalPrice) * 100;
      if (discountPercent > 50) {
        return {
          field: 'discount',
          message: t('business-rules.errors.discountExceedsMaximum', context?.language),
          code: 'DISCOUNT_EXCEEDS_MAXIMUM',
          severity: 'error',
          value: discount,
          context: { maxDiscount: 50, actualPercent: discountPercent },
        };
      }
    }

    return null;
  },
};

// ============================================================================
// Stock Rules
// ============================================================================

/**
 * Rule: Cannot sell more than available stock
 */
const RULE_STOCK_AVAILABILITY: BusinessRule = {
  id: 'stock-availability',
  name: 'Stock Availability',
  description: 'Cannot order more items than available in stock',
  entityType: 'orderItem',
  category: 'stock',
  priority: 100,
  severity: 'error',
  condition: (item: any, context?: RuleContext) => {
    return context?.availableStock !== undefined;
  },
  violation: (item: any, context?: RuleContext) => {
    const availableStock = context?.availableStock || 0;
    if (item.quantity > availableStock) {
      return {
        field: 'quantity',
        message: t('business-rules.errors.insufficientStock', context?.language),
        code: 'INSUFFICIENT_STOCK',
        severity: 'error',
        value: item.quantity,
        context: { requested: item.quantity, available: availableStock },
      };
    }
    return null;
  },
};

/**
 * Rule: Low stock alert
 */
const RULE_LOW_STOCK: BusinessRule = {
  id: 'low-stock-alert',
  name: 'Low Stock Alert',
  description: 'Alert when stock falls below minimum level',
  entityType: 'stock',
  category: 'stock',
  priority: 70,
  severity: 'warning',
  condition: (stock: any) => {
    return stock.currentStock !== undefined && stock.minimumStock !== undefined;
  },
  violation: (stock: any, context?: RuleContext) => {
    if (stock.currentStock < stock.minimumStock) {
      return {
        field: 'currentStock',
        message: t('business-rules.warnings.stockBelowMinimum', context?.language),
        code: 'STOCK_BELOW_MINIMUM',
        severity: 'warning',
        value: stock.currentStock,
        context: { currentStock: stock.currentStock, minimumStock: stock.minimumStock },
      };
    }
    return null;
  },
};

/**
 * Rule: Reorder alert
 */
const RULE_REORDER_ALERT: BusinessRule = {
  id: 'reorder-alert',
  name: 'Reorder Alert',
  description: 'Alert when stock reaches reorder point',
  entityType: 'stock',
  category: 'stock',
  priority: 80,
  severity: 'warning',
  condition: (stock: any) => {
    return (
      stock.currentStock !== undefined &&
      stock.minimumStock !== undefined &&
      stock.reorderQuantity !== undefined
    );
  },
  violation: (stock: any, context?: RuleContext) => {
    const reorderPoint = stock.minimumStock + (stock.reorderQuantity || 0);
    if (stock.currentStock <= reorderPoint) {
      return {
        field: 'currentStock',
        message: t('business-rules.warnings.reorderPointReached', context?.language),
        code: 'REORDER_POINT_REACHED',
        severity: 'warning',
        value: stock.currentStock,
        context: {
          currentStock: stock.currentStock,
          reorderPoint,
          suggestedReorder: stock.reorderQuantity,
        },
      };
    }
    return null;
  },
};

/**
 * Rule: Slow-moving items alert (no sales in 90 days)
 */
const RULE_SLOW_MOVING: BusinessRule = {
  id: 'slow-moving-items',
  name: 'Slow-Moving Items',
  description: 'Alert for items with no sales in 90 days',
  entityType: 'stock',
  category: 'stock',
  priority: 60,
  severity: 'warning',
  condition: (stock: any, context?: RuleContext) => {
    return context?.lastSaleDate !== undefined;
  },
  violation: (stock: any, context?: RuleContext) => {
    const lastSaleDate = context?.lastSaleDate;
    if (!lastSaleDate) return null;

    const daysSinceLastSale = Math.floor(
      (Date.now() - new Date(lastSaleDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSale >= 90) {
      return {
        field: 'lastSaleDate',
        message: t('business-rules.warnings.slowMovingItem', context?.language),
        code: 'SLOW_MOVING_ITEM',
        severity: 'warning',
        value: lastSaleDate,
        context: { daysSinceLastSale },
      };
    }
    return null;
  },
};

// ============================================================================
// Tax Rules
// ============================================================================

/**
 * Rule: Cannot have multiple VAT taxes
 */
const RULE_SINGLE_VAT: BusinessRule = {
  id: 'single-vat-tax',
  name: 'Single VAT Tax',
  description: 'Only one VAT tax configuration can be active',
  entityType: 'tax',
  category: 'tax',
  priority: 90,
  severity: 'error',
  condition: (tax: any, context?: RuleContext) => {
    return tax.type === 'vat' && context?.existingVatTaxes !== undefined;
  },
  violation: (tax: any, context?: RuleContext) => {
    const existingVatTaxes = context?.existingVatTaxes || [];
    if (existingVatTaxes.length > 0 && !existingVatTaxes.some((t: any) => t.id === tax.id)) {
      return {
        field: 'type',
        message: t('business-rules.errors.multipleVatTaxes', context?.language),
        code: 'MULTIPLE_VAT_TAXES',
        severity: 'error',
        value: tax.type,
        context: { existingVatTaxes: existingVatTaxes.map((t: any) => t.name) },
      };
    }
    return null;
  },
};

/**
 * Rule: Tax rate consistency with region
 */
const RULE_TAX_RATE_REGION: BusinessRule = {
  id: 'tax-rate-region',
  name: 'Tax Rate Regional Consistency',
  description: 'Tax rate must be consistent with regional requirements',
  entityType: 'tax',
  category: 'tax',
  priority: 70,
  severity: 'warning',
  condition: (tax: any, context?: RuleContext) => {
    return tax.region !== undefined && context?.regionalTaxRates !== undefined;
  },
  violation: (tax: any, context?: RuleContext) => {
    const expectedRate = context?.regionalTaxRates?.[tax.region];
    if (expectedRate !== undefined && Math.abs(tax.rate - expectedRate) > 0.01) {
      return {
        field: 'rate',
        message: t('business-rules.warnings.taxRateInconsistent', context?.language),
        code: 'TAX_RATE_INCONSISTENT',
        severity: 'warning',
        value: tax.rate,
        context: { region: tax.region, expectedRate, actualRate: tax.rate },
      };
    }
    return null;
  },
};

// ============================================================================
// Order Rules
// ============================================================================

/**
 * Rule: Valid order status transitions
 */
const RULE_ORDER_STATUS_TRANSITION: BusinessRule = {
  id: 'order-status-transition',
  name: 'Valid Order Status Transition',
  description: 'Order status must follow valid transition paths',
  entityType: 'order',
  category: 'order',
  priority: 100,
  severity: 'error',
  condition: (order: any, context?: RuleContext) => {
    return context?.previousStatus !== undefined && order.status !== undefined;
  },
  violation: (order: any, context?: RuleContext) => {
    const prevStatus = context?.previousStatus;
    const newStatus = order.status;

    const validTransitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'cancelled'],
      completed: [], // Final state
      cancelled: [], // Final state
    };

    const allowed = validTransitions[prevStatus] || [];
    if (!allowed.includes(newStatus)) {
      return {
        field: 'status',
        message: t('business-rules.errors.invalidStatusTransition', context?.language),
        code: 'INVALID_STATUS_TRANSITION',
        severity: 'error',
        value: newStatus,
        context: { previousStatus: prevStatus, newStatus, allowedTransitions: allowed },
      };
    }
    return null;
  },
};

/**
 * Rule: Cannot modify completed or cancelled orders
 */
const RULE_NO_MODIFY_FINAL_ORDERS: BusinessRule = {
  id: 'no-modify-final-orders',
  name: 'No Modification of Final Orders',
  description: 'Completed or cancelled orders cannot be modified',
  entityType: 'order',
  category: 'order',
  priority: 100,
  severity: 'error',
  condition: (order: any, context?: RuleContext) => {
    return context?.isModification === true;
  },
  violation: (order: any, context?: RuleContext) => {
    if (order.status === 'completed' || order.status === 'cancelled') {
      return {
        field: 'status',
        message: t('business-rules.errors.cannotModifyFinalOrder', context?.language),
        code: 'CANNOT_MODIFY_FINAL_ORDER',
        severity: 'error',
        value: order.status,
        context: { status: order.status },
      };
    }
    return null;
  },
};

/**
 * Rule: Order must have at least 1 item
 */
const RULE_ORDER_MIN_ITEMS: BusinessRule = {
  id: 'order-min-items',
  name: 'Minimum Order Items',
  description: 'Order must contain at least one item',
  entityType: 'order',
  category: 'order',
  priority: 100,
  severity: 'error',
  condition: (order: any) => true,
  violation: (order: any, context?: RuleContext) => {
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      return {
        field: 'items',
        message: t('business-rules.errors.orderNoItems', context?.language),
        code: 'ORDER_NO_ITEMS',
        severity: 'error',
        value: order.items,
      };
    }
    return null;
  },
};

// ============================================================================
// Template Rules
// ============================================================================

/**
 * Rule: Template items must be valid
 */
const RULE_TEMPLATE_VALID_ITEMS: BusinessRule = {
  id: 'template-valid-items',
  name: 'Template Valid Items',
  description: 'Template must contain only valid items',
  entityType: 'template',
  category: 'template',
  priority: 90,
  severity: 'error',
  condition: (template: any) => template.items !== undefined,
  violation: (template: any, context?: RuleContext) => {
    if (!Array.isArray(template.items) || template.items.length === 0) {
      return {
        field: 'items',
        message: t('business-rules.errors.templateNoItems', context?.language),
        code: 'TEMPLATE_NO_ITEMS',
        severity: 'error',
        value: template.items,
      };
    }
    return null;
  },
};

/**
 * Rule: Prevent duplicate products in template application
 */
const RULE_TEMPLATE_NO_DUPLICATES: BusinessRule = {
  id: 'template-no-duplicates',
  name: 'Template No Duplicates',
  description: 'Template application should not create duplicate products',
  entityType: 'template',
  category: 'template',
  priority: 70,
  severity: 'warning',
  condition: (template: any, context?: RuleContext) => {
    return context?.existingItems !== undefined;
  },
  violation: (template: any, context?: RuleContext) => {
    const existingProductIds = new Set(
      (context?.existingItems || []).map((item: any) => item.productId)
    );
    const duplicates = template.items?.filter((item: any) =>
      existingProductIds.has(item.productId)
    );

    if (duplicates && duplicates.length > 0) {
      return {
        field: 'items',
        message: t('business-rules.warnings.templateDuplicateProducts', context?.language),
        code: 'TEMPLATE_DUPLICATE_PRODUCTS',
        severity: 'warning',
        value: duplicates,
        context: { duplicateCount: duplicates.length, duplicates },
      };
    }
    return null;
  },
};

// ============================================================================
// Rule Registration
// ============================================================================

/**
 * Initialize and register all business rules
 */
export function initializeBusinessRules(): void {
  // Clear existing rules
  rulesRegistry.clear();

  // Register pricing rules
  rulesRegistry.register(RULE_PRICE_POSITIVE);
  rulesRegistry.register(RULE_BULK_DISCOUNT);
  rulesRegistry.register(RULE_VOLUME_DISCOUNT);
  rulesRegistry.register(RULE_MAX_DISCOUNT);

  // Register stock rules
  rulesRegistry.register(RULE_STOCK_AVAILABILITY);
  rulesRegistry.register(RULE_LOW_STOCK);
  rulesRegistry.register(RULE_REORDER_ALERT);
  rulesRegistry.register(RULE_SLOW_MOVING);

  // Register tax rules
  rulesRegistry.register(RULE_SINGLE_VAT);
  rulesRegistry.register(RULE_TAX_RATE_REGION);

  // Register order rules
  rulesRegistry.register(RULE_ORDER_STATUS_TRANSITION);
  rulesRegistry.register(RULE_NO_MODIFY_FINAL_ORDERS);
  rulesRegistry.register(RULE_ORDER_MIN_ITEMS);

  // Register template rules
  rulesRegistry.register(RULE_TEMPLATE_VALID_ITEMS);
  rulesRegistry.register(RULE_TEMPLATE_NO_DUPLICATES);
}

// Initialize rules on module load
initializeBusinessRules();

// ============================================================================
// Rule Evaluation Engine
// ============================================================================

/**
 * Evaluate all applicable rules for an entity
 */
export function evaluateRules(
  entity: any,
  entityType: BusinessRule['entityType'],
  context?: RuleContext
): RuleResult[] {
  const rules = rulesRegistry.getRulesForEntity(entityType);
  const results: RuleResult[] = [];

  for (const rule of rules) {
    const startTime = Date.now();

    // Check if rule condition is met
    if (!rule.condition(entity, context)) {
      continue;
    }

    // Evaluate rule violation
    const error = rule.violation(entity, context);
    const executionTime = Date.now() - startTime;

    results.push({
      rule,
      violated: error !== null,
      error: error || undefined,
      executionTime,
    });
  }

  return results;
}

/**
 * Get applicable rules for an entity (without evaluating)
 */
export function getApplicableRules(
  entity: any,
  entityType: BusinessRule['entityType'],
  context?: RuleContext
): BusinessRule[] {
  const rules = rulesRegistry.getRulesForEntity(entityType);
  return rules.filter((rule) => rule.condition(entity, context));
}

/**
 * Get rules for entity type
 */
export function getRulesForEntity(
  entityType: BusinessRule['entityType']
): BusinessRule[] {
  return rulesRegistry.getRulesForEntity(entityType);
}

/**
 * Convert rule results to validation result
 */
export function ruleResultsToValidationResult(results: RuleResult[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  results.forEach((result) => {
    if (result.violated && result.error) {
      if (result.error.severity === 'error') {
        errors.push(result.error);
      } else {
        warnings.push(result.error);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Check for conflicts between rules
 */
export function checkRuleConflicts(entity: any, context?: RuleContext): RuleConflict[] {
  const conflicts: RuleConflict[] = [];

  // Check for bulk vs volume discount conflict
  if (entity.quantity >= 500) {
    const bulkRule = rulesRegistry.getRule('bulk-discount');
    const volumeRule = rulesRegistry.getRule('volume-discount');

    if (bulkRule && volumeRule) {
      conflicts.push({
        rule1: bulkRule,
        rule2: volumeRule,
        description: 'Both bulk and volume discounts apply - volume discount takes precedence',
        resolution: 'Apply volume discount (10%) instead of bulk discount (5%)',
      });
    }
  }

  return conflicts;
}

/**
 * Detect conflicting discount applications
 */
export function detectDiscountConflicts(
  item: any,
  context?: RuleContext
): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  const bulkEligible = item.quantity >= 100;
  const volumeEligible = item.quantity >= 500;

  if (bulkEligible && volumeEligible) {
    const bulkRule = rulesRegistry.getRule('bulk-discount');
    const volumeRule = rulesRegistry.getRule('volume-discount');

    if (bulkRule && volumeRule) {
      conflicts.push({
        rule1: bulkRule,
        rule2: volumeRule,
        description: t('business-rules.conflicts.bulkVsVolume', context?.language),
        resolution: t('business-rules.conflicts.useVolumeDiscount', context?.language),
      });
    }
  }

  return conflicts;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if entity passes all rules
 */
export function passesAllRules(
  entity: any,
  entityType: BusinessRule['entityType'],
  context?: RuleContext
): boolean {
  const results = evaluateRules(entity, entityType, context);
  return !results.some((r) => r.violated && r.rule.severity === 'error');
}

/**
 * Get all violations for entity
 */
export function getViolations(
  entity: any,
  entityType: BusinessRule['entityType'],
  context?: RuleContext
): ValidationError[] {
  const results = evaluateRules(entity, entityType, context);
  return results.filter((r) => r.violated && r.error).map((r) => r.error!);
}

/**
 * Get warnings for entity
 */
export function getWarnings(
  entity: any,
  entityType: BusinessRule['entityType'],
  context?: RuleContext
): ValidationError[] {
  const results = evaluateRules(entity, entityType, context);
  return results
    .filter((r) => r.violated && r.error && r.error.severity === 'warning')
    .map((r) => r.error!);
}

/**
 * Format rule results for display
 */
export function formatRuleResults(results: RuleResult[]): string[] {
  return results
    .filter((r) => r.violated && r.error)
    .map((r) => `${r.rule.name}: ${r.error!.message}`);
}
