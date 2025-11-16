/**
 * React Hooks for Data Validation
 *
 * Provides hooks for:
 * - Real-time validation with debouncing
 * - Form validation
 * - Field-level validation
 * - Price and quantity validation
 * - Batch validation
 * - Business rule evaluation
 *
 * Features:
 * - Automatic debouncing
 * - Dirty/touched state tracking
 * - Error message management
 * - Integration with business rules
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ValidationResult,
  ValidationOptions,
  ValidationError,
  validateOrderItem,
  validateOrder,
  validateStockLevel,
  validateTaxConfig,
  validatePriceAdjustment,
  validateQuantityAdjustment,
  validateBulkItems,
  ValidatableOrderItem,
  ValidatableOrder,
  ValidatableStockLevel,
  ValidatableTaxConfig,
} from '../utils/data-validation';
import {
  evaluateRules,
  getApplicableRules,
  ruleResultsToValidationResult,
  BusinessRule,
  RuleContext,
  RuleResult,
} from '../utils/business-rules';
import { useLanguage } from './useLanguage';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Field validation state
 */
export interface FieldValidationState {
  /** Current field value */
  value: any;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationError[];
  /** Whether field has been touched */
  touched: boolean;
  /** Whether field has been modified */
  dirty: boolean;
  /** Whether validation is in progress */
  validating: boolean;
  /** Whether field is valid */
  valid: boolean;
}

/**
 * Form validation state
 */
export interface FormValidationState<T> {
  /** Form data */
  data: T;
  /** Validation result */
  result: ValidationResult;
  /** Whether form is valid */
  valid: boolean;
  /** Whether form has been touched */
  touched: boolean;
  /** Whether form has been modified */
  dirty: boolean;
  /** Whether validation is in progress */
  validating: boolean;
  /** Field-level errors */
  fieldErrors: Record<string, ValidationError[]>;
}

/**
 * Validation hook options
 */
export interface UseValidationOptions extends ValidationOptions {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Enable business rules evaluation */
  enableBusinessRules?: boolean;
}

// ============================================================================
// useValidation Hook
// ============================================================================

/**
 * Main validation hook for objects
 *
 * @example
 * const { validate, result, validating, reset } = useValidation<Order>({
 *   debounceMs: 300,
 *   validateOnChange: true,
 * });
 *
 * const handleChange = (order: Order) => {
 *   validate(order);
 * };
 */
export function useValidation<T = any>(options: UseValidationOptions = {}) {
  const { language } = useLanguage();
  const [result, setResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const [validating, setValidating] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    debounceMs = 300,
    validateOnChange = true,
    language: optionsLanguage,
    ...validationOptions
  } = options;

  const effectiveLanguage = (optionsLanguage || (language === 'th' || language === 'en' ? language : 'en')) as 'th' | 'en';

  /**
   * Validate data immediately
   */
  const validateImmediate = useCallback(
    (data: T, validator: (data: T, opts: ValidationOptions) => ValidationResult) => {
      setValidating(true);

      try {
        const validationResult = validator(data, {
          ...validationOptions,
          language: effectiveLanguage,
        });
        setResult(validationResult);
        return validationResult;
      } finally {
        setValidating(false);
      }
    },
    [effectiveLanguage, validationOptions]
  );

  /**
   * Validate data with debouncing
   */
  const validate = useCallback(
    (data: T, validator: (data: T, opts: ValidationOptions) => ValidationResult) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set validating state immediately
      setValidating(true);

      // Debounce validation
      debounceTimer.current = setTimeout(() => {
        validateImmediate(data, validator);
      }, debounceMs);
    },
    [debounceMs, validateImmediate]
  );

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setResult({ valid: true, errors: [], warnings: [] });
    setValidating(false);
  }, []);

  /**
   * Clear validation errors
   */
  const clearErrors = useCallback(() => {
    setResult((prev) => ({ ...prev, errors: [], valid: true }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    validate,
    validateImmediate,
    result,
    validating,
    reset,
    clearErrors,
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  };
}

// ============================================================================
// useFieldValidation Hook
// ============================================================================

/**
 * Field-level validation hook
 *
 * @example
 * const priceField = useFieldValidation({
 *   initialValue: 0,
 *   validator: (value) => validatePrice(value),
 *   debounceMs: 300,
 * });
 *
 * <input
 *   value={priceField.value}
 *   onChange={(e) => priceField.setValue(parseFloat(e.target.value))}
 *   onBlur={priceField.handleBlur}
 * />
 * {priceField.errors.map(error => <div>{error.message}</div>)}
 */
export function useFieldValidation<T = any>(options: {
  initialValue: T;
  validator?: (value: T) => ValidationError | null;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}) {
  const {
    initialValue,
    validator,
    debounceMs = 300,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [value, setValueState] = useState<T>(initialValue);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [warnings, setWarnings] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [validating, setValidating] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const initialValueRef = useRef(initialValue);

  /**
   * Validate value
   */
  const validate = useCallback(
    (val: T) => {
      if (!validator) return;

      setValidating(true);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        const error = validator(val);
        if (error) {
          if (error.severity === 'error') {
            setErrors([error]);
            setWarnings([]);
          } else {
            setErrors([]);
            setWarnings([error]);
          }
        } else {
          setErrors([]);
          setWarnings([]);
        }
        setValidating(false);
      }, debounceMs);
    },
    [validator, debounceMs]
  );

  /**
   * Set field value
   */
  const setValue = useCallback(
    (newValue: T) => {
      setValueState(newValue);
      setDirty(newValue !== initialValueRef.current);

      if (validateOnChange) {
        validate(newValue);
      }
    },
    [validateOnChange, validate]
  );

  /**
   * Handle blur event
   */
  const handleBlur = useCallback(() => {
    setTouched(true);
    if (validateOnBlur) {
      validate(value);
    }
  }, [validateOnBlur, validate, value]);

  /**
   * Reset field
   */
  const reset = useCallback(() => {
    setValueState(initialValue);
    setErrors([]);
    setWarnings([]);
    setTouched(false);
    setDirty(false);
    setValidating(false);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, [initialValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const valid = errors.length === 0;

  return {
    value,
    setValue,
    errors,
    warnings,
    touched,
    dirty,
    validating,
    valid,
    handleBlur,
    reset,
  };
}

// ============================================================================
// useOrderItemValidation Hook
// ============================================================================

/**
 * Hook for validating order items
 *
 * @example
 * const { validate, result, validating } = useOrderItemValidation({
 *   debounceMs: 300,
 * });
 *
 * const item = { productName: 'Product A', quantity: 10, price: 100 };
 * validate(item);
 */
export function useOrderItemValidation(options: UseValidationOptions = {}) {
  const validation = useValidation<ValidatableOrderItem>(options);

  const validate = useCallback(
    (item: ValidatableOrderItem) => {
      return validation.validate(item, validateOrderItem);
    },
    [validation]
  );

  const validateImmediate = useCallback(
    (item: ValidatableOrderItem) => {
      return validation.validateImmediate(item, validateOrderItem);
    },
    [validation]
  );

  return {
    ...validation,
    validate,
    validateImmediate,
  };
}

// ============================================================================
// useOrderValidation Hook
// ============================================================================

/**
 * Hook for validating orders
 */
export function useOrderValidation(options: UseValidationOptions = {}) {
  const validation = useValidation<ValidatableOrder>(options);

  const validate = useCallback(
    (order: ValidatableOrder) => {
      return validation.validate(order, validateOrder);
    },
    [validation]
  );

  const validateImmediate = useCallback(
    (order: ValidatableOrder) => {
      return validation.validateImmediate(order, validateOrder);
    },
    [validation]
  );

  return {
    ...validation,
    validate,
    validateImmediate,
  };
}

// ============================================================================
// useStockValidation Hook
// ============================================================================

/**
 * Hook for validating stock levels
 */
export function useStockValidation(options: UseValidationOptions = {}) {
  const validation = useValidation<ValidatableStockLevel>(options);

  const validate = useCallback(
    (stock: ValidatableStockLevel) => {
      return validation.validate(stock, validateStockLevel);
    },
    [validation]
  );

  const validateImmediate = useCallback(
    (stock: ValidatableStockLevel) => {
      return validation.validateImmediate(stock, validateStockLevel);
    },
    [validation]
  );

  return {
    ...validation,
    validate,
    validateImmediate,
  };
}

// ============================================================================
// useTaxValidation Hook
// ============================================================================

/**
 * Hook for validating tax configurations
 */
export function useTaxValidation(options: UseValidationOptions = {}) {
  const validation = useValidation<ValidatableTaxConfig>(options);

  const validate = useCallback(
    (config: ValidatableTaxConfig) => {
      return validation.validate(config, validateTaxConfig);
    },
    [validation]
  );

  const validateImmediate = useCallback(
    (config: ValidatableTaxConfig) => {
      return validation.validateImmediate(config, validateTaxConfig);
    },
    [validation]
  );

  return {
    ...validation,
    validate,
    validateImmediate,
  };
}

// ============================================================================
// usePriceValidation Hook
// ============================================================================

/**
 * Hook for validating price changes
 *
 * @example
 * const { validatePrice, result, suggestValidPrice } = usePriceValidation();
 *
 * const item = { productName: 'Product A', quantity: 10, price: 100 };
 * const newPrice = 50;
 * validatePrice(item, newPrice);
 */
export function usePriceValidation(options: UseValidationOptions = {}) {
  const { language } = useLanguage();
  const [result, setResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const [validating, setValidating] = useState(false);

  /**
   * Validate price change
   */
  const validatePrice = useCallback(
    (item: ValidatableOrderItem, newPrice: number) => {
      setValidating(true);

      try {
        const lang = (options.language || (language === 'th' || language === 'en' ? language : 'en')) as 'th' | 'en';
        const validationResult = validatePriceAdjustment(item, newPrice, {
          ...options,
          language: lang,
        });
        setResult(validationResult);
        return validationResult;
      } finally {
        setValidating(false);
      }
    },
    [language, options]
  );

  /**
   * Suggest a valid price based on constraints
   */
  const suggestValidPrice = useCallback(
    (item: ValidatableOrderItem, desiredPrice: number): number => {
      // Ensure price is within valid range
      let validPrice = Math.max(0, Math.min(desiredPrice, 9999999));

      // Round to 2 decimal places
      validPrice = Math.round(validPrice * 100) / 100;

      return validPrice;
    },
    []
  );

  return {
    validatePrice,
    result,
    validating,
    suggestValidPrice,
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  };
}

// ============================================================================
// useQuantityValidation Hook
// ============================================================================

/**
 * Hook for validating quantity changes
 */
export function useQuantityValidation(options: UseValidationOptions = {}) {
  const { language } = useLanguage();
  const [result, setResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const [validating, setValidating] = useState(false);

  /**
   * Validate quantity change
   */
  const validateQuantity = useCallback(
    (item: ValidatableOrderItem, newQuantity: number) => {
      setValidating(true);

      try {
        const lang = (options.language || (language === 'th' || language === 'en' ? language : 'en')) as 'th' | 'en';
        const validationResult = validateQuantityAdjustment(item, newQuantity, {
          ...options,
          language: lang,
        });
        setResult(validationResult);
        return validationResult;
      } finally {
        setValidating(false);
      }
    },
    [language, options]
  );

  /**
   * Suggest a valid quantity based on constraints
   */
  const suggestValidQuantity = useCallback(
    (item: ValidatableOrderItem, desiredQuantity: number): number => {
      // Ensure quantity is integer within valid range
      let validQuantity = Math.max(1, Math.min(Math.floor(desiredQuantity), 999999));

      return validQuantity;
    },
    []
  );

  return {
    validateQuantity,
    result,
    validating,
    suggestValidQuantity,
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  };
}

// ============================================================================
// useBatchValidation Hook
// ============================================================================

/**
 * Hook for batch validation of multiple items
 */
export function useBatchValidation(options: UseValidationOptions = {}) {
  const { language } = useLanguage();
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [validating, setValidating] = useState(false);

  /**
   * Validate batch of items
   */
  const validateBatch = useCallback(
    (items: ValidatableOrderItem[]) => {
      setValidating(true);

      try {
        const lang = (options.language || (language === 'th' || language === 'en' ? language : 'en')) as 'th' | 'en';
        const batchResults = validateBulkItems(items, {
          ...options,
          language: lang,
        });
        setResults(batchResults);
        return batchResults;
      } finally {
        setValidating(false);
      }
    },
    [language, options]
  );

  /**
   * Get summary of batch validation
   */
  const summary = useMemo(() => {
    const totalItems = results.length;
    const validItems = results.filter((r) => r.valid).length;
    const invalidItems = totalItems - validItems;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      totalItems,
      validItems,
      invalidItems,
      totalErrors,
      totalWarnings,
      allValid: invalidItems === 0,
    };
  }, [results]);

  return {
    validateBatch,
    results,
    validating,
    summary,
  };
}

// ============================================================================
// useBusinessRules Hook
// ============================================================================

/**
 * Hook for evaluating business rules
 *
 * @example
 * const { evaluateEntity, results, violations } = useBusinessRules();
 *
 * const item = { productName: 'Product A', quantity: 100, price: 100 };
 * evaluateEntity(item, 'orderItem', { availableStock: 50 });
 */
export function useBusinessRules() {
  const { language } = useLanguage();
  const [results, setResults] = useState<RuleResult[]>([]);
  const [evaluating, setEvaluating] = useState(false);

  /**
   * Evaluate business rules for an entity
   */
  const evaluateEntity = useCallback(
    (
      entity: any,
      entityType: BusinessRule['entityType'],
      context?: RuleContext
    ): RuleResult[] => {
      setEvaluating(true);

      try {
        const lang = (context?.language || (language === 'th' || language === 'en' ? language : 'en')) as 'th' | 'en';
        const ruleResults = evaluateRules(entity, entityType, {
          ...context,
          language: lang,
        });
        setResults(ruleResults);
        return ruleResults;
      } finally {
        setEvaluating(false);
      }
    },
    [language]
  );

  /**
   * Get applicable rules without evaluating
   */
  const getApplicable = useCallback(
    (entity: any, entityType: BusinessRule['entityType'], context?: RuleContext) => {
      const lang = (context?.language || (language === 'th' || language === 'en' ? language : 'en')) as 'th' | 'en';
      return getApplicableRules(entity, entityType, {
        ...context,
        language: lang,
      });
    },
    [language]
  );

  /**
   * Convert to validation result
   */
  const toValidationResult = useCallback((): ValidationResult => {
    return ruleResultsToValidationResult(results);
  }, [results]);

  /**
   * Get violations only
   */
  const violations = useMemo(() => {
    return results.filter((r) => r.violated);
  }, [results]);

  /**
   * Get errors only
   */
  const errors = useMemo(() => {
    return results
      .filter((r) => r.violated && r.error && r.error.severity === 'error')
      .map((r) => r.error!);
  }, [results]);

  /**
   * Get warnings only
   */
  const warnings = useMemo(() => {
    return results
      .filter((r) => r.violated && r.error && r.error.severity === 'warning')
      .map((r) => r.error!);
  }, [results]);

  return {
    evaluateEntity,
    getApplicable,
    toValidationResult,
    results,
    violations,
    errors,
    warnings,
    evaluating,
    hasViolations: violations.length > 0,
  };
}

// ============================================================================
// useFormValidation Hook
// ============================================================================

/**
 * Hook for complete form validation with field tracking
 */
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validator: (data: T) => ValidationResult,
  options: UseValidationOptions = {}
) {
  const { language } = useLanguage();
  const [data, setData] = useState<T>(initialData);
  const [result, setResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const [touched, setTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [validating, setValidating] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef(initialData);

  const { debounceMs = 300, validateOnChange = true } = options;

  /**
   * Validate form data
   */
  const validate = useCallback(
    (formData?: T) => {
      const dataToValidate = formData || data;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      setValidating(true);

      debounceTimer.current = setTimeout(() => {
        try {
          const validationResult = validator(dataToValidate);
          setResult(validationResult);
        } finally {
          setValidating(false);
        }
      }, debounceMs);
    },
    [data, validator, debounceMs]
  );

  /**
   * Update form data
   */
  const updateData = useCallback(
    (updates: Partial<T>) => {
      const newData = { ...data, ...updates };
      setData(newData);
      setDirty(true);

      if (validateOnChange) {
        validate(newData);
      }
    },
    [data, validateOnChange, validate]
  );

  /**
   * Set field value
   */
  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      updateData({ [field]: value } as Partial<T>);
    },
    [updateData]
  );

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setData(initialData);
    setResult({ valid: true, errors: [], warnings: [] });
    setTouched(false);
    setDirty(false);
    setValidating(false);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, [initialData]);

  /**
   * Get field errors
   */
  const fieldErrors = useMemo(() => {
    const errors: Record<string, ValidationError[]> = {};
    result.errors.forEach((error) => {
      const field = error.field.split('[')[0]; // Handle array fields
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(error);
    });
    return errors;
  }, [result.errors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    data,
    setData,
    updateData,
    setFieldValue,
    validate,
    result,
    validating,
    touched,
    dirty,
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    fieldErrors,
    reset,
  };
}
