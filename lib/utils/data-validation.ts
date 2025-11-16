/**
 * Data Validation and Schema Definitions
 *
 * Provides comprehensive validation for:
 * - Order items and orders
 * - Stock levels
 * - Tax configurations
 * - Business data integrity
 *
 * Features:
 * - Error accumulation pattern
 * - Multi-field validation
 * - Cross-field dependencies
 * - Localized error messages
 * - Caching for performance
 */

import { t } from './i18n';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Validation error with detailed context
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code for programmatic handling */
  code: string;
  /** Error severity level */
  severity: 'error' | 'warning';
  /** The value that failed validation */
  value?: any;
  /** Additional context or metadata */
  context?: Record<string, any>;
}

/**
 * Result of validation containing all errors and warnings
 */
export interface ValidationResult {
  /** Whether validation passed (no errors) */
  valid: boolean;
  /** Critical errors that prevent operation */
  errors: ValidationError[];
  /** Warnings that should be reviewed but don't block */
  warnings: ValidationError[];
  /** Validated and potentially transformed data */
  data?: any;
}

/**
 * Options for validation behavior
 */
export interface ValidationOptions {
  /** Stop at first error (fast-fail) or accumulate all errors */
  stopOnFirstError?: boolean;
  /** Include warnings in validation */
  includeWarnings?: boolean;
  /** Language for error messages */
  language?: 'th' | 'en';
  /** Custom field labels for error messages */
  fieldLabels?: Record<string, string>;
  /** Additional context for validation */
  context?: Record<string, any>;
}

/**
 * Order item for validation
 */
export interface ValidatableOrderItem {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number;
  notes?: string;
}

/**
 * Order for validation
 */
export interface ValidatableOrder {
  id?: string;
  items: ValidatableOrderItem[];
  totalPrice?: number;
  customerName?: string;
  orderDate?: string | Date;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
}

/**
 * Stock level for validation
 */
export interface ValidatableStockLevel {
  productId: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderQuantity?: number;
  reorderPoint?: number;
}

/**
 * Tax configuration for validation
 */
export interface ValidatableTaxConfig {
  id?: string;
  name: string;
  rate: number;
  type: 'vat' | 'gst' | 'sales-tax' | 'flat-fee';
  appliesToCategories?: string[];
  region?: string;
  isActive?: boolean;
}

// ============================================================================
// Validation Error Accumulator
// ============================================================================

/**
 * Error accumulator for collecting validation errors
 */
export class ValidationAccumulator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      stopOnFirstError: false,
      includeWarnings: true,
      language: 'en',
      ...options,
    };
  }

  /**
   * Add an error to the accumulator
   */
  addError(error: Omit<ValidationError, 'severity'>): void {
    const fullError: ValidationError = { ...error, severity: 'error' };
    this.errors.push(fullError);

    if (this.options.stopOnFirstError) {
      throw new ValidationStopError(fullError);
    }
  }

  /**
   * Add a warning to the accumulator
   */
  addWarning(warning: Omit<ValidationError, 'severity'>): void {
    if (this.options.includeWarnings) {
      this.warnings.push({ ...warning, severity: 'warning' });
    }
  }

  /**
   * Get validation result
   */
  getResult(data?: any): ValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      data,
    };
  }

  /**
   * Check if validation has errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errors.length;
  }

  /**
   * Get warning count
   */
  getWarningCount(): number {
    return this.warnings.length;
  }

  /**
   * Clear all errors and warnings
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
  }
}

/**
 * Error thrown when stopOnFirstError is enabled
 */
class ValidationStopError extends Error {
  constructor(public validationError: ValidationError) {
    super(validationError.message);
    this.name = 'ValidationStopError';
  }
}

// ============================================================================
// Basic Validators
// ============================================================================

/**
 * Validate required field
 */
function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Validate string length
 */
function validateStringLength(
  value: string,
  min?: number,
  max?: number
): boolean {
  const length = value.length;
  if (min !== undefined && length < min) return false;
  if (max !== undefined && length > max) return false;
  return true;
}

/**
 * Validate number range
 */
function validateNumberRange(
  value: number,
  min?: number,
  max?: number
): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Validate date format and constraints
 */
function validateDate(date: any, notInFuture?: boolean): boolean {
  const dateObj = new Date(date);

  // Check if valid date
  if (isNaN(dateObj.getTime())) return false;

  // Check if not in future
  if (notInFuture && dateObj > new Date()) return false;

  return true;
}

/**
 * Validate enum value
 */
function validateEnum<T>(value: T, allowedValues: T[]): boolean {
  return allowedValues.includes(value);
}

// ============================================================================
// OrderItem Validation
// ============================================================================

/**
 * Validate a single order item
 *
 * Rules:
 * - productName: required, string, 1-255 chars
 * - quantity: required, number, min 1, max 999999
 * - price: required, number, min 0, max 9999999
 * - discount: optional, number, min 0, max 100 (if percentage) or max price (if fixed)
 * - discount value cannot exceed original price
 * - taxRate: optional, number, min 0, max 50
 */
export function validateOrderItem(
  item: ValidatableOrderItem,
  options: ValidationOptions = {}
): ValidationResult {
  const acc = new ValidationAccumulator(options);

  try {
    // Validate productName
    if (!isRequired(item.productName)) {
      acc.addError({
        field: 'productName',
        message: t('validation.errors.productNameRequired', options.language),
        code: 'PRODUCT_NAME_REQUIRED',
        value: item.productName,
      });
    } else if (!validateStringLength(item.productName, 1, 255)) {
      acc.addError({
        field: 'productName',
        message: t('validation.errors.productNameLength', options.language),
        code: 'PRODUCT_NAME_LENGTH',
        value: item.productName,
      });
    }

    // Validate quantity
    if (!isRequired(item.quantity)) {
      acc.addError({
        field: 'quantity',
        message: t('validation.errors.quantityRequired', options.language),
        code: 'QUANTITY_REQUIRED',
        value: item.quantity,
      });
    } else if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity)) {
      acc.addError({
        field: 'quantity',
        message: t('validation.errors.quantityInteger', options.language),
        code: 'QUANTITY_NOT_INTEGER',
        value: item.quantity,
      });
    } else if (!validateNumberRange(item.quantity, 1, 999999)) {
      acc.addError({
        field: 'quantity',
        message: t('validation.errors.quantityRange', options.language),
        code: 'QUANTITY_OUT_OF_RANGE',
        value: item.quantity,
        context: { min: 1, max: 999999 },
      });
    }

    // Validate price
    if (!isRequired(item.price)) {
      acc.addError({
        field: 'price',
        message: t('validation.errors.priceRequired', options.language),
        code: 'PRICE_REQUIRED',
        value: item.price,
      });
    } else if (typeof item.price !== 'number') {
      acc.addError({
        field: 'price',
        message: t('validation.errors.priceNumber', options.language),
        code: 'PRICE_NOT_NUMBER',
        value: item.price,
      });
    } else if (!validateNumberRange(item.price, 0, 9999999)) {
      acc.addError({
        field: 'price',
        message: t('validation.errors.priceRange', options.language),
        code: 'PRICE_OUT_OF_RANGE',
        value: item.price,
        context: { min: 0, max: 9999999 },
      });
    } else if (item.price < 0) {
      acc.addError({
        field: 'price',
        message: t('validation.errors.priceNegative', options.language),
        code: 'PRICE_NEGATIVE',
        value: item.price,
      });
    }

    // Validate discount
    if (item.discount !== undefined && item.discount !== null) {
      const discountType = item.discountType || 'percentage';

      if (typeof item.discount !== 'number') {
        acc.addError({
          field: 'discount',
          message: t('validation.errors.discountNumber', options.language),
          code: 'DISCOUNT_NOT_NUMBER',
          value: item.discount,
        });
      } else if (item.discount < 0) {
        acc.addError({
          field: 'discount',
          message: t('validation.errors.discountNegative', options.language),
          code: 'DISCOUNT_NEGATIVE',
          value: item.discount,
        });
      } else if (discountType === 'percentage') {
        // Percentage discount: 0-100
        if (!validateNumberRange(item.discount, 0, 100)) {
          acc.addError({
            field: 'discount',
            message: t('validation.errors.discountPercentageRange', options.language),
            code: 'DISCOUNT_PERCENTAGE_OUT_OF_RANGE',
            value: item.discount,
            context: { min: 0, max: 100 },
          });
        }
      } else if (discountType === 'fixed') {
        // Fixed discount: cannot exceed total price
        const totalPrice = item.price * item.quantity;
        if (item.discount > totalPrice) {
          acc.addError({
            field: 'discount',
            message: t('validation.errors.discountExceedsPrice', options.language),
            code: 'DISCOUNT_EXCEEDS_PRICE',
            value: item.discount,
            context: { totalPrice, discount: item.discount },
          });
        }
      }
    }

    // Validate taxRate
    if (item.taxRate !== undefined && item.taxRate !== null) {
      if (typeof item.taxRate !== 'number') {
        acc.addError({
          field: 'taxRate',
          message: t('validation.errors.taxRateNumber', options.language),
          code: 'TAX_RATE_NOT_NUMBER',
          value: item.taxRate,
        });
      } else if (!validateNumberRange(item.taxRate, 0, 50)) {
        acc.addError({
          field: 'taxRate',
          message: t('validation.errors.taxRateRange', options.language),
          code: 'TAX_RATE_OUT_OF_RANGE',
          value: item.taxRate,
          context: { min: 0, max: 50 },
        });
      }
    }

    return acc.getResult(item);
  } catch (error) {
    if (error instanceof ValidationStopError) {
      return acc.getResult();
    }
    throw error;
  }
}

// ============================================================================
// Order Validation
// ============================================================================

/**
 * Validate an order
 *
 * Rules:
 * - items: array of valid OrderItems, min 1 item
 * - totalPrice: calculated field, auto-computed
 * - customerName: string, optional but if provided min 2 chars
 * - orderDate: valid ISO date, not in future
 * - status: enum (pending, processing, completed, cancelled)
 */
export function validateOrder(
  order: ValidatableOrder,
  options: ValidationOptions = {}
): ValidationResult {
  const acc = new ValidationAccumulator(options);

  try {
    // Validate items array
    if (!isRequired(order.items)) {
      acc.addError({
        field: 'items',
        message: t('validation.errors.itemsRequired', options.language),
        code: 'ITEMS_REQUIRED',
        value: order.items,
      });
    } else if (!Array.isArray(order.items)) {
      acc.addError({
        field: 'items',
        message: t('validation.errors.itemsArray', options.language),
        code: 'ITEMS_NOT_ARRAY',
        value: order.items,
      });
    } else if (order.items.length === 0) {
      acc.addError({
        field: 'items',
        message: t('validation.errors.itemsEmpty', options.language),
        code: 'ITEMS_EMPTY',
        value: order.items,
      });
    } else {
      // Validate each item
      order.items.forEach((item, index) => {
        const itemResult = validateOrderItem(item, {
          ...options,
          stopOnFirstError: false, // Always accumulate for items
        });

        // Add item errors with index
        itemResult.errors.forEach((error) => {
          acc.addError({
            ...error,
            field: `items[${index}].${error.field}`,
            context: { ...error.context, itemIndex: index },
          });
        });

        // Add item warnings
        itemResult.warnings.forEach((warning) => {
          acc.addWarning({
            ...warning,
            field: `items[${index}].${warning.field}`,
            context: { ...warning.context, itemIndex: index },
          });
        });
      });
    }

    // Validate customerName (optional)
    if (order.customerName !== undefined && order.customerName !== null) {
      if (typeof order.customerName !== 'string') {
        acc.addError({
          field: 'customerName',
          message: t('validation.errors.customerNameString', options.language),
          code: 'CUSTOMER_NAME_NOT_STRING',
          value: order.customerName,
        });
      } else if (order.customerName.trim() !== '' && !validateStringLength(order.customerName, 2)) {
        acc.addError({
          field: 'customerName',
          message: t('validation.errors.customerNameLength', options.language),
          code: 'CUSTOMER_NAME_TOO_SHORT',
          value: order.customerName,
          context: { min: 2 },
        });
      }
    }

    // Validate orderDate
    if (order.orderDate !== undefined && order.orderDate !== null) {
      if (!validateDate(order.orderDate, true)) {
        acc.addError({
          field: 'orderDate',
          message: t('validation.errors.orderDateInvalid', options.language),
          code: 'ORDER_DATE_INVALID',
          value: order.orderDate,
        });
      }
    }

    // Validate status
    if (order.status !== undefined && order.status !== null) {
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validateEnum(order.status, validStatuses)) {
        acc.addError({
          field: 'status',
          message: t('validation.errors.statusInvalid', options.language),
          code: 'STATUS_INVALID',
          value: order.status,
          context: { validStatuses },
        });
      }
    }

    // Calculate and validate totalPrice
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const calculatedTotal = order.items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const discount = item.discount || 0;
        const discountType = item.discountType || 'percentage';

        let discountAmount = 0;
        if (discountType === 'percentage') {
          discountAmount = itemTotal * (discount / 100);
        } else {
          discountAmount = discount;
        }

        return sum + (itemTotal - discountAmount);
      }, 0);

      // Check if provided totalPrice matches calculated
      if (order.totalPrice !== undefined && order.totalPrice !== null) {
        const diff = Math.abs(order.totalPrice - calculatedTotal);
        if (diff > 0.01) { // Allow for floating point errors
          acc.addWarning({
            field: 'totalPrice',
            message: t('validation.warnings.totalPriceMismatch', options.language),
            code: 'TOTAL_PRICE_MISMATCH',
            value: order.totalPrice,
            context: { provided: order.totalPrice, calculated: calculatedTotal },
          });
        }
      }
    }

    return acc.getResult(order);
  } catch (error) {
    if (error instanceof ValidationStopError) {
      return acc.getResult();
    }
    throw error;
  }
}

// ============================================================================
// Stock Level Validation
// ============================================================================

/**
 * Validate stock level
 *
 * Rules:
 * - productId: required, string
 * - currentStock: number, min 0
 * - minimumStock: min 0, less than maximum
 * - maximumStock: greater than minimum
 * - reorderQuantity: optional, if provided > 0
 */
export function validateStockLevel(
  stock: ValidatableStockLevel,
  options: ValidationOptions = {}
): ValidationResult {
  const acc = new ValidationAccumulator(options);

  try {
    // Validate productId
    if (!isRequired(stock.productId)) {
      acc.addError({
        field: 'productId',
        message: t('validation.errors.productIdRequired', options.language),
        code: 'PRODUCT_ID_REQUIRED',
        value: stock.productId,
      });
    }

    // Validate currentStock
    if (!isRequired(stock.currentStock)) {
      acc.addError({
        field: 'currentStock',
        message: t('validation.errors.currentStockRequired', options.language),
        code: 'CURRENT_STOCK_REQUIRED',
        value: stock.currentStock,
      });
    } else if (typeof stock.currentStock !== 'number') {
      acc.addError({
        field: 'currentStock',
        message: t('validation.errors.currentStockNumber', options.language),
        code: 'CURRENT_STOCK_NOT_NUMBER',
        value: stock.currentStock,
      });
    } else if (stock.currentStock < 0) {
      acc.addError({
        field: 'currentStock',
        message: t('validation.errors.currentStockNegative', options.language),
        code: 'CURRENT_STOCK_NEGATIVE',
        value: stock.currentStock,
      });
    }

    // Validate minimumStock
    if (!isRequired(stock.minimumStock)) {
      acc.addError({
        field: 'minimumStock',
        message: t('validation.errors.minimumStockRequired', options.language),
        code: 'MINIMUM_STOCK_REQUIRED',
        value: stock.minimumStock,
      });
    } else if (typeof stock.minimumStock !== 'number') {
      acc.addError({
        field: 'minimumStock',
        message: t('validation.errors.minimumStockNumber', options.language),
        code: 'MINIMUM_STOCK_NOT_NUMBER',
        value: stock.minimumStock,
      });
    } else if (stock.minimumStock < 0) {
      acc.addError({
        field: 'minimumStock',
        message: t('validation.errors.minimumStockNegative', options.language),
        code: 'MINIMUM_STOCK_NEGATIVE',
        value: stock.minimumStock,
      });
    }

    // Validate maximumStock
    if (!isRequired(stock.maximumStock)) {
      acc.addError({
        field: 'maximumStock',
        message: t('validation.errors.maximumStockRequired', options.language),
        code: 'MAXIMUM_STOCK_REQUIRED',
        value: stock.maximumStock,
      });
    } else if (typeof stock.maximumStock !== 'number') {
      acc.addError({
        field: 'maximumStock',
        message: t('validation.errors.maximumStockNumber', options.language),
        code: 'MAXIMUM_STOCK_NOT_NUMBER',
        value: stock.maximumStock,
      });
    } else if (stock.maximumStock < 0) {
      acc.addError({
        field: 'maximumStock',
        message: t('validation.errors.maximumStockNegative', options.language),
        code: 'MAXIMUM_STOCK_NEGATIVE',
        value: stock.maximumStock,
      });
    } else if (stock.minimumStock >= stock.maximumStock) {
      acc.addError({
        field: 'maximumStock',
        message: t('validation.errors.maximumStockLessThanMinimum', options.language),
        code: 'MAXIMUM_STOCK_LESS_THAN_MINIMUM',
        value: stock.maximumStock,
        context: { minimumStock: stock.minimumStock, maximumStock: stock.maximumStock },
      });
    }

    // Validate reorderQuantity (optional)
    if (stock.reorderQuantity !== undefined && stock.reorderQuantity !== null) {
      if (typeof stock.reorderQuantity !== 'number') {
        acc.addError({
          field: 'reorderQuantity',
          message: t('validation.errors.reorderQuantityNumber', options.language),
          code: 'REORDER_QUANTITY_NOT_NUMBER',
          value: stock.reorderQuantity,
        });
      } else if (stock.reorderQuantity <= 0) {
        acc.addError({
          field: 'reorderQuantity',
          message: t('validation.errors.reorderQuantityPositive', options.language),
          code: 'REORDER_QUANTITY_NOT_POSITIVE',
          value: stock.reorderQuantity,
        });
      }
    }

    // Check low stock warning
    if (
      typeof stock.currentStock === 'number' &&
      typeof stock.minimumStock === 'number' &&
      stock.currentStock < stock.minimumStock
    ) {
      acc.addWarning({
        field: 'currentStock',
        message: t('validation.warnings.stockBelowMinimum', options.language),
        code: 'STOCK_BELOW_MINIMUM',
        value: stock.currentStock,
        context: { currentStock: stock.currentStock, minimumStock: stock.minimumStock },
      });
    }

    return acc.getResult(stock);
  } catch (error) {
    if (error instanceof ValidationStopError) {
      return acc.getResult();
    }
    throw error;
  }
}

// ============================================================================
// Tax Configuration Validation
// ============================================================================

/**
 * Validate tax configuration
 *
 * Rules:
 * - name: required, unique
 * - rate: number, 0-100
 * - type: enum (vat, gst, sales-tax, flat-fee)
 * - appliesToCategories: array of strings
 */
export function validateTaxConfig(
  config: ValidatableTaxConfig,
  options: ValidationOptions = {}
): ValidationResult {
  const acc = new ValidationAccumulator(options);

  try {
    // Validate name
    if (!isRequired(config.name)) {
      acc.addError({
        field: 'name',
        message: t('validation.errors.taxNameRequired', options.language),
        code: 'TAX_NAME_REQUIRED',
        value: config.name,
      });
    } else if (!validateStringLength(config.name, 1, 100)) {
      acc.addError({
        field: 'name',
        message: t('validation.errors.taxNameLength', options.language),
        code: 'TAX_NAME_LENGTH',
        value: config.name,
        context: { min: 1, max: 100 },
      });
    }

    // Validate rate
    if (!isRequired(config.rate)) {
      acc.addError({
        field: 'rate',
        message: t('validation.errors.taxRateRequired', options.language),
        code: 'TAX_RATE_REQUIRED',
        value: config.rate,
      });
    } else if (typeof config.rate !== 'number') {
      acc.addError({
        field: 'rate',
        message: t('validation.errors.taxRateNumber', options.language),
        code: 'TAX_RATE_NOT_NUMBER',
        value: config.rate,
      });
    } else if (!validateNumberRange(config.rate, 0, 100)) {
      acc.addError({
        field: 'rate',
        message: t('validation.errors.taxRateRange', options.language),
        code: 'TAX_RATE_OUT_OF_RANGE',
        value: config.rate,
        context: { min: 0, max: 100 },
      });
    }

    // Validate type
    const validTypes = ['vat', 'gst', 'sales-tax', 'flat-fee'];
    if (!isRequired(config.type)) {
      acc.addError({
        field: 'type',
        message: t('validation.errors.taxTypeRequired', options.language),
        code: 'TAX_TYPE_REQUIRED',
        value: config.type,
      });
    } else if (!validateEnum(config.type, validTypes)) {
      acc.addError({
        field: 'type',
        message: t('validation.errors.taxTypeInvalid', options.language),
        code: 'TAX_TYPE_INVALID',
        value: config.type,
        context: { validTypes },
      });
    }

    // Validate appliesToCategories (optional)
    if (config.appliesToCategories !== undefined && config.appliesToCategories !== null) {
      if (!Array.isArray(config.appliesToCategories)) {
        acc.addError({
          field: 'appliesToCategories',
          message: t('validation.errors.taxCategoriesArray', options.language),
          code: 'TAX_CATEGORIES_NOT_ARRAY',
          value: config.appliesToCategories,
        });
      } else {
        // Validate each category is a string
        config.appliesToCategories.forEach((category, index) => {
          if (typeof category !== 'string') {
            acc.addError({
              field: `appliesToCategories[${index}]`,
              message: t('validation.errors.taxCategoryString', options.language),
              code: 'TAX_CATEGORY_NOT_STRING',
              value: category,
              context: { index },
            });
          }
        });
      }
    }

    return acc.getResult(config);
  } catch (error) {
    if (error instanceof ValidationStopError) {
      return acc.getResult();
    }
    throw error;
  }
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate multiple items in batch
 */
export function validateBulkItems(
  items: ValidatableOrderItem[],
  options: ValidationOptions = {}
): ValidationResult[] {
  return items.map((item, index) => {
    const result = validateOrderItem(item, options);

    // Add index context to all errors and warnings
    result.errors = result.errors.map((error) => ({
      ...error,
      context: { ...error.context, bulkIndex: index },
    }));

    result.warnings = result.warnings.map((warning) => ({
      ...warning,
      context: { ...warning.context, bulkIndex: index },
    }));

    return result;
  });
}

// ============================================================================
// Price and Quantity Adjustment Validation
// ============================================================================

/**
 * Validate price adjustment
 */
export function validatePriceAdjustment(
  item: ValidatableOrderItem,
  newPrice: number,
  options: ValidationOptions = {}
): ValidationResult {
  const acc = new ValidationAccumulator(options);

  try {
    // Validate new price
    if (!isRequired(newPrice)) {
      acc.addError({
        field: 'newPrice',
        message: t('validation.errors.newPriceRequired', options.language),
        code: 'NEW_PRICE_REQUIRED',
        value: newPrice,
      });
    } else if (typeof newPrice !== 'number') {
      acc.addError({
        field: 'newPrice',
        message: t('validation.errors.newPriceNumber', options.language),
        code: 'NEW_PRICE_NOT_NUMBER',
        value: newPrice,
      });
    } else if (newPrice < 0) {
      acc.addError({
        field: 'newPrice',
        message: t('validation.errors.newPriceNegative', options.language),
        code: 'NEW_PRICE_NEGATIVE',
        value: newPrice,
      });
    } else if (!validateNumberRange(newPrice, 0, 9999999)) {
      acc.addError({
        field: 'newPrice',
        message: t('validation.errors.newPriceRange', options.language),
        code: 'NEW_PRICE_OUT_OF_RANGE',
        value: newPrice,
        context: { min: 0, max: 9999999 },
      });
    }

    // Warning for large price changes
    if (item.price && typeof newPrice === 'number') {
      const changePercent = Math.abs((newPrice - item.price) / item.price) * 100;
      if (changePercent > 50) {
        acc.addWarning({
          field: 'newPrice',
          message: t('validation.warnings.largePriceChange', options.language),
          code: 'LARGE_PRICE_CHANGE',
          value: newPrice,
          context: { oldPrice: item.price, newPrice, changePercent },
        });
      }
    }

    return acc.getResult({ ...item, price: newPrice });
  } catch (error) {
    if (error instanceof ValidationStopError) {
      return acc.getResult();
    }
    throw error;
  }
}

/**
 * Validate quantity adjustment
 */
export function validateQuantityAdjustment(
  item: ValidatableOrderItem,
  newQuantity: number,
  options: ValidationOptions = {}
): ValidationResult {
  const acc = new ValidationAccumulator(options);

  try {
    // Validate new quantity
    if (!isRequired(newQuantity)) {
      acc.addError({
        field: 'newQuantity',
        message: t('validation.errors.newQuantityRequired', options.language),
        code: 'NEW_QUANTITY_REQUIRED',
        value: newQuantity,
      });
    } else if (typeof newQuantity !== 'number' || !Number.isInteger(newQuantity)) {
      acc.addError({
        field: 'newQuantity',
        message: t('validation.errors.newQuantityInteger', options.language),
        code: 'NEW_QUANTITY_NOT_INTEGER',
        value: newQuantity,
      });
    } else if (!validateNumberRange(newQuantity, 1, 999999)) {
      acc.addError({
        field: 'newQuantity',
        message: t('validation.errors.newQuantityRange', options.language),
        code: 'NEW_QUANTITY_OUT_OF_RANGE',
        value: newQuantity,
        context: { min: 1, max: 999999 },
      });
    }

    return acc.getResult({ ...item, quantity: newQuantity });
  } catch (error) {
    if (error instanceof ValidationStopError) {
      return acc.getResult();
    }
    throw error;
  }
}

// ============================================================================
// Validation Schema Cache
// ============================================================================

/**
 * Cache for validation schemas
 */
class ValidationCache {
  private cache: Map<string, any> = new Map();
  private expirationTime = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.expirationTime) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set cached value
   */
  set(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

// Singleton cache instance
export const validationCache = new ValidationCache();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format validation errors for display
 */
export function formatValidationErrors(
  result: ValidationResult,
  options: { includeWarnings?: boolean; language?: 'th' | 'en' } = {}
): string[] {
  const messages: string[] = [];

  // Add errors
  result.errors.forEach((error) => {
    messages.push(`${error.field}: ${error.message}`);
  });

  // Add warnings if requested
  if (options.includeWarnings) {
    result.warnings.forEach((warning) => {
      messages.push(`${warning.field}: ${warning.message}`);
    });
  }

  return messages;
}

/**
 * Check if any validation errors exist
 */
export function hasValidationErrors(result: ValidationResult): boolean {
  return !result.valid || result.errors.length > 0;
}

/**
 * Get first validation error
 */
export function getFirstError(result: ValidationResult): ValidationError | null {
  return result.errors.length > 0 ? result.errors[0] : null;
}

/**
 * Get errors for specific field
 */
export function getFieldErrors(
  result: ValidationResult,
  field: string
): ValidationError[] {
  return result.errors.filter((error) => error.field === field);
}

/**
 * Merge multiple validation results
 */
export function mergeValidationResults(
  results: ValidationResult[]
): ValidationResult {
  const merged: ValidationResult = {
    valid: results.every((r) => r.valid),
    errors: [],
    warnings: [],
  };

  results.forEach((result) => {
    merged.errors.push(...result.errors);
    merged.warnings.push(...result.warnings);
  });

  return merged;
}
