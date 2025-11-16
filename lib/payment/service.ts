import { supabase } from '@/lib/supabase/client';
import type {
  Payment,
  Invoice,
  InvoiceItem,
  Refund,
  PaymentAnalytics,
  PaymentDashboardData,
  PaymentStatus,
  InvoiceStatus,
} from '@/types';

// ============================================================================
// Invoice Management Functions
// ============================================================================

export async function getInvoices(
  userId: string,
  filters?: {
    status?: InvoiceStatus;
    customerId?: string;
    search?: string;
  }
): Promise<Invoice[]> {
  let query = supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('invoice_date', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  if (filters?.search) {
    query = query.or(`invoice_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return (data || []).map((invoice: any) => ({
    id: invoice.id,
    userId: invoice.user_id,
    orderId: invoice.order_id,
    invoiceNumber: invoice.invoice_number,
    customerId: invoice.customer_id,
    customerName: invoice.customer_name,
    customerEmail: invoice.customer_email,
    customerPhone: invoice.customer_phone,
    billingAddress: invoice.billing_address,
    shippingAddress: invoice.shipping_address,
    subtotal: parseFloat(invoice.subtotal || 0),
    tax: parseFloat(invoice.tax || 0),
    taxRate: invoice.tax_rate,
    discountAmount: parseFloat(invoice.discount_amount || 0),
    shippingCost: parseFloat(invoice.shipping_cost || 0),
    totalAmount: parseFloat(invoice.total_amount || 0),
    paidAmount: parseFloat(invoice.paid_amount || 0),
    dueAmount: parseFloat(invoice.due_amount || 0),
    status: invoice.status,
    paymentTerms: invoice.payment_terms,
    dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
    issuedDate: new Date(invoice.issued_date),
    invoiceDate: new Date(invoice.invoice_date),
    paidDate: invoice.paid_date ? new Date(invoice.paid_date) : undefined,
    notes: invoice.notes,
    termsAndConditions: invoice.terms_and_conditions,
    pdfUrl: invoice.pdf_url,
    emailSent: invoice.email_sent,
    emailSentAt: invoice.email_sent_at ? new Date(invoice.email_sent_at) : undefined,
    remindersSent: invoice.reminders_sent,
    lastReminderSentAt: invoice.last_reminder_sent_at ? new Date(invoice.last_reminder_sent_at) : undefined,
    createdAt: new Date(invoice.created_at),
    updatedAt: new Date(invoice.updated_at),
  }));
}

export async function createInvoice(
  userId: string,
  invoiceData: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    billingAddress: Record<string, any>;
    shippingAddress?: Record<string, any>;
    items: Array<{
      productId?: string;
      productName: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
      taxRate?: number;
    }>;
    taxRate?: number;
    discountAmount?: number;
    shippingCost?: number;
    notes?: string;
    paymentTerms?: string;
    dueDate?: Date;
  }
): Promise<Invoice | null> {
  try {
    // Calculate totals
    const subtotal = invoiceData.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
    }, 0);

    const tax = subtotal * ((invoiceData.taxRate || 0) / 100);
    const shipping = invoiceData.shippingCost || 0;
    const discount = invoiceData.discountAmount || 0;
    const totalAmount = subtotal + tax + shipping - discount;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const { data: invoiceData: any, error: invoiceError } = await supabase
      .from('invoices')
      .insert([
        {
          user_id: userId,
          invoice_number: invoiceNumber,
          customer_id: invoiceData.customerId,
          customer_name: invoiceData.customerName,
          customer_email: invoiceData.customerEmail,
          customer_phone: invoiceData.customerPhone,
          billing_address: invoiceData.billingAddress,
          shipping_address: invoiceData.shippingAddress || {},
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          tax_rate: invoiceData.taxRate,
          discount_amount: discount.toFixed(2),
          shipping_cost: shipping.toFixed(2),
          total_amount: totalAmount.toFixed(2),
          due_amount: totalAmount.toFixed(2),
          status: 'draft',
          payment_terms: invoiceData.paymentTerms,
          due_date: invoiceData.dueDate?.toISOString().split('T')[0],
          issued_date: new Date().toISOString().split('T')[0],
          invoice_date: new Date().toISOString().split('T')[0],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .select()
      .single();

    if (invoiceError || !invoiceData) {
      console.error('Error creating invoice:', invoiceError);
      return null;
    }

    // Add invoice items
    const items = invoiceData.items.map((item: any) => {
      const lineTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
      const taxAmount = lineTotal * ((item.taxRate || 0) / 100);
      return {
        invoice_id: invoiceData.id,
        product_id: item.productId,
        product_name: item.productName,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice.toFixed(2),
        discount_percent: item.discountPercent || 0,
        line_total: lineTotal.toFixed(2),
        tax_rate: item.taxRate,
        tax_amount: taxAmount.toFixed(2),
        created_at: new Date(),
      };
    });

    await supabase.from('invoice_items').insert(items);

    return {
      id: invoiceData.id,
      userId: invoiceData.user_id,
      orderId: invoiceData.order_id,
      invoiceNumber: invoiceData.invoice_number,
      customerId: invoiceData.customer_id,
      customerName: invoiceData.customer_name,
      customerEmail: invoiceData.customer_email,
      customerPhone: invoiceData.customer_phone,
      billingAddress: invoiceData.billing_address,
      shippingAddress: invoiceData.shipping_address,
      subtotal: parseFloat(invoiceData.subtotal || 0),
      tax: parseFloat(invoiceData.tax || 0),
      taxRate: invoiceData.tax_rate,
      discountAmount: parseFloat(invoiceData.discount_amount || 0),
      shippingCost: parseFloat(invoiceData.shipping_cost || 0),
      totalAmount: parseFloat(invoiceData.total_amount || 0),
      paidAmount: parseFloat(invoiceData.paid_amount || 0),
      dueAmount: parseFloat(invoiceData.due_amount || 0),
      status: invoiceData.status,
      paymentTerms: invoiceData.payment_terms,
      dueDate: invoiceData.due_date ? new Date(invoiceData.due_date) : undefined,
      issuedDate: new Date(invoiceData.issued_date),
      invoiceDate: new Date(invoiceData.invoice_date),
      paidDate: invoiceData.paid_date ? new Date(invoiceData.paid_date) : undefined,
      notes: invoiceData.notes,
      termsAndConditions: invoiceData.terms_and_conditions,
      pdfUrl: invoiceData.pdf_url,
      emailSent: invoiceData.email_sent,
      emailSentAt: invoiceData.email_sent_at ? new Date(invoiceData.email_sent_at) : undefined,
      remindersSent: invoiceData.reminders_sent,
      lastReminderSentAt: invoiceData.last_reminder_sent_at ? new Date(invoiceData.last_reminder_sent_at) : undefined,
      createdAt: new Date(invoiceData.created_at),
      updatedAt: new Date(invoiceData.updated_at),
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return null;
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<boolean> {
  const updateData: any = {
    status,
    updated_at: new Date(),
  };

  if (status === 'paid') {
    updateData.paid_date = new Date();
    updateData.paid_amount = supabase.rpc('get_invoice_total', { invoice_id: invoiceId });
  }

  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId);

  if (error) {
    console.error('Error updating invoice status:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Payment Management Functions
// ============================================================================

export async function getPayments(
  userId: string,
  filters?: {
    status?: PaymentStatus;
    customerId?: string;
    provider?: string;
  }
): Promise<Payment[]> {
  let query = supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  if (filters?.provider) {
    query = query.eq('provider', filters.provider);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  return (data || []).map((payment: any) => ({
    id: payment.id,
    userId: payment.user_id,
    invoiceId: payment.invoice_id,
    orderId: payment.order_id,
    customerId: payment.customer_id,
    customerName: payment.customer_name,
    customerEmail: payment.customer_email,
    paymentMethodId: payment.payment_method_id,
    paymentType: payment.payment_type,
    provider: payment.provider,
    providerTransactionId: payment.provider_transaction_id,
    amount: parseFloat(payment.amount || 0),
    currency: payment.currency,
    status: payment.status,
    paymentDate: payment.payment_date ? new Date(payment.payment_date) : undefined,
    refundStatus: payment.refund_status,
    refundAmount: payment.refund_amount ? parseFloat(payment.refund_amount) : undefined,
    refundedAt: payment.refunded_at ? new Date(payment.refunded_at) : undefined,
    description: payment.description,
    metadata: payment.metadata,
    createdAt: new Date(payment.created_at),
    updatedAt: new Date(payment.updated_at),
  }));
}

export async function recordPayment(
  userId: string,
  paymentData: {
    invoiceId?: string;
    orderId?: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    paymentType: string;
    provider: string;
    amount: number;
    currency?: string;
    providerTransactionId?: string;
    description?: string;
  }
): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .insert([
      {
        user_id: userId,
        invoice_id: paymentData.invoiceId,
        order_id: paymentData.orderId,
        customer_id: paymentData.customerId,
        customer_name: paymentData.customerName,
        customer_email: paymentData.customerEmail,
        payment_type: paymentData.paymentType,
        provider: paymentData.provider,
        provider_transaction_id: paymentData.providerTransactionId,
        amount: paymentData.amount.toFixed(2),
        currency: paymentData.currency || 'USD',
        status: 'completed',
        payment_date: new Date(),
        description: paymentData.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error recording payment:', error);
    return null;
  }

  return data
    ? {
        id: data.id,
        userId: data.user_id,
        invoiceId: data.invoice_id,
        orderId: data.order_id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        paymentMethodId: data.payment_method_id,
        paymentType: data.payment_type,
        provider: data.provider,
        providerTransactionId: data.provider_transaction_id,
        amount: parseFloat(data.amount || 0),
        currency: data.currency,
        status: data.status,
        paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
        refundStatus: data.refund_status,
        refundAmount: data.refund_amount ? parseFloat(data.refund_amount) : undefined,
        refundedAt: data.refunded_at ? new Date(data.refunded_at) : undefined,
        description: data.description,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    : null;
}

// ============================================================================
// Refund Management Functions
// ============================================================================

export async function processRefund(
  userId: string,
  refundData: {
    paymentId: string;
    invoiceId?: string;
    refundAmount: number;
    reason: string;
    notes?: string;
  }
): Promise<Refund | null> {
  const { data, error } = await supabase
    .from('refunds')
    .insert([
      {
        user_id: userId,
        payment_id: refundData.paymentId,
        invoice_id: refundData.invoiceId,
        refund_amount: refundData.refundAmount.toFixed(2),
        reason: refundData.reason,
        notes: refundData.notes,
        status: 'processing',
        requested_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error processing refund:', error);
    return null;
  }

  return data
    ? {
        id: data.id,
        userId: data.user_id,
        paymentId: data.payment_id,
        invoiceId: data.invoice_id,
        refundAmount: parseFloat(data.refund_amount || 0),
        reason: data.reason,
        status: data.status,
        providerRefundId: data.provider_refund_id,
        notes: data.notes,
        processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
        requestedAt: new Date(data.requested_at),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    : null;
}

// ============================================================================
// Payment Analytics & Dashboard Functions
// ============================================================================

export async function getPaymentDashboardData(userId: string): Promise<PaymentDashboardData> {
  try {
    const [paymentsResult, invoicesResult, refundsResult, analyticsResult] = await Promise.all([
      supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('refunds')
        .select('refund_amount')
        .eq('user_id', userId),
      supabase
        .from('payment_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('analytics_date', { ascending: false })
        .limit(7),
    ]);

    const payments = paymentsResult.data || [];
    const invoices = invoicesResult.data || [];
    const refunds = refundsResult.data || [];

    const completedPayments = payments.filter((p: any) => p.status === 'completed');
    const failedPayments = payments.filter((p: any) => p.status === 'failed');
    const pendingPayments = payments.filter((p: any) => p.status === 'pending');

    const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    const todayRevenue = completedPayments
      .filter((p: any) => {
        const paymentDate = new Date(p.payment_date).toDateString();
        const today = new Date().toDateString();
        return paymentDate === today;
      })
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);

    const totalRefunded = refunds.reduce((sum: number, r: any) => sum + parseFloat(r.refund_amount || 0), 0);

    const paidInvoices = invoices.filter((i: any) => i.status === 'paid').length;
    const unpaidInvoices = invoices.filter((i: any) => i.status === 'draft' || i.status === 'sent' || i.status === 'viewed').length;
    const overdueInvoices = invoices.filter((i: any) => {
      if (!i.due_date) return false;
      return new Date(i.due_date) < new Date() && i.status !== 'paid';
    }).length;

    const paymentSuccessRate = payments.length > 0
      ? (completedPayments.length / payments.length) * 100
      : 0;

    const averagePaymentAmount = completedPayments.length > 0
      ? totalRevenue / completedPayments.length
      : 0;

    const recentPayments = payments
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        invoiceId: p.invoice_id,
        orderId: p.order_id,
        customerId: p.customer_id,
        customerName: p.customer_name,
        customerEmail: p.customer_email,
        paymentMethodId: p.payment_method_id,
        paymentType: p.payment_type,
        provider: p.provider,
        providerTransactionId: p.provider_transaction_id,
        amount: parseFloat(p.amount || 0),
        currency: p.currency,
        status: p.status,
        paymentDate: p.payment_date ? new Date(p.payment_date) : undefined,
        refundStatus: p.refund_status,
        refundAmount: p.refund_amount ? parseFloat(p.refund_amount) : undefined,
        refundedAt: p.refunded_at ? new Date(p.refunded_at) : undefined,
        description: p.description,
        metadata: p.metadata,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }));

    const recentInvoices = invoices
      .slice(0, 10)
      .map((i: any) => ({
        id: i.id,
        userId: i.user_id,
        orderId: i.order_id,
        invoiceNumber: i.invoice_number,
        customerId: i.customer_id,
        customerName: i.customer_name,
        customerEmail: i.customer_email,
        customerPhone: i.customer_phone,
        billingAddress: i.billing_address,
        shippingAddress: i.shipping_address,
        subtotal: parseFloat(i.subtotal || 0),
        tax: parseFloat(i.tax || 0),
        taxRate: i.tax_rate,
        discountAmount: parseFloat(i.discount_amount || 0),
        shippingCost: parseFloat(i.shipping_cost || 0),
        totalAmount: parseFloat(i.total_amount || 0),
        paidAmount: parseFloat(i.paid_amount || 0),
        dueAmount: parseFloat(i.due_amount || 0),
        status: i.status,
        paymentTerms: i.payment_terms,
        dueDate: i.due_date ? new Date(i.due_date) : undefined,
        issuedDate: new Date(i.issued_date),
        invoiceDate: new Date(i.invoice_date),
        paidDate: i.paid_date ? new Date(i.paid_date) : undefined,
        notes: i.notes,
        termsAndConditions: i.terms_and_conditions,
        pdfUrl: i.pdf_url,
        emailSent: i.email_sent,
        emailSentAt: i.email_sent_at ? new Date(i.email_sent_at) : undefined,
        remindersSent: i.reminders_sent,
        lastReminderSentAt: i.last_reminder_sent_at ? new Date(i.last_reminder_sent_at) : undefined,
        createdAt: new Date(i.created_at),
        updatedAt: new Date(i.updated_at),
      }));

    const topPaymentMethods = payments.reduce((acc: Record<string, number>, p: any) => {
      acc[p.payment_type] = (acc[p.payment_type] || 0) + 1;
      return acc;
    }, {});

    const revenueByProvider = completedPayments.reduce((acc: Record<string, number>, p: any) => {
      const amount = parseFloat(p.amount || 0);
      acc[p.provider] = (acc[p.provider] || 0) + amount;
      return acc;
    }, {});

    const invoiceStatusDistribution = invoices.reduce((acc: Record<string, number>, i: any) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {});

    const paymentMethodStats = Object.entries(topPaymentMethods).map(([method, count]) => ({
      method: method as any,
      count: count as number,
      amount: completedPayments
        .filter((p: any) => p.payment_type === method)
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0),
    }));

    return {
      totalRevenue,
      todayRevenue,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      refundedAmount: totalRefunded,
      totalInvoices: invoicesResult.count || 0,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
      paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
      recentPayments,
      recentInvoices,
      topPaymentMethods,
      revenueByProvider,
      revenueTrendLastWeek: Array(7).fill(0),
      invoiceStatusDistribution,
      paymentMethodStats,
    };
  } catch (error) {
    console.error('Error fetching payment dashboard data:', error);
    return {
      totalRevenue: 0,
      todayRevenue: 0,
      pendingPayments: 0,
      failedPayments: 0,
      refundedAmount: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      unpaidInvoices: 0,
      overdueInvoices: 0,
      averagePaymentAmount: 0,
      paymentSuccessRate: 0,
      recentPayments: [],
      recentInvoices: [],
      topPaymentMethods: {},
      revenueByProvider: {},
      revenueTrendLastWeek: Array(7).fill(0),
      invoiceStatusDistribution: {},
      paymentMethodStats: [],
    };
  }
}
