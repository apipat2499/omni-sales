import { useState, useCallback, useEffect } from 'react';
import {
  getAllTaxConfigs,
  getActiveTaxConfigs,
  getTaxConfigById,
  createTaxConfig,
  saveTaxConfig,
  updateTaxConfig,
  deleteTaxConfig,
  calculateTax,
  recordTaxCalculation,
  getTaxHistory,
  getTaxStatistics,
  exportTaxReport,
  getDefaultTaxConfigs,
  validateTaxConfig,
  duplicateTaxConfig,
  TaxConfig,
  TaxCalculation,
  TaxRecord,
  type TaxType,
} from '@/lib/utils/tax-calculation';
import type { OrderItem } from '@/types';

interface UseTaxCalculationOptions {
  autoSave?: boolean;
  onTaxChange?: (calculation: TaxCalculation) => void;
}

/**
 * Hook for managing tax configurations and calculations
 */
export function useTaxCalculation(options: UseTaxCalculationOptions = {}) {
  const { autoSave = true, onTaxChange } = options;

  const [taxConfigs, setTaxConfigs] = useState<TaxConfig[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);
  const [isInclusive, setIsInclusive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState(getTaxStatistics());

  // Load tax configs on mount
  useEffect(() => {
    loadTaxConfigs();
  }, []);

  const loadTaxConfigs = useCallback(() => {
    setIsLoading(true);
    try {
      const configs = getAllTaxConfigs();
      setTaxConfigs(configs);
      setStats(getTaxStatistics());
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tax configs';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewTaxConfig = useCallback(
    (taxData: Omit<TaxConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // Validate
        const validation = validateTaxConfig(taxData);
        if (!validation.valid) {
          setError(validation.errors.join(', '));
          return null;
        }

        const config = createTaxConfig(taxData);
        saveTaxConfig(config);
        loadTaxConfigs();
        return config;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create tax config';
        setError(message);
        return null;
      }
    },
    [loadTaxConfigs]
  );

  const updateExistingTaxConfig = useCallback(
    (id: string, updates: Partial<Omit<TaxConfig, 'id' | 'createdAt'>>) => {
      try {
        const updated = updateTaxConfig(id, updates);
        if (updated) {
          loadTaxConfigs();
          return updated;
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tax config';
        setError(message);
        return null;
      }
    },
    [loadTaxConfigs]
  );

  const deleteExistingTaxConfig = useCallback(
    (id: string) => {
      try {
        const success = deleteTaxConfig(id);
        if (success) {
          if (selectedTaxId === id) {
            setSelectedTaxId(null);
          }
          loadTaxConfigs();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete tax config';
        setError(message);
        return false;
      }
    },
    [selectedTaxId, loadTaxConfigs]
  );

  const toggleTaxActive = useCallback(
    (id: string) => {
      const config = getTaxConfigById(id);
      if (config) {
        return updateExistingTaxConfig(id, {
          isActive: !config.isActive,
        });
      }
      return null;
    },
    [updateExistingTaxConfig]
  );

  const calculateForItems = useCallback(
    (items: OrderItem[], configs?: TaxConfig[]) => {
      try {
        const calculation = calculateTax(items, configs, isInclusive);
        onTaxChange?.(calculation);
        return calculation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to calculate tax';
        setError(message);
        return null;
      }
    },
    [isInclusive, onTaxChange]
  );

  const duplicateExistingTaxConfig = useCallback(
    (id: string, newName?: string) => {
      try {
        const duplicated = duplicateTaxConfig(id, newName);
        if (duplicated) {
          loadTaxConfigs();
          return duplicated;
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to duplicate tax config';
        setError(message);
        return null;
      }
    },
    [loadTaxConfigs]
  );

  const recordCalculation = useCallback(
    (items: OrderItem[], notes?: string) => {
      try {
        const record = recordTaxCalculation(items, getActiveTaxConfigs(), notes);
        return record;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to record calculation';
        setError(message);
        return null;
      }
    },
    []
  );

  const getHistory = useCallback((limit?: number) => {
    try {
      return getTaxHistory(limit);
    } catch {
      return [];
    }
  }, []);

  const getReport = useCallback((startDate: Date, endDate: Date) => {
    try {
      return exportTaxReport(startDate, endDate);
    } catch {
      return null;
    }
  }, []);

  const loadDefaults = useCallback(
    (region: 'thailand' | 'us' | 'eu' | 'custom') => {
      try {
        const defaults = getDefaultTaxConfigs(region);
        defaults.forEach(saveTaxConfig);
        loadTaxConfigs();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load defaults';
        setError(message);
      }
    },
    [loadTaxConfigs]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    taxConfigs,
    activeTaxConfigs: getActiveTaxConfigs(),
    selectedTaxId,
    stats,

    // State
    isLoading,
    error,
    isInclusive,

    // Actions
    createNewTaxConfig,
    updateExistingTaxConfig,
    deleteExistingTaxConfig,
    toggleTaxActive,
    duplicateExistingTaxConfig,
    calculateForItems,
    recordCalculation,
    getHistory,
    getReport,
    loadDefaults,

    // Selection
    setSelectedTaxId,
    setIsInclusive,

    // Utility
    refresh: loadTaxConfigs,
    clearError,
  };
}

/**
 * Hook for tax configuration builder form
 */
export function useTaxConfigBuilder(initialConfig?: TaxConfig) {
  const [formData, setFormData] = useState<Omit<TaxConfig, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initialConfig?.name || '',
    type: initialConfig?.type || 'vat',
    rate: initialConfig?.rate || 7,
    isInclusive: initialConfig?.isInclusive || true,
    description: initialConfig?.description || '',
    isActive: initialConfig?.isActive || true,
    applicableItems: initialConfig?.applicableItems || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    },
    []
  );

  const validateForm = useCallback(() => {
    const validation = validateTaxConfig(formData);
    if (!validation.valid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach((err) => {
        if (err.includes('name')) newErrors.name = err;
        else if (err.includes('type')) newErrors.type = err;
        else if (err.includes('rate')) newErrors.rate = err;
      });
      setErrors(newErrors);
    }
    return validation.valid;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      name: initialConfig?.name || '',
      type: initialConfig?.type || 'vat',
      rate: initialConfig?.rate || 7,
      isInclusive: initialConfig?.isInclusive || true,
      description: initialConfig?.description || '',
      isActive: initialConfig?.isActive || true,
      applicableItems: initialConfig?.applicableItems || [],
    });
    setErrors({});
  }, [initialConfig]);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

/**
 * Hook for order tax summary
 */
export function useOrderTaxSummary(items: OrderItem[], taxConfigs?: TaxConfig[], isInclusive?: boolean) {
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    try {
      const result = calculateTax(items, taxConfigs, isInclusive);
      setCalculation(result);
    } finally {
      setIsLoading(false);
    }
  }, [items, taxConfigs, isInclusive]);

  return {
    calculation,
    isLoading,
    subtotal: calculation?.subtotal || 0,
    taxAmount: calculation?.taxAmount || 0,
    total: calculation?.total || 0,
    taxBreakdown: calculation?.taxBreakdown || [],
  };
}
