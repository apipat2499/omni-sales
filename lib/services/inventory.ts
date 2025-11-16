import { supabase } from "@/lib/auth";

export interface InventoryItem {
  id?: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  last_counted_at?: string;
}

export interface StockMovement {
  id?: string;
  product_id: string;
  warehouse_id?: string;
  quantity_change: number;
  movement_type: "in" | "out" | "adjustment" | "return";
  reference_id?: string;
  notes?: string;
  created_by?: string;
}

// Get inventory levels for a product
export async function getInventoryLevels(productId: string) {
  try {
    const { data, error } = await supabase
      .from("inventory_levels")
      .select("*")
      .eq("product_id", productId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching inventory levels:", error);
    throw error;
  }
}

// Get total stock for a product
export async function getTotalStock(productId: string) {
  try {
    const { data, error } = await supabase
      .from("inventory_levels")
      .select("quantity")
      .eq("product_id", productId);

    if (error) throw error;

    const total = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    return total;
  } catch (error) {
    console.error("Error getting total stock:", error);
    throw error;
  }
}

// Update inventory after order
export async function updateInventoryAfterOrder(
  orderId: string,
  items: Array<{ product_id: string; quantity: number }>
) {
  try {
    const movements = items.map(item => ({
      product_id: item.product_id,
      quantity_change: -item.quantity,
      movement_type: "out" as const,
      reference_id: orderId,
      notes: `Order fulfillment for order ${orderId}`,
    }));

    for (const movement of movements) {
      const { error } = await supabase
        .from("inventory_movements")
        .insert(movement);

      if (error) throw error;

      // Decrease stock
      const currentStock = await getTotalStock(movement.product_id);
      const newStock = currentStock + movement.quantity_change;

      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", movement.product_id);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating inventory:", error);
    throw error;
  }
}

// Check low stock alerts
export async function getLowStockProducts() {
  try {
    const { data, error } = await supabase
      .from("inventory_levels")
      .select(
        `
        *,
        products:product_id(id, name, sku, category)
      `
      )
      .gte("reorder_point", "quantity");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    throw error;
  }
}

// Transfer stock between warehouses
export async function transferStock(
  productId: string,
  fromWarehouse: string,
  toWarehouse: string,
  quantity: number
) {
  try {
    // Reduce from source warehouse
    const { error: outError } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: productId,
        warehouse_id: fromWarehouse,
        quantity_change: -quantity,
        movement_type: "adjustment",
        notes: `Transfer to warehouse ${toWarehouse}`,
      });

    if (outError) throw outError;

    // Add to destination warehouse
    const { error: inError } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: productId,
        warehouse_id: toWarehouse,
        quantity_change: quantity,
        movement_type: "adjustment",
        notes: `Transfer from warehouse ${fromWarehouse}`,
      });

    if (inError) throw inError;

    return { success: true };
  } catch (error) {
    console.error("Error transferring stock:", error);
    throw error;
  }
}

// Record stock adjustment
export async function adjustStock(
  productId: string,
  quantityChange: number,
  reason: string,
  warehouseId?: string
) {
  try {
    const { error } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity_change: quantityChange,
        movement_type: "adjustment",
        notes: reason,
      });

    if (error) throw error;

    // Update product stock
    const currentStock = await getTotalStock(productId);
    const newStock = currentStock + quantityChange;

    await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", productId);

    return { success: true };
  } catch (error) {
    console.error("Error adjusting stock:", error);
    throw error;
  }
}

// Get stock movement history
export async function getStockMovementHistory(
  productId: string,
  limit: number = 50
) {
  try {
    const { data, error } = await supabase
      .from("inventory_movements")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching movement history:", error);
    throw error;
  }
}

// Get inventory analytics
export async function getInventoryAnalytics() {
  try {
    const { data: allProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, sku, stock, cost_price, selling_price");

    if (productsError) throw productsError;

    const totalValue = allProducts?.reduce(
      (sum, p) => sum + ((p.cost_price || 0) * (p.stock || 0)),
      0
    ) || 0;

    const totalItems = allProducts?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0;

    return {
      totalProducts: allProducts?.length || 0,
      totalItems,
      totalInventoryValue: totalValue,
      averageStockPerProduct: totalItems / (allProducts?.length || 1),
    };
  } catch (error) {
    console.error("Error getting inventory analytics:", error);
    throw error;
  }
}

// Export inventory report
export async function exportInventoryReport() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        sku,
        category,
        stock,
        cost_price,
        selling_price
      `
      )
      .order("category");

    if (error) throw error;

    return data?.map(product => ({
      ...product,
      inventory_value: (product.cost_price || 0) * (product.stock || 0),
    }));
  } catch (error) {
    console.error("Error exporting inventory:", error);
    throw error;
  }
}
