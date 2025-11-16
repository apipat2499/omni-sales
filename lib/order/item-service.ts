import { supabase } from '@/lib/supabase/client';

export interface OrderItemInput {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface OrderItemUpdate {
  quantity?: number;
  price?: number;
}

/**
 * Get all items in an order
 */
export async function getOrderItems(orderId: string) {
  try {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching order items:', error);
      return null;
    }

    return items || [];
  } catch (error) {
    console.error('Error in getOrderItems:', error);
    return null;
  }
}

/**
 * Add item to order
 */
export async function addOrderItem(
  orderId: string,
  item: OrderItemInput
): Promise<any> {
  try {
    const { data: newItem, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding order item:', error);
      return null;
    }

    // Recalculate order total
    await recalculateOrderTotal(orderId);

    return newItem;
  } catch (error) {
    console.error('Error in addOrderItem:', error);
    return null;
  }
}

/**
 * Update item in order (quantity and/or price)
 */
export async function updateOrderItem(
  orderId: string,
  itemId: string,
  updates: OrderItemUpdate
): Promise<any> {
  try {
    // Verify item belongs to order
    const { data: item, error: verifyError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single();

    if (verifyError || !item) {
      console.error('Item not found in order');
      return null;
    }

    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order item:', error);
      return null;
    }

    // Recalculate order total
    await recalculateOrderTotal(orderId);

    return updatedItem;
  } catch (error) {
    console.error('Error in updateOrderItem:', error);
    return null;
  }
}

/**
 * Delete item from order
 */
export async function deleteOrderItem(
  orderId: string,
  itemId: string
): Promise<boolean> {
  try {
    // Verify item belongs to order
    const { data: item, error: verifyError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single();

    if (verifyError || !item) {
      console.error('Item not found in order');
      return false;
    }

    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting order item:', error);
      return false;
    }

    // Recalculate order total
    await recalculateOrderTotal(orderId);

    return true;
  } catch (error) {
    console.error('Error in deleteOrderItem:', error);
    return false;
  }
}

/**
 * Update item quantity (quick operation)
 */
export async function updateItemQuantity(
  orderId: string,
  itemId: string,
  quantity: number
): Promise<boolean> {
  if (quantity <= 0) {
    console.error('Quantity must be greater than 0');
    return false;
  }

  return updateOrderItem(orderId, itemId, { quantity }) !== null;
}

/**
 * Recalculate order subtotal and total based on items
 */
export async function recalculateOrderTotal(orderId: string): Promise<boolean> {
  try {
    // Get all items for this order
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, price')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Calculate subtotal
    const subtotal = (items || []).reduce((sum: number, item: any) => {
      return sum + (item.quantity * parseFloat(item.price || 0));
    }, 0);

    // Get order to get taxes and shipping
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('tax, shipping')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    const total = subtotal + (order?.tax || 0) + (order?.shipping || 0);

    // Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal: subtotal.toString(),
        total: total.toString(),
        updated_at: new Date(),
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error recalculating order total:', error);
    return false;
  }
}

/**
 * Bulk add items to order
 */
export async function bulkAddOrderItems(
  orderId: string,
  items: OrderItemInput[]
): Promise<any[]> {
  try {
    const insertData = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.price,
    }));

    const { data: newItems, error } = await supabase
      .from('order_items')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error bulk adding order items:', error);
      return [];
    }

    // Recalculate order total
    await recalculateOrderTotal(orderId);

    return newItems || [];
  } catch (error) {
    console.error('Error in bulkAddOrderItems:', error);
    return [];
  }
}
