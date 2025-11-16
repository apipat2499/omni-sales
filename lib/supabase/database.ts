import { getSupabaseClient, isSupabaseAvailable } from './client';
import type { Order, OrderItem, Product, Customer, OrderStatus } from '@/types';

// Database table names
export const TABLES = {
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
} as const;

// Database type definitions matching our models
export interface DbOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  channel: string;
  payment_method?: string;
  shipping_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total_price: number;
  discount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  sku: string;
  image?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DbCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  tags: string[];
  last_order_date?: string;
  created_at: string;
  updated_at: string;
}

// Database error type
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// Result type for operations
export type DatabaseResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: DatabaseError };

/**
 * Transform database order to application order
 */
function dbOrderToOrder(dbOrder: DbOrder, items: DbOrderItem[]): Order {
  return {
    id: dbOrder.id,
    customerId: dbOrder.customer_id,
    customerName: dbOrder.customer_name,
    items: items.map(dbItemToOrderItem),
    subtotal: dbOrder.subtotal,
    tax: dbOrder.tax,
    shipping: dbOrder.shipping,
    total: dbOrder.total,
    status: dbOrder.status,
    channel: dbOrder.channel as any,
    paymentMethod: dbOrder.payment_method,
    shippingAddress: dbOrder.shipping_address,
    notes: dbOrder.notes,
    createdAt: new Date(dbOrder.created_at),
    updatedAt: new Date(dbOrder.updated_at),
    deliveredAt: dbOrder.delivered_at ? new Date(dbOrder.delivered_at) : undefined,
  };
}

/**
 * Transform application order to database order
 */
function orderToDbOrder(order: Order): Omit<DbOrder, 'created_at' | 'updated_at'> {
  return {
    id: order.id,
    customer_id: order.customerId,
    customer_name: order.customerName,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
    status: order.status,
    channel: order.channel,
    payment_method: order.paymentMethod,
    shipping_address: order.shippingAddress,
    notes: order.notes,
    delivered_at: order.deliveredAt?.toISOString(),
  };
}

/**
 * Transform database order item to application order item
 */
function dbItemToOrderItem(dbItem: DbOrderItem): OrderItem {
  return {
    id: dbItem.id,
    productId: dbItem.product_id,
    productName: dbItem.product_name,
    quantity: dbItem.quantity,
    price: dbItem.price,
    totalPrice: dbItem.total_price,
    discount: dbItem.discount,
    notes: dbItem.notes,
  };
}

/**
 * Transform application order item to database order item
 */
function orderItemToDbItem(item: OrderItem, orderId: string): Omit<DbOrderItem, 'created_at' | 'updated_at'> {
  return {
    id: item.id || crypto.randomUUID(),
    order_id: orderId,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    price: item.price,
    total_price: item.totalPrice || item.price * item.quantity,
    discount: item.discount,
    notes: item.notes,
  };
}

/**
 * Handle database errors and convert to standardized format
 */
function handleError(error: any): DatabaseError {
  return {
    message: error.message || 'An unknown database error occurred',
    code: error.code,
    details: error.details,
    hint: error.hint,
  };
}

// ==================== ORDER OPERATIONS ====================

/**
 * Create a new order with items
 */
export async function createOrder(order: Order): Promise<DatabaseResult<Order>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    // Insert order
    const { data: orderData, error: orderError } = await client
      .from(TABLES.ORDERS)
      .insert(orderToDbOrder(order))
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const itemsToInsert = order.items.map(item => orderItemToDbItem(item, order.id));
    const { data: itemsData, error: itemsError } = await client
      .from(TABLES.ORDER_ITEMS)
      .insert(itemsToInsert)
      .select();

    if (itemsError) throw itemsError;

    return {
      success: true,
      data: dbOrderToOrder(orderData, itemsData),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

/**
 * Get an order by ID with its items
 */
export async function getOrder(orderId: string): Promise<DatabaseResult<Order>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    // Fetch order
    const { data: orderData, error: orderError } = await client
      .from(TABLES.ORDERS)
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Fetch order items
    const { data: itemsData, error: itemsError } = await client
      .from(TABLES.ORDER_ITEMS)
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    return {
      success: true,
      data: dbOrderToOrder(orderData, itemsData || []),
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

/**
 * Get all orders with optional filtering
 */
export async function getOrders(filters?: {
  status?: OrderStatus;
  customerId?: string;
  limit?: number;
  offset?: number;
}): Promise<DatabaseResult<Order[]>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    // Build query
    let query = client.from(TABLES.ORDERS).select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data: ordersData, error: ordersError } = await query.order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch all order items for these orders
    const orderIds = ordersData.map(o => o.id);
    const { data: itemsData, error: itemsError } = await client
      .from(TABLES.ORDER_ITEMS)
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    // Group items by order
    const itemsByOrder = (itemsData || []).reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {} as Record<string, DbOrderItem[]>);

    // Combine orders with their items
    const orders = ordersData.map(order =>
      dbOrderToOrder(order, itemsByOrder[order.id] || [])
    );

    return {
      success: true,
      data: orders,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

/**
 * Update an order
 */
export async function updateOrder(
  orderId: string,
  updates: Partial<Order>
): Promise<DatabaseResult<Order>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    // Update order
    const orderUpdates: any = {};
    if (updates.status) orderUpdates.status = updates.status;
    if (updates.notes !== undefined) orderUpdates.notes = updates.notes;
    if (updates.paymentMethod !== undefined) orderUpdates.payment_method = updates.paymentMethod;
    if (updates.shippingAddress !== undefined) orderUpdates.shipping_address = updates.shippingAddress;
    if (updates.deliveredAt !== undefined) orderUpdates.delivered_at = updates.deliveredAt?.toISOString();
    orderUpdates.updated_at = new Date().toISOString();

    const { data: orderData, error: orderError } = await client
      .from(TABLES.ORDERS)
      .update(orderUpdates)
      .eq('id', orderId)
      .select()
      .single();

    if (orderError) throw orderError;

    // If items were updated, handle them
    if (updates.items) {
      // Delete existing items
      await client.from(TABLES.ORDER_ITEMS).delete().eq('order_id', orderId);

      // Insert new items
      const itemsToInsert = updates.items.map(item => orderItemToDbItem(item, orderId));
      const { error: itemsError } = await client
        .from(TABLES.ORDER_ITEMS)
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    // Fetch complete order
    return await getOrder(orderId);
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

/**
 * Delete an order and its items
 */
export async function deleteOrder(orderId: string): Promise<DatabaseResult<void>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    // Delete order items first (cascade might not be set up)
    await client.from(TABLES.ORDER_ITEMS).delete().eq('order_id', orderId);

    // Delete order
    const { error } = await client.from(TABLES.ORDERS).delete().eq('id', orderId);

    if (error) throw error;

    return {
      success: true,
      data: undefined as void,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

// ==================== BATCH OPERATIONS ====================

/**
 * Batch create multiple orders
 */
export async function batchCreateOrders(orders: Order[]): Promise<DatabaseResult<Order[]>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    // Insert all orders
    const ordersToInsert = orders.map(orderToDbOrder);
    const { data: ordersData, error: ordersError } = await client
      .from(TABLES.ORDERS)
      .insert(ordersToInsert)
      .select();

    if (ordersError) throw ordersError;

    // Insert all items
    const allItems = orders.flatMap(order =>
      order.items.map(item => orderItemToDbItem(item, order.id))
    );

    const { data: itemsData, error: itemsError } = await client
      .from(TABLES.ORDER_ITEMS)
      .insert(allItems)
      .select();

    if (itemsError) throw itemsError;

    // Group items by order
    const itemsByOrder = (itemsData || []).reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {} as Record<string, DbOrderItem[]>);

    // Combine orders with their items
    const completeOrders = ordersData.map(order =>
      dbOrderToOrder(order, itemsByOrder[order.id] || [])
    );

    return {
      success: true,
      data: completeOrders,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

/**
 * Batch update multiple orders
 */
export async function batchUpdateOrders(
  updates: Array<{ id: string; updates: Partial<Order> }>
): Promise<DatabaseResult<Order[]>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    const results: Order[] = [];

    // Process each update sequentially to maintain data integrity
    for (const { id, updates: orderUpdates } of updates) {
      const result = await updateOrder(id, orderUpdates);
      if (!result.success) {
        throw new Error(`Failed to update order ${id}: ${result.error?.message}`);
      }
      results.push(result.data);
    }

    return {
      success: true,
      data: results,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

/**
 * Batch delete multiple orders
 */
export async function batchDeleteOrders(orderIds: string[]): Promise<DatabaseResult<void>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    // Delete all items for these orders
    await client.from(TABLES.ORDER_ITEMS).delete().in('order_id', orderIds);

    // Delete all orders
    const { error } = await client.from(TABLES.ORDERS).delete().in('id', orderIds);

    if (error) throw error;

    return {
      success: true,
      data: undefined as void,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if database is available and accessible
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    return false;
  }

  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Simple query to check connection
    const { error } = await client.from(TABLES.ORDERS).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<DatabaseResult<{
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}>> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      data: null,
      error: { message: 'Supabase client not available. Running in offline mode.' },
    };
  }

  try {
    const [ordersCount, customersCount, productsCount] = await Promise.all([
      client.from(TABLES.ORDERS).select('id', { count: 'exact', head: true }),
      client.from(TABLES.CUSTOMERS).select('id', { count: 'exact', head: true }),
      client.from(TABLES.PRODUCTS).select('id', { count: 'exact', head: true }),
    ]);

    return {
      success: true,
      data: {
        totalOrders: ordersCount.count || 0,
        totalCustomers: customersCount.count || 0,
        totalProducts: productsCount.count || 0,
      },
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: handleError(error),
    };
  }
}
