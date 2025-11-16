import { supabase } from '@/lib/supabase/client';

export interface OrderItemHistory {
  id: string;
  orderId: string;
  itemId: string;
  action: 'added' | 'updated' | 'deleted' | 'quantity_changed' | 'price_changed';
  productId: string;
  productName: string;
  oldQuantity?: number;
  newQuantity?: number;
  oldPrice?: number;
  newPrice?: number;
  changedAt: Date;
  changedBy?: string;
  notes?: string;
}

/**
 * Record order item action in history
 */
export async function recordItemHistory(
  orderId: string,
  itemId: string,
  action: OrderItemHistory['action'],
  data: {
    productId: string;
    productName: string;
    oldQuantity?: number;
    newQuantity?: number;
    oldPrice?: number;
    newPrice?: number;
    changedBy?: string;
    notes?: string;
  }
): Promise<boolean> {
  try {
    // First check if we have order_item_history table
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'order_item_history');

    if (tablesError || !tables || tables.length === 0) {
      console.warn('order_item_history table does not exist. Skipping history record.');
      return true; // Don't fail the operation if history table doesn't exist
    }

    const { error } = await supabase.from('order_item_history').insert({
      order_id: orderId,
      item_id: itemId,
      action,
      product_id: data.productId,
      product_name: data.productName,
      old_quantity: data.oldQuantity,
      new_quantity: data.newQuantity,
      old_price: data.oldPrice,
      new_price: data.newPrice,
      changed_by: data.changedBy,
      notes: data.notes,
      changed_at: new Date(),
    });

    if (error) {
      console.warn('Error recording item history:', error);
      return true; // Don't fail the operation
    }

    return true;
  } catch (error) {
    console.warn('Error in recordItemHistory:', error);
    return true; // Don't fail the operation
  }
}

/**
 * Get order item history
 */
export async function getItemHistory(
  orderId: string,
  itemId?: string
): Promise<OrderItemHistory[]> {
  try {
    let query = supabase
      .from('order_item_history')
      .select('*')
      .eq('order_id', orderId);

    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data: history, error } = await query.order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching item history:', error);
      return [];
    }

    return (history || []).map((h: any) => ({
      id: h.id,
      orderId: h.order_id,
      itemId: h.item_id,
      action: h.action,
      productId: h.product_id,
      productName: h.product_name,
      oldQuantity: h.old_quantity,
      newQuantity: h.new_quantity,
      oldPrice: h.old_price,
      newPrice: h.new_price,
      changedAt: new Date(h.changed_at),
      changedBy: h.changed_by,
      notes: h.notes,
    }));
  } catch (error) {
    console.error('Error in getItemHistory:', error);
    return [];
  }
}

/**
 * Get summary of changes for an order item
 */
export async function getItemChangeSummary(
  orderId: string,
  itemId: string
): Promise<{
  totalAdded: number;
  totalRemoved: number;
  lastModified: Date | null;
  changeCount: number;
}> {
  try {
    const history = await getItemHistory(orderId, itemId);

    let totalAdded = 0;
    let totalRemoved = 0;
    let lastModified = null;

    history.forEach((h) => {
      if (h.changedAt > (lastModified || new Date(0))) {
        lastModified = h.changedAt;
      }

      if (h.action === 'added') {
        totalAdded += h.newQuantity || 0;
      } else if (h.action === 'deleted') {
        totalRemoved += h.oldQuantity || 0;
      } else if (h.action === 'quantity_changed') {
        if (h.newQuantity && h.oldQuantity) {
          if (h.newQuantity > h.oldQuantity) {
            totalAdded += h.newQuantity - h.oldQuantity;
          } else {
            totalRemoved += h.oldQuantity - h.newQuantity;
          }
        }
      }
    });

    return {
      totalAdded,
      totalRemoved,
      lastModified,
      changeCount: history.length,
    };
  } catch (error) {
    console.error('Error in getItemChangeSummary:', error);
    return {
      totalAdded: 0,
      totalRemoved: 0,
      lastModified: null,
      changeCount: 0,
    };
  }
}

/**
 * Delete item history for an item
 */
export async function deleteItemHistory(orderId: string, itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('order_item_history')
      .delete()
      .eq('order_id', orderId)
      .eq('item_id', itemId);

    if (error) {
      console.warn('Error deleting item history:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteItemHistory:', error);
    return false;
  }
}
