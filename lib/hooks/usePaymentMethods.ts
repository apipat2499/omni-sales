/**
 * usePaymentMethods Hook
 *
 * React hook for managing payment methods - adding, removing,
 * and setting default payment methods.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PaymentMethodRecord } from '@/lib/utils/payment-management';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentMethodsState {
  paymentMethods: PaymentMethodRecord[];
  defaultMethod: PaymentMethodRecord | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePaymentMethods(customerId?: string, autoLoad: boolean = true) {
  const [state, setState] = useState<PaymentMethodsState>({
    paymentMethods: [],
    defaultMethod: null,
    isLoading: false,
    error: null,
  });

  /**
   * Load payment methods for customer
   */
  const loadPaymentMethods = useCallback(async () => {
    if (!customerId) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/payments/methods?customerId=${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load payment methods');
      }

      const data = await response.json();
      const methods = data.paymentMethods || [];
      const defaultMethod = methods.find((m: PaymentMethodRecord) => m.isDefault) || null;

      setState({
        paymentMethods: methods,
        defaultMethod,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Load payment methods error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load payment methods',
      }));
    }
  }, [customerId]);

  /**
   * Add a new payment method
   */
  const addPaymentMethod = useCallback(
    async (
      paymentMethodId: string,
      isDefault: boolean = false
    ): Promise<{ success: boolean; error?: string }> => {
      if (!customerId) {
        return {
          success: false,
          error: 'Customer ID is required',
        };
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/payments/methods/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId,
            paymentMethodId,
            isDefault,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add payment method');
        }

        // Reload payment methods
        await loadPaymentMethods();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        return { success: true };
      } catch (error: any) {
        console.error('Add payment method error:', error);
        const errorMessage = error.message || 'Failed to add payment method';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [customerId, loadPaymentMethods]
  );

  /**
   * Remove a payment method
   */
  const removePaymentMethod = useCallback(
    async (methodId: string): Promise<{ success: boolean; error?: string }> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch(`/api/payments/methods/${methodId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove payment method');
        }

        // Reload payment methods
        await loadPaymentMethods();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        return { success: true };
      } catch (error: any) {
        console.error('Remove payment method error:', error);
        const errorMessage = error.message || 'Failed to remove payment method';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [loadPaymentMethods]
  );

  /**
   * Set default payment method
   */
  const setDefaultPaymentMethod = useCallback(
    async (methodId: string): Promise<{ success: boolean; error?: string }> => {
      if (!customerId) {
        return {
          success: false,
          error: 'Customer ID is required',
        };
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/payments/methods/default', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId,
            methodId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to set default payment method');
        }

        // Reload payment methods
        await loadPaymentMethods();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        return { success: true };
      } catch (error: any) {
        console.error('Set default payment method error:', error);
        const errorMessage = error.message || 'Failed to set default payment method';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [customerId, loadPaymentMethods]
  );

  /**
   * Refresh payment methods
   */
  const refresh = useCallback(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Get payment method display name
   */
  const getPaymentMethodDisplay = useCallback((method: PaymentMethodRecord): string => {
    if (method.type === 'card' && method.brand && method.last4) {
      return `${method.brand.toUpperCase()} •••• ${method.last4}`;
    } else if (method.type === 'bank_account' && method.bankName && method.accountLast4) {
      return `${method.bankName} •••• ${method.accountLast4}`;
    } else {
      return `${method.type} payment method`;
    }
  }, []);

  // Auto-load payment methods on mount if enabled
  useEffect(() => {
    if (autoLoad && customerId) {
      loadPaymentMethods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, customerId]);

  return {
    // State
    paymentMethods: state.paymentMethods,
    defaultMethod: state.defaultMethod,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    refresh,
    clearError,
    getPaymentMethodDisplay,
  };
}

export default usePaymentMethods;
