import { supabase } from '@/lib/supabase/client';
import {
  OrderWithDetails,
  OrderPayment,
  OrderShipping,
  OrderReturn,
  Refund,
  FulfillmentTask,
} from '@/types';

/**
 * Order Management Service
 * Handles order CRUD, payments, shipping, returns, and fulfillment
 */

/**
 * Get complete order with all related data
 */
export async function getOrderWithDetails(orderId: string): Promise<OrderWithDetails | null> {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          products (id, name, sku)
        ),
        order_payments (*),
        order_shipping (*),
        order_returns (
          *,
          return_items (*)
        ),
        refunds (*),
        order_discounts (*),
        order_status_history (*),
        fulfillment_tasks (*)
      `
      )
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return order;
  } catch (error) {
    console.error('Error in getOrderWithDetails:', error);
    return null;
  }
}

/**
 * Update order status and create history record
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  reason?: string,
  notes?: string,
  changedBy?: string
): Promise<boolean> {
  try {
    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return false;
    }

    // Create status history record
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: newStatus,
        reason,
        notes,
        changed_by: changedBy,
      });

    if (historyError) {
      console.error('Error creating status history:', historyError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return false;
  }
}

/**
 * Record order payment
 */
export async function recordOrderPayment(
  orderId: string,
  payment: {
    paymentMethod: string;
    amount: number;
    currency?: string;
    transactionId?: string;
    gatewayResponse?: Record<string, any>;
  }
): Promise<OrderPayment | null> {
  try {
    const { data: paymentRecord, error } = await supabase
      .from('order_payments')
      .insert({
        order_id: orderId,
        payment_method: payment.paymentMethod,
        amount: payment.amount,
        currency: payment.currency || 'USD',
        payment_status: 'completed',
        transaction_id: payment.transactionId,
        gateway_response: payment.gatewayResponse,
        paid_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording payment:', error);
      return null;
    }

    // Update order status to paid if full payment
    const { data: order } = await supabase
      .from('orders')
      .select('total')
      .eq('id', orderId)
      .single();

    if (order && payment.amount >= order.total) {
      await updateOrderStatus(orderId, 'paid', 'Payment received');
    }

    return paymentRecord;
  } catch (error) {
    console.error('Error in recordOrderPayment:', error);
    return null;
  }
}

/**
 * Create shipping record for order
 */
export async function createShipping(
  orderId: string,
  shipping: {
    shippingMethod?: string;
    carrier?: string;
    trackingNumber?: string;
    shippingAddress: string;
    weightKg?: number;
    dimensionsCm?: string;
    signatureRequired?: boolean;
    specialInstructions?: string;
  }
): Promise<OrderShipping | null> {
  try {
    const { data: shippingRecord, error } = await supabase
      .from('order_shipping')
      .insert({
        order_id: orderId,
        shipping_method: shipping.shippingMethod,
        carrier: shipping.carrier,
        tracking_number: shipping.trackingNumber,
        shipping_address: shipping.shippingAddress,
        weight_kg: shipping.weightKg,
        dimensions_cm: shipping.dimensionsCm,
        shipping_status: 'pending',
        signature_required: shipping.signatureRequired || false,
        special_instructions: shipping.specialInstructions,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shipping:', error);
      return null;
    }

    return shippingRecord;
  } catch (error) {
    console.error('Error in createShipping:', error);
    return null;
  }
}

/**
 * Update shipping status
 */
export async function updateShippingStatus(
  shippingId: string,
  status: string,
  trackingNumber?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      shipping_status: status,
      updated_at: new Date(),
    };

    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    if (status === 'shipped') {
      updateData.shipped_at = new Date();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date();
    }

    const { error } = await supabase
      .from('order_shipping')
      .update(updateData)
      .eq('id', shippingId);

    if (error) {
      console.error('Error updating shipping status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateShippingStatus:', error);
    return false;
  }
}

/**
 * Create return request
 */
export async function createReturn(
  orderId: string,
  returnData: {
    returnReason: string;
    reasonDetails?: string;
    items: Array<{
      productId: string;
      productName?: string;
      quantity: number;
      unitPrice?: number;
      condition?: string;
    }>;
    notes?: string;
  }
): Promise<OrderReturn | null> {
  try {
    // Generate return number
    const returnNumber = `RET-${Date.now()}`;

    // Create return record
    const { data: returnRecord, error: returnError } = await supabase
      .from('order_returns')
      .insert({
        order_id: orderId,
        return_number: returnNumber,
        return_reason: returnData.returnReason,
        reason_details: returnData.reasonDetails,
        return_status: 'pending',
        notes: returnData.notes,
      })
      .select()
      .single();

    if (returnError) {
      console.error('Error creating return:', returnError);
      return null;
    }

    // Create return items
    const returnItems = returnData.items.map((item) => ({
      return_id: returnRecord.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      condition: item.condition,
    }));

    const { error: itemsError } = await supabase
      .from('return_items')
      .insert(returnItems);

    if (itemsError) {
      console.error('Error creating return items:', itemsError);
      return null;
    }

    // Update order status
    await updateOrderStatus(orderId, 'return_requested', 'Return request created');

    return returnRecord;
  } catch (error) {
    console.error('Error in createReturn:', error);
    return null;
  }
}

/**
 * Approve return and process refund
 */
export async function approveReturn(
  returnId: string,
  refundAmount?: number
): Promise<boolean> {
  try {
    // Get return details
    const { data: returnRecord } = await supabase
      .from('order_returns')
      .select('*')
      .eq('id', returnId)
      .single();

    if (!returnRecord) {
      return false;
    }

    // Update return status
    const { error: updateError } = await supabase
      .from('order_returns')
      .update({
        return_status: 'approved',
        approved_at: new Date(),
        refund_amount: refundAmount || returnRecord.refund_amount,
      })
      .eq('id', returnId);

    if (updateError) {
      console.error('Error approving return:', updateError);
      return false;
    }

    // Create refund record
    const { error: refundError } = await supabase
      .from('refunds')
      .insert({
        return_id: returnId,
        order_id: returnRecord.order_id,
        amount: refundAmount || returnRecord.refund_amount,
        reason: returnRecord.return_reason,
        refund_method: 'original_payment',
        refund_status: 'processing',
      });

    if (refundError) {
      console.error('Error creating refund:', refundError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in approveReturn:', error);
    return false;
  }
}

/**
 * Process refund
 */
export async function processRefund(
  refundId: string,
  transactionId?: string,
  gatewayResponse?: Record<string, any>
): Promise<Refund | null> {
  try {
    const { data: refund, error } = await supabase
      .from('refunds')
      .update({
        refund_status: 'completed',
        transaction_id: transactionId,
        gateway_response: gatewayResponse,
        completed_at: new Date(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      console.error('Error processing refund:', error);
      return null;
    }

    // Update return status if associated
    if (refund.return_id) {
      await supabase
        .from('order_returns')
        .update({
          return_status: 'processed',
          processed_at: new Date(),
        })
        .eq('id', refund.return_id);
    }

    return refund;
  } catch (error) {
    console.error('Error in processRefund:', error);
    return null;
  }
}

/**
 * Create fulfillment task
 */
export async function createFulfillmentTask(
  orderId: string,
  task: {
    taskType: string;
    priority?: string;
    assignedTo?: string;
    notes?: string;
  }
): Promise<FulfillmentTask | null> {
  try {
    const { data: fulfillmentTask, error } = await supabase
      .from('fulfillment_tasks')
      .insert({
        order_id: orderId,
        task_type: task.taskType,
        task_status: 'pending',
        priority: task.priority || 'medium',
        assigned_to: task.assignedTo,
        notes: task.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating fulfillment task:', error);
      return null;
    }

    return fulfillmentTask;
  } catch (error) {
    console.error('Error in createFulfillmentTask:', error);
    return null;
  }
}

/**
 * Update fulfillment task status
 */
export async function updateFulfillmentTask(
  taskId: string,
  status: string,
  notes?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      task_status: status,
      updated_at: new Date(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    const { error } = await supabase
      .from('fulfillment_tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating fulfillment task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateFulfillmentTask:', error);
    return false;
  }
}

/**
 * Get pending orders
 */
export async function getPendingOrders(limit: number = 50, offset: number = 0) {
  try {
    const { data: orders, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .neq('status', 'delivered')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching pending orders:', error);
      return { orders: [], count: 0 };
    }

    return { orders: orders || [], count: count || 0 };
  } catch (error) {
    console.error('Error in getPendingOrders:', error);
    return { orders: [], count: 0 };
  }
}

/**
 * Calculate order metrics
 */
export async function getOrderMetrics(
  customerId: string
): Promise<{
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
} | null> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('customer_id', customerId);

    if (error || !orders) {
      return null;
    }

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = orders.length > 0 ? new Date(orders[0].created_at) : undefined;

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
    };
  } catch (error) {
    console.error('Error in getOrderMetrics:', error);
    return null;
  }
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status: string, limit: number = 50) {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching orders by status:', error);
      return [];
    }

    return orders || [];
  } catch (error) {
    console.error('Error in getOrdersByStatus:', error);
    return [];
  }
}
