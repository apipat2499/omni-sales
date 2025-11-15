import { supabase } from '@/lib/supabase/client';
import { InventoryLevel, StockMovement } from '@/types';

/**
 * Inventory Management Service
 * Handles stock tracking, movements, and transfers
 */

// Stock Movement Types
export const MOVEMENT_TYPES = {
  SALES: 'sales',
  RETURN: 'return',
  ADJUSTMENT: 'adjustment',
  TRANSFER_OUT: 'transfer_out',
  TRANSFER_IN: 'transfer_in',
  RECEIVED: 'received',
  DAMAGED: 'damaged',
  EXPIRED: 'expired',
  STOCKTAKE: 'stocktake',
};

/**
 * Record a stock movement
 */
export async function recordStockMovement(
  userId: string,
  movement: {
    productId: string;
    warehouseId?: string;
    movementType: string;
    quantityChange: number;
    reason?: string;
    notes?: string;
    createdBy?: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<StockMovement | null> {
  try {
    // Get current inventory level
    const { data: currentInventory } = await supabase
      .from('inventory')
      .select('quantity_on_hand, quantity_reserved')
      .eq('user_id', userId)
      .eq('product_id', movement.productId)
      .eq('warehouse_id', movement.warehouseId || null)
      .single();

    const quantityBefore = currentInventory?.quantity_on_hand || 0;
    const quantityAfter = quantityBefore + movement.quantityChange;

    // Record movement
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        user_id: userId,
        product_id: movement.productId,
        warehouse_id: movement.warehouseId,
        movement_type: movement.movementType,
        quantity_change: movement.quantityChange,
        quantity_before: quantityBefore,
        quantity_after: Math.max(0, quantityAfter),
        reason: movement.reason,
        notes: movement.notes,
        created_by: movement.createdBy,
        reference_type: movement.referenceType,
        reference_id: movement.referenceId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording stock movement:', error);
      return null;
    }

    // Update inventory level
    await updateInventoryLevel(
      userId,
      movement.productId,
      movement.warehouseId,
      quantityAfter
    );

    return data;
  } catch (error) {
    console.error('Record movement error:', error);
    return null;
  }
}

/**
 * Update inventory quantity
 */
async function updateInventoryLevel(
  userId: string,
  productId: string,
  warehouseId: string | undefined,
  newQuantity: number
) {
  const { error } = await supabase
    .from('inventory')
    .upsert({
      user_id: userId,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity_on_hand: Math.max(0, newQuantity),
      last_movement_at: new Date(),
    });

  if (error) {
    console.error('Error updating inventory:', error);
  }
}

/**
 * Get low stock items
 */
export async function getLowStockItems(userId: string, warehouseId?: string) {
  try {
    let query = supabase
      .from('inventory')
      .select(
        `
        *,
        products (
          id,
          name,
          sku,
          category,
          cost
        )
      `
      )
      .eq('user_id', userId)
      .lte('quantity_available', supabase.raw('reorder_point'));

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting low stock items:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get low stock error:', error);
    return [];
  }
}

/**
 * Get inventory value
 */
export async function getInventoryValue(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(
        `
        quantity_on_hand,
        products (
          cost
        )
      `
      )
      .eq('user_id', userId);

    if (error) {
      console.error('Error calculating inventory value:', error);
      return 0;
    }

    const totalValue = data?.reduce((sum, item) => {
      const itemValue =
        (item.quantity_on_hand || 0) *
        (Number(item.products?.cost) || 0);
      return sum + itemValue;
    }, 0) || 0;

    return totalValue;
  } catch (error) {
    console.error('Get inventory value error:', error);
    return 0;
  }
}

/**
 * Transfer stock between warehouses
 */
export async function transferStock(
  userId: string,
  transfer: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    notes?: string;
  }
): Promise<boolean> {
  try {
    // Record outgoing movement
    await recordStockMovement(userId, {
      productId: transfer.productId,
      warehouseId: transfer.fromWarehouseId,
      movementType: MOVEMENT_TYPES.TRANSFER_OUT,
      quantityChange: -transfer.quantity,
      notes: `Transfer to warehouse: ${transfer.notes || ''}`,
      referenceType: 'transfer',
    });

    // Record incoming movement
    await recordStockMovement(userId, {
      productId: transfer.productId,
      warehouseId: transfer.toWarehouseId,
      movementType: MOVEMENT_TYPES.TRANSFER_IN,
      quantityChange: transfer.quantity,
      notes: `Transfer from warehouse: ${transfer.notes || ''}`,
      referenceType: 'transfer',
    });

    // Create transfer record
    const { error } = await supabase.from('stock_transfers').insert({
      user_id: userId,
      product_id: transfer.productId,
      from_warehouse_id: transfer.fromWarehouseId,
      to_warehouse_id: transfer.toWarehouseId,
      quantity: transfer.quantity,
      status: 'pending',
      notes: transfer.notes,
    });

    if (error) {
      console.error('Error creating transfer:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Transfer stock error:', error);
    return false;
  }
}

/**
 * Get stock movement history
 */
export async function getStockMovementHistory(
  userId: string,
  productId?: string,
  limit: number = 100
) {
  try {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting movement history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get history error:', error);
    return [];
  }
}

/**
 * Get reorder suggestions
 */
export async function getReorderSuggestions(userId: string) {
  try {
    const { data: reorderPoints, error } = await supabase
      .from('reorder_points')
      .select(
        `
        *,
        inventory (
          quantity_on_hand,
          quantity_available
        ),
        products (
          name,
          sku,
          cost
        )
      `
      )
      .eq('user_id', userId)
      .eq('auto_reorder', true)
      .eq('is_active', true);

    if (error) {
      console.error('Error getting reorder suggestions:', error);
      return [];
    }

    // Filter items that need reordering
    const suggestions = reorderPoints?.filter((rp) => {
      const invLevel = rp.inventory as any;
      return invLevel?.quantity_available <= rp.min_stock;
    }) || [];

    return suggestions;
  } catch (error) {
    console.error('Get reorder suggestions error:', error);
    return [];
  }
}

/**
 * Create barcode
 */
export async function createBarcode(
  userId: string,
  barcode: string,
  productId: string,
  barcodeType: string = 'ean13'
): Promise<boolean> {
  try {
    const { error } = await supabase.from('barcodes').insert({
      user_id: userId,
      product_id: productId,
      barcode,
      barcode_type: barcodeType,
      is_active: true,
    });

    if (error) {
      console.error('Error creating barcode:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Create barcode error:', error);
    return false;
  }
}

/**
 * Get product by barcode
 */
export async function getProductByBarcode(
  userId: string,
  barcode: string
) {
  try {
    const { data, error } = await supabase
      .from('barcodes')
      .select(
        `
        *,
        products (*)
      `
      )
      .eq('user_id', userId)
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get product by barcode error:', error);
    return null;
  }
}

/**
 * Calculate inventory turnover
 */
export async function calculateTurnoverRate(
  userId: string,
  days: number = 30
): Promise<number> {
  try {
    // Get total COGS (cost of goods sold)
    const { data: movements } = await supabase
      .from('stock_movements')
      .select(
        `
        quantity_change,
        products (cost)
      `
      )
      .eq('user_id', userId)
      .eq('movement_type', MOVEMENT_TYPES.SALES)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    const totalCogs = movements?.reduce((sum, m) => {
      const value = Math.abs(m.quantity_change) * Number(m.products?.cost || 0);
      return sum + value;
    }, 0) || 0;

    // Get average inventory value
    const avgInventoryValue = await getInventoryValue(userId);

    // Turnover = COGS / Average Inventory
    return avgInventoryValue > 0 ? totalCogs / avgInventoryValue : 0;
  } catch (error) {
    console.error('Calculate turnover error:', error);
    return 0;
  }
}

/**
 * Forecast inventory needs
 */
export async function forecastInventoryNeeds(
  userId: string,
  productId: string,
  days: number = 30
): Promise<number> {
  try {
    // Get recent sales data
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('quantity_change')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('movement_type', MOVEMENT_TYPES.SALES)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!movements || movements.length === 0) {
      return 0;
    }

    // Calculate average daily sales
    const totalSold = movements.reduce((sum, m) => sum + Math.abs(m.quantity_change), 0);
    const averageDailySales = totalSold / 30;

    // Forecast for specified days
    return Math.ceil(averageDailySales * days);
  } catch (error) {
    console.error('Forecast error:', error);
    return 0;
  }
}
