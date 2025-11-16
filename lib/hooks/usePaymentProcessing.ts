/**
 * usePaymentProcessing Hook
 *
 * React hook for managing payment processing state, creating payment intents,
 * processing payments, and handling errors.
 */

'use client';

import { useState, useCallback } from 'react';
import type { BillingAddress } from '@/lib/utils/payment-management';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  paymentMethod?: string;
}

export interface ProcessPaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export interface PaymentProcessingState {
  paymentIntent: PaymentIntent | null;
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  paymentId: string | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePaymentProcessing() {
  const [state, setState] = useState<PaymentProcessingState>({
    paymentIntent: null,
    isProcessing: false,
    isLoading: false,
    error: null,
    success: false,
    paymentId: null,
  });

  /**
   * Create a payment intent
   */
  const createPaymentIntent = useCallback(
    async (
      orderId: string,
      amount: number,
      currency: string = 'USD',
      customerId?: string
    ): Promise<void> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        success: false,
      }));

      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            amount,
            currency,
            customerId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Payment intent creation failed');
        }

        setState((prev) => ({
          ...prev,
          paymentIntent: {
            id: data.paymentIntentId,
            amount,
            currency,
            status: 'pending',
            clientSecret: data.clientSecret,
          },
          isLoading: false,
          error: null,
        }));
      } catch (error: any) {
        console.error('Payment intent creation error:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to create payment intent',
        }));
      }
    },
    []
  );

  /**
   * Process a payment
   */
  const processPayment = useCallback(
    async (
      paymentMethodId: string,
      billingInfo: BillingAddress & { email: string; name: string }
    ): Promise<ProcessPaymentResult> => {
      if (!state.paymentIntent) {
        const error = 'No payment intent found. Please create a payment intent first.';
        setState((prev) => ({ ...prev, error }));
        return { success: false, error };
      }

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        success: false,
      }));

      try {
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: state.paymentIntent.id,
            paymentMethodId,
            billingInfo,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment processing failed');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Payment processing failed');
        }

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          success: true,
          paymentId: data.paymentId,
          error: null,
        }));

        return {
          success: true,
          paymentId: data.paymentId,
        };
      } catch (error: any) {
        console.error('Payment processing error:', error);
        const errorMessage = error.message || 'Payment processing failed';

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
          success: false,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [state.paymentIntent]
  );

  /**
   * Confirm a payment (for 3D Secure, etc.)
   */
  const confirmPayment = useCallback(async (): Promise<ProcessPaymentResult> => {
    if (!state.paymentIntent) {
      const error = 'No payment intent found';
      setState((prev) => ({ ...prev, error }));
      return { success: false, error };
    }

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: state.paymentIntent.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment confirmation failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment confirmation failed');
      }

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        success: true,
        paymentId: data.paymentId,
        error: null,
      }));

      return {
        success: true,
        paymentId: data.paymentId,
      };
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      const errorMessage = error.message || 'Payment confirmation failed';

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [state.paymentIntent]);

  /**
   * Cancel a payment intent
   */
  const cancelPayment = useCallback(async (): Promise<boolean> => {
    if (!state.paymentIntent) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: state.paymentIntent.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment cancellation failed');
      }

      setState((prev) => ({
        ...prev,
        paymentIntent: null,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (error: any) {
      console.error('Payment cancellation error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Payment cancellation failed',
      }));
      return false;
    }
  }, [state.paymentIntent]);

  /**
   * Get payment status
   */
  const getPaymentStatus = useCallback(
    async (paymentId: string): Promise<{ success: boolean; status?: string; error?: string }> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch(`/api/payments/${paymentId}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get payment status');
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        return {
          success: true,
          status: data.status,
        };
      } catch (error: any) {
        console.error('Payment status error:', error);
        const errorMessage = error.message || 'Failed to get payment status';

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
    []
  );

  /**
   * Reset payment state
   */
  const resetPaymentState = useCallback(() => {
    setState({
      paymentIntent: null,
      isProcessing: false,
      isLoading: false,
      error: null,
      success: false,
      paymentId: null,
    });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    // State
    paymentIntent: state.paymentIntent,
    isProcessing: state.isProcessing,
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
    paymentId: state.paymentId,

    // Actions
    createPaymentIntent,
    processPayment,
    confirmPayment,
    cancelPayment,
    getPaymentStatus,
    resetPaymentState,
    clearError,
  };
}

export default usePaymentProcessing;
