/**
 * usePaymentHistory Hook
 *
 * React hook for managing payment history, transaction querying,
 * refunds, and payment statistics.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PaymentRecord, PaymentFilters, PaymentStats, RefundRecord } from '@/lib/utils/payment-management';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentHistoryState {
  payments: PaymentRecord[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
}

export interface RefundRequestData {
  paymentId: string;
  amount?: number;
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'other';
  notes?: string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePaymentHistory(customerId?: string, autoLoad: boolean = true) {
  const [state, setState] = useState<PaymentHistoryState>({
    payments: [],
    isLoading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 20,
  });

  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({});

  /**
   * Load payments with optional filters
   */
  const loadPayments = useCallback(
    async (page: number = 1, pageSize: number = 20, filters?: PaymentFilters) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        // Add filters to query
        if (customerId) {
          queryParams.append('customerId', customerId);
        }

        if (filters?.status) {
          queryParams.append('status', filters.status);
        }

        if (filters?.orderId) {
          queryParams.append('orderId', filters.orderId);
        }

        if (filters?.dateFrom) {
          queryParams.append('dateFrom', filters.dateFrom.toISOString());
        }

        if (filters?.dateTo) {
          queryParams.append('dateTo', filters.dateTo.toISOString());
        }

        if (filters?.minAmount !== undefined) {
          queryParams.append('minAmount', filters.minAmount.toString());
        }

        if (filters?.maxAmount !== undefined) {
          queryParams.append('maxAmount', filters.maxAmount.toString());
        }

        if (filters?.paymentMethod) {
          queryParams.append('paymentMethod', filters.paymentMethod);
        }

        const response = await fetch(`/api/payments?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load payments');
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          payments: data.payments || [],
          total: data.total || 0,
          page,
          pageSize,
          isLoading: false,
          error: null,
        }));
      } catch (error: any) {
        console.error('Load payments error:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load payments',
        }));
      }
    },
    [customerId]
  );

  /**
   * Get a specific payment by ID
   */
  const getPayment = useCallback(async (paymentId: string): Promise<PaymentRecord | null> => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get payment');
      }

      const data = await response.json();
      return data.payment;
    } catch (error: any) {
      console.error('Get payment error:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to get payment',
      }));
      return null;
    }
  }, []);

  /**
   * Refund a payment
   */
  const refundPayment = useCallback(
    async (refundData: RefundRequestData): Promise<{ success: boolean; refund?: RefundRecord; error?: string }> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response = await fetch('/api/payments/refund', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(refundData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process refund');
        }

        const data = await response.json();

        // Reload payments to reflect the refund
        await loadPayments(state.page, state.pageSize, filters);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        return {
          success: true,
          refund: data.refund,
        };
      } catch (error: any) {
        console.error('Refund payment error:', error);
        const errorMessage = error.message || 'Failed to process refund';

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
    [loadPayments, state.page, state.pageSize, filters]
  );

  /**
   * Get payment statistics
   */
  const getPaymentStats = useCallback(
    async (dateFrom?: Date, dateTo?: Date): Promise<void> => {
      try {
        const queryParams = new URLSearchParams();

        if (customerId) {
          queryParams.append('customerId', customerId);
        }

        if (dateFrom) {
          queryParams.append('dateFrom', dateFrom.toISOString());
        }

        if (dateTo) {
          queryParams.append('dateTo', dateTo.toISOString());
        }

        const response = await fetch(`/api/payments/stats?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get payment stats');
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (error: any) {
        console.error('Get payment stats error:', error);
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to get payment stats',
        }));
      }
    },
    [customerId]
  );

  /**
   * Apply filters
   */
  const applyFilters = useCallback(
    (newFilters: PaymentFilters) => {
      setFilters(newFilters);
      loadPayments(1, state.pageSize, newFilters);
    },
    [loadPayments, state.pageSize]
  );

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    loadPayments(1, state.pageSize, {});
  }, [loadPayments, state.pageSize]);

  /**
   * Change page
   */
  const changePage = useCallback(
    (page: number) => {
      loadPayments(page, state.pageSize, filters);
    },
    [loadPayments, state.pageSize, filters]
  );

  /**
   * Change page size
   */
  const changePageSize = useCallback(
    (pageSize: number) => {
      loadPayments(1, pageSize, filters);
    },
    [loadPayments, filters]
  );

  /**
   * Refresh payments
   */
  const refresh = useCallback(() => {
    loadPayments(state.page, state.pageSize, filters);
  }, [loadPayments, state.page, state.pageSize, filters]);

  /**
   * Export payments to CSV
   */
  const exportToCSV = useCallback(() => {
    if (state.payments.length === 0) {
      return;
    }

    const headers = [
      'ID',
      'Date',
      'Customer',
      'Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Card Last 4',
      'Refunded',
    ];

    const rows = state.payments.map((payment) => [
      payment.id,
      payment.createdAt.toLocaleDateString(),
      payment.customerName,
      payment.amount.toFixed(2),
      payment.currency,
      payment.status,
      payment.paymentMethod,
      payment.last4 || 'N/A',
      payment.refunded ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [state.payments]);

  /**
   * Download receipt
   */
  const downloadReceipt = useCallback(async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/receipt`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${paymentId}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download receipt error:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to download receipt',
      }));
    }
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

  // Auto-load payments on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadPayments(1, state.pageSize, filters);
      getPaymentStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  return {
    // State
    payments: state.payments,
    isLoading: state.isLoading,
    error: state.error,
    total: state.total,
    page: state.page,
    pageSize: state.pageSize,
    stats,
    filters,

    // Actions
    loadPayments,
    getPayment,
    refundPayment,
    getPaymentStats,
    applyFilters,
    clearFilters,
    changePage,
    changePageSize,
    refresh,
    exportToCSV,
    downloadReceipt,
    clearError,
  };
}

export default usePaymentHistory;
