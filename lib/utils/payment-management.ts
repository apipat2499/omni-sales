/**
 * Payment Management Utility
 *
 * Handles payment record management, transaction history, payment status tracking,
 * and receipt generation using Supabase.
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import type { Payment, PaymentMethod as DbPaymentMethod, PaymentStatus } from '@/types';
import { formatAmount } from './payment-stripe';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentRecord {
  id: string;
  orderId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;

  // Stripe Info
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeCustomerId?: string;
  paymentMethod: 'card' | 'wallet' | 'bank_transfer' | 'ach';

  // Card Details
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;

  // Billing Info
  billingEmail: string;
  billingAddress: BillingAddress;

  // Transaction Details
  createdAt: Date;
  paidAt?: Date;
  failureReason?: string;
  failureCode?: string;
  receiptUrl?: string;

  // Refund Info
  refunded: boolean;
  refundAmount?: number;
  refundedAt?: Date;
  refundReason?: string;

  metadata?: Record<string, any>;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethodRecord {
  id: string;
  customerId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'wallet' | 'bank_account';

  // Card Info
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;

  // Bank Account Info
  bankName?: string;
  accountLast4?: string;

  isDefault: boolean;
  createdAt: Date;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  amount: number;
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'other';
  status: 'pending' | 'succeeded' | 'failed';
  stripeRefundId: string;
  notes?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  totalRefunded: number;
  averageAmount: number;
  successRate: number;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  customerId?: string;
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
}

// ============================================================================
// Payment CRUD Operations
// ============================================================================

/**
 * Create a new payment record
 */
export async function createPaymentRecord(
  payment: Omit<PaymentRecord, 'id' | 'createdAt'>
): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          user_id: payment.customerId,
          order_id: payment.orderId,
          customer_id: payment.customerId,
          customer_name: payment.customerName,
          customer_email: payment.customerEmail,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          payment_type: payment.paymentMethod,
          provider: 'stripe',
          provider_transaction_id: payment.stripePaymentIntentId,
          payment_date: payment.paidAt || null,
          refund_status: payment.refunded ? 'refunded' : 'none',
          refund_amount: payment.refundAmount,
          refunded_at: payment.refundedAt,
          description: payment.receiptUrl ? `Receipt: ${payment.receiptUrl}` : null,
          metadata: {
            stripeChargeId: payment.stripeChargeId,
            stripeCustomerId: payment.stripeCustomerId,
            last4: payment.last4,
            brand: payment.brand,
            expiryMonth: payment.expiryMonth,
            expiryYear: payment.expiryYear,
            billingEmail: payment.billingEmail,
            billingAddress: payment.billingAddress,
            failureReason: payment.failureReason,
            failureCode: payment.failureCode,
            receiptUrl: payment.receiptUrl,
            refundReason: payment.refundReason,
            ...payment.metadata,
          },
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment record:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      payment: dbToPaymentRecord(data),
    };
  } catch (error: any) {
    console.error('Payment record creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment record',
    };
  }
}

/**
 * Get a payment record by ID
 */
export async function getPaymentRecord(
  paymentId: string
): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      console.error('Error fetching payment record:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Payment not found' };
    }

    return {
      success: true,
      payment: dbToPaymentRecord(data),
    };
  } catch (error: any) {
    console.error('Payment record retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve payment record',
    };
  }
}

/**
 * Get payment records with filters
 */
export async function getPaymentRecords(
  filters?: PaymentFilters,
  limit: number = 50,
  offset: number = 0
): Promise<{ success: boolean; payments?: PaymentRecord[]; total?: number; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    let query = supabase.from('payments').select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters?.orderId) {
      query = query.eq('order_id', filters.orderId);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    if (filters?.minAmount !== undefined) {
      query = query.gte('amount', filters.minAmount);
    }

    if (filters?.maxAmount !== undefined) {
      query = query.lte('amount', filters.maxAmount);
    }

    if (filters?.paymentMethod) {
      query = query.eq('payment_type', filters.paymentMethod);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching payment records:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      payments: (data || []).map(dbToPaymentRecord),
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Payment records retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve payment records',
    };
  }
}

/**
 * Update payment record
 */
export async function updatePaymentRecord(
  paymentId: string,
  updates: Partial<PaymentRecord>
): Promise<{ success: boolean; payment?: PaymentRecord; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status) updateData.status = updates.status;
    if (updates.paidAt) updateData.payment_date = updates.paidAt.toISOString();
    if (updates.failureReason) {
      updateData.metadata = { failureReason: updates.failureReason, failureCode: updates.failureCode };
    }
    if (updates.refunded !== undefined) {
      updateData.refund_status = updates.refunded ? 'refunded' : 'none';
    }
    if (updates.refundAmount !== undefined) {
      updateData.refund_amount = updates.refundAmount;
    }
    if (updates.refundedAt) {
      updateData.refunded_at = updates.refundedAt.toISOString();
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment record:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      payment: dbToPaymentRecord(data),
    };
  } catch (error: any) {
    console.error('Payment record update error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment record',
    };
  }
}

/**
 * Delete payment record (soft delete)
 */
export async function deletePaymentRecord(
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment record:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Payment record deletion error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete payment record',
    };
  }
}

// ============================================================================
// Payment Method Management
// ============================================================================

/**
 * Save payment method
 */
export async function savePaymentMethod(
  method: Omit<PaymentMethodRecord, 'id' | 'createdAt'>
): Promise<{ success: boolean; paymentMethod?: PaymentMethodRecord; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    // If this is set as default, unset other defaults
    if (method.isDefault) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('customer_id', method.customerId);
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert([
        {
          customer_id: method.customerId,
          stripe_payment_method_id: method.stripePaymentMethodId,
          type: method.type,
          last4: method.last4,
          brand: method.brand,
          expiry_month: method.expiryMonth,
          expiry_year: method.expiryYear,
          bank_name: method.bankName,
          account_last4: method.accountLast4,
          is_default: method.isDefault,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving payment method:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      paymentMethod: dbToPaymentMethodRecord(data),
    };
  } catch (error: any) {
    console.error('Payment method save error:', error);
    return {
      success: false,
      error: error.message || 'Failed to save payment method',
    };
  }
}

/**
 * Get payment methods for customer
 */
export async function getPaymentMethods(
  customerId: string
): Promise<{ success: boolean; paymentMethods?: PaymentMethodRecord[]; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      paymentMethods: (data || []).map(dbToPaymentMethodRecord),
    };
  } catch (error: any) {
    console.error('Payment methods retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve payment methods',
    };
  }
}

/**
 * Delete payment method
 */
export async function deletePaymentMethod(
  methodId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodId);

    if (error) {
      console.error('Error deleting payment method:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Payment method deletion error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete payment method',
    };
  }
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  methodId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    // Unset all defaults for this customer
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('customer_id', customerId);

    // Set the new default
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', methodId);

    if (error) {
      console.error('Error setting default payment method:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Default payment method error:', error);
    return {
      success: false,
      error: error.message || 'Failed to set default payment method',
    };
  }
}

// ============================================================================
// Refund Management
// ============================================================================

/**
 * Create refund record
 */
export async function createRefundRecord(
  refund: Omit<RefundRecord, 'id' | 'createdAt'>
): Promise<{ success: boolean; refund?: RefundRecord; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const { data, error } = await supabase
      .from('refunds')
      .insert([
        {
          payment_id: refund.paymentId,
          refund_amount: refund.amount,
          reason: refund.reason,
          status: refund.status,
          provider_refund_id: refund.stripeRefundId,
          notes: refund.notes,
          processed_at: refund.processedAt?.toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating refund record:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      refund: dbToRefundRecord(data),
    };
  } catch (error: any) {
    console.error('Refund record creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create refund record',
    };
  }
}

/**
 * Get refunds for payment
 */
export async function getRefunds(
  paymentId: string
): Promise<{ success: boolean; refunds?: RefundRecord[]; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching refunds:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      refunds: (data || []).map(dbToRefundRecord),
    };
  } catch (error: any) {
    console.error('Refunds retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve refunds',
    };
  }
}

// ============================================================================
// Statistics & Analytics
// ============================================================================

/**
 * Calculate payment statistics
 */
export async function getPaymentStats(
  customerId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{ success: boolean; stats?: PaymentStats; error?: string }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  try {
    let query = supabase.from('payments').select('*');

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom.toISOString());
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error calculating payment stats:', error);
      return { success: false, error: error.message };
    }

    const payments = data || [];
    const totalPayments = payments.length;
    const successfulPayments = payments.filter((p: any) => p.status === 'completed').length;
    const failedPayments = payments.filter((p: any) => p.status === 'failed').length;
    const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
    const refundedPayments = payments.filter((p: any) => p.refund_status === 'refunded').length;

    const totalAmount = payments.reduce((sum: number, p: any) => {
      if (p.status === 'completed') {
        return sum + parseFloat(p.amount || 0);
      }
      return sum;
    }, 0);

    const totalRefunded = payments.reduce((sum: number, p: any) => {
      if (p.refund_amount) {
        return sum + parseFloat(p.refund_amount);
      }
      return sum;
    }, 0);

    const averageAmount = successfulPayments > 0 ? totalAmount / successfulPayments : 0;
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    return {
      success: true,
      stats: {
        totalPayments,
        totalAmount,
        successfulPayments,
        failedPayments,
        pendingPayments,
        refundedPayments,
        totalRefunded,
        averageAmount,
        successRate,
      },
    };
  } catch (error: any) {
    console.error('Payment stats calculation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate payment stats',
    };
  }
}

// ============================================================================
// Receipt Generation
// ============================================================================

/**
 * Generate receipt text
 */
export function generateReceiptText(payment: PaymentRecord): string {
  const lines = [
    '========================================',
    '           PAYMENT RECEIPT',
    '========================================',
    '',
    `Receipt ID: ${payment.id}`,
    `Date: ${payment.paidAt?.toLocaleString() || payment.createdAt.toLocaleString()}`,
    '',
    '========================================',
    '           CUSTOMER DETAILS',
    '========================================',
    '',
    `Name: ${payment.customerName}`,
    `Email: ${payment.customerEmail || 'N/A'}`,
    '',
    '========================================',
    '          PAYMENT DETAILS',
    '========================================',
    '',
    `Amount: ${formatAmount(payment.amount, payment.currency)}`,
    `Payment Method: ${payment.paymentMethod}`,
    payment.brand && payment.last4 ? `Card: ${payment.brand.toUpperCase()} ending in ${payment.last4}` : '',
    `Status: ${payment.status.toUpperCase()}`,
    '',
    '========================================',
    '         BILLING ADDRESS',
    '========================================',
    '',
    `${payment.billingAddress.line1}`,
    payment.billingAddress.line2 || '',
    `${payment.billingAddress.city}, ${payment.billingAddress.state} ${payment.billingAddress.postalCode}`,
    `${payment.billingAddress.country}`,
    '',
    payment.refunded
      ? [
          '========================================',
          '            REFUND INFO',
          '========================================',
          '',
          `Refund Amount: ${formatAmount(payment.refundAmount || 0, payment.currency)}`,
          `Refund Date: ${payment.refundedAt?.toLocaleString() || 'N/A'}`,
          `Reason: ${payment.refundReason || 'N/A'}`,
          '',
        ].join('\n')
      : '',
    '========================================',
    'Thank you for your payment!',
    '========================================',
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Generate receipt URL (placeholder for PDF generation)
 */
export async function generateReceiptUrl(paymentId: string): Promise<string> {
  // In a real implementation, this would generate a PDF and upload to storage
  // For now, return a placeholder URL
  return `/api/payments/${paymentId}/receipt`;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert database payment to PaymentRecord
 */
function dbToPaymentRecord(data: any): PaymentRecord {
  const metadata = data.metadata || {};

  return {
    id: data.id,
    orderId: data.order_id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    amount: parseFloat(data.amount || 0),
    currency: data.currency || 'USD',
    status: data.status,
    stripePaymentIntentId: data.provider_transaction_id,
    stripeChargeId: metadata.stripeChargeId,
    stripeCustomerId: metadata.stripeCustomerId,
    paymentMethod: data.payment_type || 'card',
    last4: metadata.last4,
    brand: metadata.brand,
    expiryMonth: metadata.expiryMonth,
    expiryYear: metadata.expiryYear,
    billingEmail: metadata.billingEmail || data.customer_email,
    billingAddress: metadata.billingAddress || {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    createdAt: new Date(data.created_at),
    paidAt: data.payment_date ? new Date(data.payment_date) : undefined,
    failureReason: metadata.failureReason,
    failureCode: metadata.failureCode,
    receiptUrl: metadata.receiptUrl,
    refunded: data.refund_status === 'refunded',
    refundAmount: data.refund_amount ? parseFloat(data.refund_amount) : undefined,
    refundedAt: data.refunded_at ? new Date(data.refunded_at) : undefined,
    refundReason: metadata.refundReason,
    metadata,
  };
}

/**
 * Convert database payment method to PaymentMethodRecord
 */
function dbToPaymentMethodRecord(data: any): PaymentMethodRecord {
  return {
    id: data.id,
    customerId: data.customer_id,
    stripePaymentMethodId: data.stripe_payment_method_id,
    type: data.type || 'card',
    last4: data.last4,
    brand: data.brand,
    expiryMonth: data.expiry_month,
    expiryYear: data.expiry_year,
    bankName: data.bank_name,
    accountLast4: data.account_last4,
    isDefault: data.is_default || false,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Convert database refund to RefundRecord
 */
function dbToRefundRecord(data: any): RefundRecord {
  return {
    id: data.id,
    paymentId: data.payment_id,
    amount: parseFloat(data.refund_amount || 0),
    reason: data.reason || 'other',
    status: data.status || 'pending',
    stripeRefundId: data.provider_refund_id,
    notes: data.notes,
    createdAt: new Date(data.created_at),
    processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
  };
}
