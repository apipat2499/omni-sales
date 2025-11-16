import { createClient } from '@supabase/supabase-js';
import { Return, ReturnItem, ReturnInspection, RefundTransaction, ReturnShipping, ReturnAnalytics, ReturnStatistics, ReturnReason } from '@/types';

let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn("Supabase environment variables not set");
      return null;
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// RETURN REASONS
export async function getReturnReasons(): Promise<ReturnReason[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('return_reasons')
      .select('*')
      .eq('is_active', true)
      .order('reason_name');

    if (error) throw error;
    return (data || []) as ReturnReason[];
  } catch (err) {
    console.error('Error fetching return reasons:', err);
    return [];
  }
}

// RETURNS MANAGEMENT
export async function initiateReturn(userId: string, returnData: Partial<Return>): Promise<Return | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Generate RMA number
    const rmaNumber = `RMA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { data, error } = await supabase
      .from('returns')
      .insert({
        user_id: userId,
        order_id: returnData.orderId,
        customer_id: returnData.customerId,
        rma_number: rmaNumber,
        return_reason_id: returnData.returnReasonId,
        reason_details: returnData.reasonDetails,
        return_status: 'pending',
        customer_notes: returnData.customerNotes,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Return;
  } catch (err) {
    console.error('Error initiating return:', err);
    return null;
  }
}

export async function getReturn(returnId: string): Promise<Return | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single();

    if (error) throw error;
    return data as Return;
  } catch (err) {
    console.error('Error fetching return:', err);
    return null;
  }
}

export async function getReturns(userId: string, status?: string): Promise<Return[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    let query = supabase
      .from('returns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('return_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Return[];
  } catch (err) {
    console.error('Error fetching returns:', err);
    return [];
  }
}

export async function authorizeReturn(userId: string, returnId: string, authorizationCode?: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('returns')
      .update({
        return_status: 'authorized',
        authorization_code: authorizationCode || `AUTH-${Date.now()}`,
        authorized_at: new Date(),
        authorized_by: userId,
        updated_at: new Date(),
      })
      .eq('id', returnId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error authorizing return:', err);
    return false;
  }
}

export async function updateReturnStatus(returnId: string, newStatus: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('returns')
      .update({
        return_status: newStatus,
        updated_at: new Date(),
      })
      .eq('id', returnId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating return status:', err);
    return false;
  }
}

// RETURN ITEMS
export async function addReturnItem(returnId: string, itemData: Partial<ReturnItem>): Promise<ReturnItem | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('return_items')
      .insert({
        return_id: returnId,
        order_item_id: itemData.orderItemId,
        product_id: itemData.productId,
        product_name: itemData.productName,
        quantity_returned: itemData.quantityReturned,
        inspection_status: 'pending',
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReturnItem;
  } catch (err) {
    console.error('Error adding return item:', err);
    return null;
  }
}

export async function getReturnItems(returnId: string): Promise<ReturnItem[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('return_items')
      .select('*')
      .eq('return_id', returnId);

    if (error) throw error;
    return (data || []) as ReturnItem[];
  } catch (err) {
    console.error('Error fetching return items:', err);
    return [];
  }
}

export async function updateReturnItemCondition(itemId: string, condition: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('return_items')
      .update({
        item_condition: condition,
      })
      .eq('id', itemId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating return item condition:', err);
    return false;
  }
}

// RETURN INSPECTIONS
export async function createReturnInspection(returnItemId: string, inspectionData: Partial<ReturnInspection>): Promise<ReturnInspection | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('return_inspections')
      .insert({
        return_item_id: returnItemId,
        inspection_date: new Date(),
        inspector_name: inspectionData.inspectorName,
        condition_assessment: inspectionData.conditionAssessment,
        is_resellable: inspectionData.isResellable,
        damages_found: inspectionData.damagesFound,
        photos_url: inspectionData.photosUrl,
        inspection_result: inspectionData.inspectionResult,
        notes: inspectionData.notes,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update return item inspection status
    await supabase
      .from('return_items')
      .update({ inspection_status: 'completed' })
      .eq('id', returnItemId);

    return data as ReturnInspection;
  } catch (err) {
    console.error('Error creating return inspection:', err);
    return null;
  }
}

export async function getReturnInspections(returnItemId: string): Promise<ReturnInspection[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('return_inspections')
      .select('*')
      .eq('return_item_id', returnItemId)
      .order('inspection_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ReturnInspection[];
  } catch (err) {
    console.error('Error fetching return inspections:', err);
    return [];
  }
}

// REFUND TRANSACTIONS
export async function processRefund(userId: string, returnId: string, refundData: Partial<RefundTransaction>): Promise<RefundTransaction | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('refund_transactions')
      .insert({
        user_id: userId,
        return_id: returnId,
        order_payment_id: refundData.orderPaymentId,
        refund_amount: refundData.refundAmount,
        refund_method: refundData.refundMethod,
        payment_method: refundData.paymentMethod,
        refund_status: 'approved',
        processed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update return refund status
    await supabase
      .from('returns')
      .update({
        refund_status: 'processed',
        refund_processed_at: new Date(),
        refund_amount: refundData.refundAmount,
        updated_at: new Date(),
      })
      .eq('id', returnId);

    return data as RefundTransaction;
  } catch (err) {
    console.error('Error processing refund:', err);
    return null;
  }
}

export async function getRefundTransaction(returnId: string): Promise<RefundTransaction | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('refund_transactions')
      .select('*')
      .eq('return_id', returnId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as RefundTransaction | null;
  } catch (err) {
    console.error('Error fetching refund transaction:', err);
    return null;
  }
}

export async function getRefundTransactions(userId: string): Promise<RefundTransaction[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('refund_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RefundTransaction[];
  } catch (err) {
    console.error('Error fetching refund transactions:', err);
    return [];
  }
}

// RETURN SHIPPING
export async function setupReturnShipping(returnId: string, shippingData: Partial<ReturnShipping>): Promise<ReturnShipping | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('return_shipping')
      .insert({
        return_id: returnId,
        outbound_carrier: shippingData.outboundCarrier,
        outbound_tracking_number: shippingData.outboundTrackingNumber,
        is_prepaid: shippingData.isPrepaid || false,
        shipping_label_url: shippingData.shippingLabelUrl,
        return_instructions_url: shippingData.returnInstructionsUrl,
        shipping_status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update return status
    await supabase
      .from('returns')
      .update({
        return_status: 'awaiting_return',
        updated_at: new Date(),
      })
      .eq('id', returnId);

    return data as ReturnShipping;
  } catch (err) {
    console.error('Error setting up return shipping:', err);
    return null;
  }
}

export async function updateReturnShipping(returnShippingId: string, updates: Partial<ReturnShipping>): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('return_shipping')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('id', returnShippingId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating return shipping:', err);
    return false;
  }
}

export async function getReturnShipping(returnId: string): Promise<ReturnShipping | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('return_shipping')
      .select('*')
      .eq('return_id', returnId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ReturnShipping | null;
  } catch (err) {
    console.error('Error fetching return shipping:', err);
    return null;
  }
}

// RETURN ANALYTICS
export async function recordReturnAnalytics(userId: string, analyticsData: Partial<ReturnAnalytics>): Promise<ReturnAnalytics | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('return_analytics')
      .insert({
        user_id: userId,
        period_start_date: analyticsData.periodStartDate,
        period_end_date: analyticsData.periodEndDate,
        total_returns: analyticsData.totalReturns || 0,
        total_return_value: analyticsData.totalReturnValue,
        total_refunded: analyticsData.totalRefunded,
        return_rate: analyticsData.returnRate,
        average_days_to_return: analyticsData.averageDaysToReturn,
        average_days_to_refund: analyticsData.averageDaysToRefund,
        resellable_items: analyticsData.resellableItems,
        unrepairable_items: analyticsData.unreparableItems,
        restocking_fees_collected: analyticsData.restockingFeesCollected,
        top_return_reason: analyticsData.topReturnReason,
        refund_method_breakdown: analyticsData.refundMethodBreakdown,
        return_by_category: analyticsData.returnByCategory,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReturnAnalytics;
  } catch (err) {
    console.error('Error recording return analytics:', err);
    return null;
  }
}

export async function getReturnAnalytics(userId: string, days: number = 30): Promise<ReturnAnalytics[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('return_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start_date', startDate.toISOString())
      .order('period_start_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ReturnAnalytics[];
  } catch (err) {
    console.error('Error fetching return analytics:', err);
    return [];
  }
}

// RETURN STATISTICS
export async function getReturnStatistics(userId: string): Promise<ReturnStatistics | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Get pending returns count
    const { data: pendingData } = await supabase
      .from('returns')
      .select('id')
      .eq('user_id', userId)
      .eq('return_status', 'pending');

    const pendingReturns = pendingData?.length || 0;

    // Get pending refunds count
    const { data: pendingRefundsData } = await supabase
      .from('refund_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('refund_status', 'pending');

    const pendingRefunds = pendingRefundsData?.length || 0;

    // Get all returns for statistics
    const { data: allReturns } = await supabase
      .from('returns')
      .select('*')
      .eq('user_id', userId);

    if (!allReturns || allReturns.length === 0) {
      return {
        totalReturns: 0,
        totalReturnValue: 0,
        returnRate: 0,
        averageRefundAmount: 0,
        averageDaysToRefund: 0,
        resellablePercentage: 0,
        mostCommonReason: 'N/A',
        pendingReturns,
        pendingRefunds,
      };
    }

    // Calculate statistics
    const totalReturns = allReturns.length;
    const totalReturnValue = allReturns.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    const averageRefundAmount = totalReturnValue / totalReturns;

    // Calculate days to refund
    const refundedReturns = allReturns.filter(r => r.refund_processed_at);
    const daysToRefund = refundedReturns.length > 0
      ? refundedReturns.reduce((sum, r) => {
          const created = new Date(r.created_at);
          const processed = new Date(r.refund_processed_at);
          return sum + Math.floor((processed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / refundedReturns.length
      : 0;

    return {
      totalReturns,
      totalReturnValue,
      returnRate: 0, // Would need order count to calculate
      averageRefundAmount,
      averageDaysToRefund: Math.floor(daysToRefund),
      resellablePercentage: 0, // Would need inspection data
      mostCommonReason: 'Multiple', // Would need aggregation
      pendingReturns,
      pendingRefunds,
    };
  } catch (err) {
    console.error('Error fetching return statistics:', err);
    return null;
  }
}

// APPROVE/REJECT RETURNS
export async function approveReturn(returnId: string, refundAmount?: number, restockingFeePercentage?: number): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const restockingFee = refundAmount && restockingFeePercentage
      ? (refundAmount * restockingFeePercentage) / 100
      : 0;

    const { error } = await supabase
      .from('returns')
      .update({
        return_status: 'approved',
        refund_amount: refundAmount ? refundAmount - restockingFee : refundAmount,
        restocking_fee_applied: restockingFee,
        restocking_fee_percentage: restockingFeePercentage,
        updated_at: new Date(),
      })
      .eq('id', returnId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error approving return:', err);
    return false;
  }
}

export async function rejectReturn(returnId: string, reason: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('returns')
      .update({
        return_status: 'rejected',
        notes: reason,
        updated_at: new Date(),
      })
      .eq('id', returnId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error rejecting return:', err);
    return false;
  }
}
