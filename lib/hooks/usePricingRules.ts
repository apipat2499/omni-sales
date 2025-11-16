/**
 * usePricingRules Hook
 * Manages pricing rules state and operations
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { OrderItem, Customer } from '@/types';
import {
  getAllRules,
  getActiveRules,
  getRuleById,
  createRule as createRuleUtil,
  updateRule as updateRuleUtil,
  deleteRule as deleteRuleUtil,
  toggleRule as toggleRuleUtil,
  calculatePrice,
  getApplicableRules as getApplicableRulesUtil,
  clearPricingCache,
  getRuleStatistics,
  validateRule,
  duplicateRule as duplicateRuleUtil,
  type PricingRule,
  type PriceCalculation,
  type RuleType,
  type RuleCondition,
  type RuleAction,
} from '@/lib/utils/pricing-rules';

export interface UsePricingRulesOptions {
  autoLoad?: boolean;
  filterActive?: boolean;
  filterType?: RuleType;
}

export interface UsePricingRulesReturn {
  // State
  rules: PricingRule[];
  activeRules: PricingRule[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  createRule: (rule: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<PricingRule>;
  updateRule: (id: string, updates: Partial<Omit<PricingRule, 'id' | 'createdAt'>>) => Promise<PricingRule | null>;
  deleteRule: (id: string) => Promise<boolean>;
  toggleRule: (id: string) => Promise<PricingRule | null>;
  duplicateRule: (id: string, newName?: string) => Promise<PricingRule | null>;

  // Rule operations
  getRule: (id: string) => PricingRule | null;
  validateRule: (rule: Partial<PricingRule>) => { valid: boolean; errors: string[] };

  // Price calculations
  calculatePrice: (item: OrderItem, customer: Customer, date?: Date, coupons?: string[], orderTotal?: number) => PriceCalculation;
  getApplicableRules: (item: OrderItem, customer: Customer, date?: Date, orderTotal?: number) => PricingRule[];
  previewPrice: (item: OrderItem, customer: Customer, ruleId: string) => PriceCalculation | null;

  // Utility
  refresh: () => Promise<void>;
  clearCache: () => void;

  // Statistics
  statistics: {
    totalRules: number;
    activeRules: number;
    totalUsages: number;
    topRules: { rule: PricingRule; usages: number }[];
  };
}

/**
 * Hook for managing pricing rules
 */
export function usePricingRules(options: UsePricingRulesOptions = {}): UsePricingRulesReturn {
  const { autoLoad = true, filterActive = false, filterType } = options;

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load rules from storage
   */
  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let loadedRules = getAllRules();

      if (filterActive) {
        loadedRules = getActiveRules();
      }

      if (filterType) {
        loadedRules = loadedRules.filter((r) => r.type === filterType);
      }

      setRules(loadedRules);
    } catch (err) {
      console.error('Error loading pricing rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  }, [filterActive, filterType]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (autoLoad) {
      loadRules();
    }
  }, [autoLoad, loadRules]);

  /**
   * Get active rules
   */
  const activeRules = useMemo(() => {
    return getActiveRules();
  }, [rules]);

  /**
   * Create new rule
   */
  const createRuleHandler = useCallback(
    async (rule: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<PricingRule> => {
      try {
        setError(null);

        // Validate rule
        const validation = validateRule(rule as Partial<PricingRule>);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }

        const newRule = createRuleUtil(rule);
        await loadRules();
        return newRule;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create rule';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadRules]
  );

  /**
   * Update rule
   */
  const updateRuleHandler = useCallback(
    async (
      id: string,
      updates: Partial<Omit<PricingRule, 'id' | 'createdAt'>>
    ): Promise<PricingRule | null> => {
      try {
        setError(null);

        const updated = updateRuleUtil(id, updates);
        if (!updated) {
          throw new Error('Rule not found');
        }

        await loadRules();
        return updated;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update rule';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadRules]
  );

  /**
   * Delete rule
   */
  const deleteRuleHandler = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        const success = deleteRuleUtil(id);
        if (!success) {
          throw new Error('Rule not found');
        }

        await loadRules();
        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete rule';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadRules]
  );

  /**
   * Toggle rule active status
   */
  const toggleRuleHandler = useCallback(
    async (id: string): Promise<PricingRule | null> => {
      try {
        setError(null);

        const updated = toggleRuleUtil(id);
        if (!updated) {
          throw new Error('Rule not found');
        }

        await loadRules();
        return updated;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to toggle rule';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadRules]
  );

  /**
   * Duplicate rule
   */
  const duplicateRuleHandler = useCallback(
    async (id: string, newName?: string): Promise<PricingRule | null> => {
      try {
        setError(null);

        const duplicated = duplicateRuleUtil(id, newName);
        if (!duplicated) {
          throw new Error('Rule not found');
        }

        await loadRules();
        return duplicated;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to duplicate rule';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [loadRules]
  );

  /**
   * Get rule by ID
   */
  const getRule = useCallback((id: string): PricingRule | null => {
    return getRuleById(id);
  }, []);

  /**
   * Calculate price with rules
   */
  const calculatePriceHandler = useCallback(
    (
      item: OrderItem,
      customer: Customer,
      date: Date = new Date(),
      coupons: string[] = [],
      orderTotal?: number
    ): PriceCalculation => {
      return calculatePrice(item, customer, date, coupons, orderTotal);
    },
    []
  );

  /**
   * Get applicable rules for item and customer
   */
  const getApplicableRulesHandler = useCallback(
    (
      item: OrderItem,
      customer: Customer,
      date: Date = new Date(),
      orderTotal?: number
    ): PricingRule[] => {
      return getApplicableRulesUtil(item, customer, date, orderTotal);
    },
    []
  );

  /**
   * Preview price with a specific rule
   */
  const previewPrice = useCallback(
    (item: OrderItem, customer: Customer, ruleId: string): PriceCalculation | null => {
      const rule = getRuleById(ruleId);
      if (!rule) return null;

      // Temporarily enable the rule if it's not active
      const originalActive = rule.isActive;
      rule.isActive = true;

      const calculation = calculatePrice(item, customer);

      // Restore original state
      rule.isActive = originalActive;

      return calculation;
    },
    []
  );

  /**
   * Refresh rules
   */
  const refresh = useCallback(async () => {
    await loadRules();
  }, [loadRules]);

  /**
   * Clear price calculation cache
   */
  const clearCache = useCallback(() => {
    clearPricingCache();
  }, []);

  /**
   * Get statistics
   */
  const statistics = useMemo(() => {
    return getRuleStatistics();
  }, [rules]);

  return {
    rules,
    activeRules,
    loading,
    error,

    createRule: createRuleHandler,
    updateRule: updateRuleHandler,
    deleteRule: deleteRuleHandler,
    toggleRule: toggleRuleHandler,
    duplicateRule: duplicateRuleHandler,

    getRule,
    validateRule,

    calculatePrice: calculatePriceHandler,
    getApplicableRules: getApplicableRulesHandler,
    previewPrice,

    refresh,
    clearCache,

    statistics,
  };
}

/**
 * Hook for creating a new pricing rule with wizard state
 */
export interface RuleWizardState {
  step: number;
  rule: Partial<PricingRule>;
  errors: Record<string, string>;
}

export function useRuleWizard() {
  const [state, setState] = useState<RuleWizardState>({
    step: 1,
    rule: {
      conditions: [],
      actions: [],
      priority: 10,
      isActive: true,
      isStackable: true,
      startDate: new Date(),
    },
    errors: {},
  });

  const updateRule = useCallback((updates: Partial<PricingRule>) => {
    setState((prev) => ({
      ...prev,
      rule: { ...prev.rule, ...updates },
      errors: {},
    }));
  }, []);

  const addCondition = useCallback((condition: RuleCondition) => {
    setState((prev) => ({
      ...prev,
      rule: {
        ...prev.rule,
        conditions: [...(prev.rule.conditions || []), condition],
      },
    }));
  }, []);

  const removeCondition = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      rule: {
        ...prev.rule,
        conditions: prev.rule.conditions?.filter((_, i) => i !== index) || [],
      },
    }));
  }, []);

  const updateCondition = useCallback((index: number, updates: Partial<RuleCondition>) => {
    setState((prev) => ({
      ...prev,
      rule: {
        ...prev.rule,
        conditions:
          prev.rule.conditions?.map((c, i) => (i === index ? { ...c, ...updates } : c)) || [],
      },
    }));
  }, []);

  const addAction = useCallback((action: RuleAction) => {
    setState((prev) => ({
      ...prev,
      rule: {
        ...prev.rule,
        actions: [...(prev.rule.actions || []), action],
      },
    }));
  }, []);

  const removeAction = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      rule: {
        ...prev.rule,
        actions: prev.rule.actions?.filter((_, i) => i !== index) || [],
      },
    }));
  }, []);

  const updateAction = useCallback((index: number, updates: Partial<RuleAction>) => {
    setState((prev) => ({
      ...prev,
      rule: {
        ...prev.rule,
        actions: prev.rule.actions?.map((a, i) => (i === index ? { ...a, ...updates } : a)) || [],
      },
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: prev.step + 1 }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  }, []);

  const reset = useCallback(() => {
    setState({
      step: 1,
      rule: {
        conditions: [],
        actions: [],
        priority: 10,
        isActive: true,
        isStackable: true,
        startDate: new Date(),
      },
      errors: {},
    });
  }, []);

  const validate = useCallback((): boolean => {
    const validation = validateRule(state.rule);
    if (!validation.valid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach((error, index) => {
        errors[`error_${index}`] = error;
      });
      setState((prev) => ({ ...prev, errors }));
      return false;
    }
    return true;
  }, [state.rule]);

  return {
    state,
    updateRule,
    addCondition,
    removeCondition,
    updateCondition,
    addAction,
    removeAction,
    updateAction,
    nextStep,
    prevStep,
    reset,
    validate,
  };
}
