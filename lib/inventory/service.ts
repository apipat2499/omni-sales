import { createClient } from '@supabase/supabase-js';
import { Warehouse, StockLevel, StockAdjustment, StockTransfer, LowStockAlert, InventoryMovement, Supplier, PurchaseOrder, InventoryAnalytics } from '@/types';

// Create Supabase client lazily to handle missing environment variables during build
let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('Supabase environment variables not set');
      return null;
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// WAREHOUSE MANAGEMENT
export async function createWarehouse(userId: string, warehouse: Partial<Warehouse>): Promise<Warehouse | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        user_id: userId,
        warehouse_name: warehouse.warehouseName,
        warehouse_code: warehouse.warehouseCode,
        location: warehouse.location,
        address: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        country: warehouse.country,
        postal_code: warehouse.postalCode,
        capacity: warehouse.capacity,
        is_active: true,
        is_primary: warehouse.isPrimary || false,
        manager_name: warehouse.managerName,
        contact_phone: warehouse.contactPhone,
        contact_email: warehouse.contactEmail,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Warehouse;
  } catch (err) {
    console.error('Error creating warehouse:', err);
    return null;
  }
}

export async function getWarehouses(userId: string): Promise<Warehouse[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return (data || []) as Warehouse[];
  } catch (err) {
    console.error('Error fetching warehouses:', err);
    return [];
  }
}

// STOCK LEVEL MANAGEMENT
export async function getStockLevel(productId: string, warehouseId: string): Promise<StockLevel | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('stock_levels')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as StockLevel;
  } catch (err) {
    console.error('Error fetching stock level:', err);
    return null;
  }
}

export async function getProductStock(productId: string): Promise<StockLevel[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('stock_levels')
      .select('*')
      .eq('product_id', productId);

    if (error) throw error;
    return (data || []) as StockLevel[];
  } catch (err) {
    console.error('Error fetching product stock:', err);
    return [];
  }
}

export async function updateStockLevel(userId: string, productId: string, warehouseId: string, quantityChange: number, reason: string, referenceType?: string, referenceId?: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const currentStock = await getStockLevel(productId, warehouseId);

    if (!currentStock) {
      const { error } = await supabase.from('stock_levels').insert({
        user_id: userId,
        product_id: productId,
        warehouse_id: warehouseId,
        quantity_on_hand: Math.max(0, quantityChange),
        quantity_available: Math.max(0, quantityChange),
        created_at: new Date(),
        updated_at: new Date(),
      });
      if (error) throw error;
    } else {
      const newQuantity = Math.max(0, currentStock.quantityOnHand + quantityChange);
      const newAvailable = Math.max(0, newQuantity - currentStock.quantityReserved);
      const { error } = await supabase.from('stock_levels').update({
        quantity_on_hand: newQuantity,
        quantity_available: newAvailable,
        updated_at: new Date(),
      }).eq('id', currentStock.id);
      if (error) throw error;
    }

    await recordStockAdjustment(userId, productId, warehouseId, quantityChange, reason, referenceType, referenceId);
    return true;
  } catch (err) {
    console.error('Error updating stock level:', err);
    return false;
  }
}

// STOCK ADJUSTMENTS
export async function recordStockAdjustment(userId: string, productId: string, warehouseId: string, quantityChange: number, reason: string, referenceType?: string, referenceId?: string): Promise<StockAdjustment | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase.from('stock_adjustments').insert({
      user_id: userId,
      product_id: productId,
      warehouse_id: warehouseId,
      adjustment_type: 'manual',
      quantity_change: quantityChange,
      reason: reason,
      reference_type: referenceType,
      reference_id: referenceId,
      adjusted_by: 'system',
      adjusted_at: new Date(),
      created_at: new Date(),
    }).select().single();

    if (error) throw error;
    return data as StockAdjustment;
  } catch (err) {
    console.error('Error recording stock adjustment:', err);
    return null;
  }
}

export async function getStockAdjustments(productId: string, days: number = 30): Promise<StockAdjustment[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase.from('stock_adjustments').select('*').eq('product_id', productId).gte('adjusted_at', startDate.toISOString()).order('adjusted_at', { ascending: false });

    if (error) throw error;
    return (data || []) as StockAdjustment[];
  } catch (err) {
    console.error('Error fetching stock adjustments:', err);
    return [];
  }
}

// STOCK TRANSFERS
export async function createStockTransfer(userId: string, transfer: Partial<StockTransfer>): Promise<StockTransfer | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase.from('stock_transfers').insert({
      user_id: userId,
      product_id: transfer.productId,
      from_warehouse_id: transfer.fromWarehouseId,
      to_warehouse_id: transfer.toWarehouseId,
      quantity: transfer.quantity,
      status: 'pending',
      transfer_date: new Date(),
      notes: transfer.notes,
      created_at: new Date(),
      updated_at: new Date(),
    }).select().single();

    if (error) throw error;

    await updateStockLevel(userId, transfer.productId!, transfer.fromWarehouseId!, -(transfer.quantity || 0), 'Stock transfer out', 'transfer', data.id);
    return data as StockTransfer;
  } catch (err) {
    console.error('Error creating stock transfer:', err);
    return null;
  }
}

export async function completeStockTransfer(transferId: string, userId: string, productId: string, toWarehouseId: string, quantity: number): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error: updateError } = await supabase.from('stock_transfers').update({
      status: 'received',
      received_date: new Date(),
      received_by: 'system',
      updated_at: new Date(),
    }).eq('id', transferId);

    if (updateError) throw updateError;
    await updateStockLevel(userId, productId, toWarehouseId, quantity, 'Stock transfer in', 'transfer', transferId);
    return true;
  } catch (err) {
    console.error('Error completing stock transfer:', err);
    return false;
  }
}

export async function getStockTransfers(userId: string): Promise<StockTransfer[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.from('stock_transfers').select('*').eq('user_id', userId).eq('status', 'pending').order('transfer_date', { ascending: false });

    if (error) throw error;
    return (data || []) as StockTransfer[];
  } catch (err) {
    console.error('Error fetching stock transfers:', err);
    return [];
  }
}

// LOW STOCK ALERTS
export async function checkLowStockAlerts(userId: string): Promise<LowStockAlert[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.from('stock_levels').select('*').eq('user_id', userId);

    if (error) throw error;

    const alerts = [];
    for (const stock of data || []) {
      if (stock.quantity_on_hand <= stock.reorder_point) {
        const { data: existingAlert } = await supabase.from('low_stock_alerts').select('*').eq('product_id', stock.product_id).eq('alert_status', 'active').single();

        if (!existingAlert) {
          const { data: alert } = await supabase.from('low_stock_alerts').insert({
            user_id: userId,
            product_id: stock.product_id,
            warehouse_id: stock.warehouse_id,
            alert_type: 'low_stock',
            current_quantity: stock.quantity_on_hand,
            reorder_point: stock.reorder_point,
            alert_status: 'active',
            alerted_at: new Date(),
            created_at: new Date(),
          }).select().single();

          if (alert) alerts.push(alert);
        }
      }
    }

    return alerts as LowStockAlert[];
  } catch (err) {
    console.error('Error checking low stock alerts:', err);
    return [];
  }
}

// SUPPLIERS & PURCHASE ORDERS
export async function createSupplier(userId: string, supplier: Partial<Supplier>): Promise<Supplier | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase.from('suppliers').insert({
      user_id: userId,
      supplier_name: supplier.supplierName,
      supplier_code: supplier.supplierCode,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      payment_terms: supplier.paymentTerms,
      lead_time_days: supplier.leadTimeDays,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }).select().single();

    if (error) throw error;
    return data as Supplier;
  } catch (err) {
    console.error('Error creating supplier:', err);
    return null;
  }
}

export async function getSuppliers(userId: string): Promise<Supplier[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.from('suppliers').select('*').eq('user_id', userId).eq('is_active', true);

    if (error) throw error;
    return (data || []) as Supplier[];
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    return [];
  }
}

export async function createPurchaseOrder(userId: string, po: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase.from('purchase_orders').insert({
      user_id: userId,
      supplier_id: po.supplierId,
      warehouse_id: po.warehouseId,
      po_number: po.poNumber,
      po_date: new Date(),
      expected_delivery_date: po.expectedDeliveryDate,
      status: 'draft',
      notes: po.notes,
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date(),
    }).select().single();

    if (error) throw error;
    return data as PurchaseOrder;
  } catch (err) {
    console.error('Error creating purchase order:', err);
    return null;
  }
}

// INVENTORY ANALYTICS
export async function recordInventoryAnalytics(userId: string, analytics: Partial<InventoryAnalytics>): Promise<InventoryAnalytics | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase.from('inventory_analytics').insert({
      user_id: userId,
      date: analytics.date || new Date(),
      warehouse_id: analytics.warehouseId,
      total_items_in_stock: analytics.totalItemsInStock || 0,
      total_reserved_items: analytics.totalReservedItems || 0,
      total_available_items: analytics.totalAvailableItems || 0,
      total_damaged_items: analytics.totalDamagedItems || 0,
      total_inventory_value: analytics.totalInventoryValue,
      low_stock_items: analytics.lowStockItems || 0,
      out_of_stock_items: analytics.outOfStockItems || 0,
      turnover_rate: analytics.turnoverRate,
      stockout_percentage: analytics.stockoutPercentage,
      created_at: new Date(),
    }).select().single();

    if (error) throw error;
    return data as InventoryAnalytics;
  } catch (err) {
    console.error('Error recording inventory analytics:', err);
    return null;
  }
}

export async function getInventoryAnalytics(userId: string, days: number = 30): Promise<InventoryAnalytics[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase.from('inventory_analytics').select('*').eq('user_id', userId).gte('date', startDate.toISOString()).order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as InventoryAnalytics[];
  } catch (err) {
    console.error('Error fetching inventory analytics:', err);
    return [];
  }
}

export async function getTotalInventoryValue(userId: string): Promise<number> {
  try {
    const supabase = getSupabase();
    if (!supabase) return 0;

    const { data, error } = await supabase.from('stock_levels').select('quantity_on_hand').eq('user_id', userId);

    if (error) throw error;
    return (data || []).reduce((sum, stock) => sum + (stock.quantity_on_hand || 0), 0);
  } catch (err) {
    console.error('Error calculating inventory value:', err);
    return 0;
  }
}

export async function createBarcode(
  userId: string,
  barcode: string,
  productId: string,
  barcodeType?: string
): Promise<any> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('product_barcodes')
      .insert({
        user_id: userId,
        product_id: productId,
        barcode,
        barcode_type: barcodeType || 'ean13',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating barcode:', err);
    return null;
  }
}

export async function getProductByBarcode(userIdOrBarcode: string, barcode?: string): Promise<any | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Handle both single argument (barcode) and two argument (userId, barcode) calls
    const finalBarcode = barcode || userIdOrBarcode;

    const { data, error } = await supabase
      .from('product_barcodes')
      .select('product_id, products(*)')
      .eq('barcode', finalBarcode);

    if (error) throw error;
    return data && data.length > 0 ? data[0]?.products : null;
  } catch (err) {
    console.error('Error fetching product by barcode:', err);
    return null;
  }
}

export async function getReorderSuggestions(userId: string): Promise<any[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: stockLevels, error } = await supabase
      .from('stock_levels')
      .select('product_id, quantity_on_hand, reorder_point')
      .eq('user_id', userId);

    if (error) throw error;

    const suggestions = (stockLevels || [])
      .filter((stock: any) => stock.quantity_on_hand <= (stock.reorder_point || 0))
      .map((stock: any) => ({
        product_id: stock.product_id,
        current_quantity: stock.quantity_on_hand,
        reorder_point: stock.reorder_point,
      }));

    return suggestions;
  } catch (err) {
    console.error('Error getting reorder suggestions:', err);
    return [];
  }
}
