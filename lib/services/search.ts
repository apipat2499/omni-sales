import { supabase } from "@/lib/supabase/client";

// Full-text search products
export async function searchProducts(query: string) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Search products error:", error);
    return [];
  }
}

// Full-text search orders
export async function searchOrders(query: string) {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%`);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Search orders error:", error);
    return [];
  }
}

// Full-text search customers
export async function searchCustomers(query: string) {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Search customers error:", error);
    return [];
  }
}

// Global search across all entities
export async function globalSearch(query: string) {
  try {
    const [products, orders, customers] = await Promise.all([
      searchProducts(query),
      searchOrders(query),
      searchCustomers(query),
    ]);

    return {
      products,
      orders,
      customers,
      total: (products?.length || 0) + (orders?.length || 0) + (customers?.length || 0),
    };
  } catch (error) {
    console.error("Global search error:", error);
    return { products: [], orders: [], customers: [], total: 0 };
  }
}

export default {
  searchProducts,
  searchOrders,
  searchCustomers,
  globalSearch,
};
