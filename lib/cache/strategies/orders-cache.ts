import { getCacheManager, generateCacheKey, CACHE_NAMESPACES, TTL_CONFIG, type CacheTag } from '../cache-manager';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { DbOrder, DbOrderItem } from '@/lib/supabase/database';
import type { Order } from '@/types';

const cache = getCacheManager();
const ORDER_TTL = TTL_CONFIG.SHORT; // 5 minutes - orders change frequently

/**
 * Get order by ID with caching
 */
export async function getCachedOrder(orderId: string): Promise<Order | null> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.ORDER, 'detail', orderId);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return null;

      // Fetch order
      const { data: orderData, error: orderError } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        return null;
      }

      // Fetch order items
      const { data: itemsData, error: itemsError } = await client
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return null;
      }

      // Transform to Order type
      const order = orderData as DbOrder;
      const items = (itemsData || []) as DbOrderItem[];

      return {
        id: order.id,
        customerId: order.customer_id,
        customerName: order.customer_name,
        items: items.map(item => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.total_price,
          discount: item.discount,
          notes: item.notes,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        status: order.status,
        channel: order.channel as any,
        paymentMethod: order.payment_method,
        shippingAddress: order.shipping_address,
        notes: order.notes,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
        deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
      } as Order;
    },
    ORDER_TTL,
    [
      { namespace: CACHE_NAMESPACES.ORDER, resource: 'detail', id: orderId },
      { namespace: CACHE_NAMESPACES.ORDER, resource: 'all' },
    ]
  );
}

/**
 * Get orders by customer with caching
 */
export async function getCachedOrdersByCustomer(customerId: string, limit = 10): Promise<Order[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.ORDER, 'customer', `${customerId}-${limit}`);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data: ordersData, error: ordersError } = await client
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ordersError) {
        console.error('Error fetching customer orders:', ordersError);
        return [];
      }

      // Fetch all order items for these orders
      const orderIds = ordersData.map(o => o.id);
      if (orderIds.length === 0) return [];

      const { data: itemsData, error: itemsError } = await client
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return [];
      }

      // Group items by order
      const itemsByOrder: Record<string, DbOrderItem[]> = {};
      for (const item of itemsData || []) {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push(item as DbOrderItem);
      }

      // Transform to Order type
      return ordersData.map(order => {
        const dbOrder = order as DbOrder;
        const items = itemsByOrder[order.id] || [];

        return {
          id: dbOrder.id,
          customerId: dbOrder.customer_id,
          customerName: dbOrder.customer_name,
          items: items.map(item => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.total_price,
            discount: item.discount,
            notes: item.notes,
          })),
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
        } as Order;
      });
    },
    ORDER_TTL,
    [
      { namespace: CACHE_NAMESPACES.ORDER, resource: 'customer', id: customerId },
      { namespace: CACHE_NAMESPACES.ORDER, resource: 'all' },
    ]
  );
}

/**
 * Get orders by status with caching
 */
export async function getCachedOrdersByStatus(status: string, limit = 100): Promise<Order[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.ORDER, 'status', `${status}-${limit}`);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data: ordersData, error: ordersError } = await client
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ordersError) {
        console.error('Error fetching orders by status:', ordersError);
        return [];
      }

      // Fetch all order items for these orders
      const orderIds = ordersData.map(o => o.id);
      if (orderIds.length === 0) return [];

      const { data: itemsData, error: itemsError } = await client
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return [];
      }

      // Group items by order
      const itemsByOrder: Record<string, DbOrderItem[]> = {};
      for (const item of itemsData || []) {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push(item as DbOrderItem);
      }

      // Transform to Order type
      return ordersData.map(order => {
        const dbOrder = order as DbOrder;
        const items = itemsByOrder[order.id] || [];

        return {
          id: dbOrder.id,
          customerId: dbOrder.customer_id,
          customerName: dbOrder.customer_name,
          items: items.map(item => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.total_price,
            discount: item.discount,
            notes: item.notes,
          })),
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
        } as Order;
      });
    },
    ORDER_TTL,
    [
      { namespace: CACHE_NAMESPACES.ORDER, resource: 'status', id: status },
      { namespace: CACHE_NAMESPACES.ORDER, resource: 'all' },
    ]
  );
}

/**
 * Get recent orders with caching
 */
export async function getCachedRecentOrders(limit = 50): Promise<Order[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.ORDER, 'recent', String(limit));

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data: ordersData, error: ordersError } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ordersError) {
        console.error('Error fetching recent orders:', ordersError);
        return [];
      }

      // Fetch all order items for these orders
      const orderIds = ordersData.map(o => o.id);
      if (orderIds.length === 0) return [];

      const { data: itemsData, error: itemsError } = await client
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return [];
      }

      // Group items by order
      const itemsByOrder: Record<string, DbOrderItem[]> = {};
      for (const item of itemsData || []) {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push(item as DbOrderItem);
      }

      // Transform to Order type
      return ordersData.map(order => {
        const dbOrder = order as DbOrder;
        const items = itemsByOrder[order.id] || [];

        return {
          id: dbOrder.id,
          customerId: dbOrder.customer_id,
          customerName: dbOrder.customer_name,
          items: items.map(item => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.total_price,
            discount: item.discount,
            notes: item.notes,
          })),
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
        } as Order;
      });
    },
    ORDER_TTL,
    [{ namespace: CACHE_NAMESPACES.ORDER, resource: 'recent' }]
  );
}

/**
 * Invalidate order cache
 */
export async function invalidateOrderCache(orderId?: string, customerId?: string): Promise<void> {
  if (orderId) {
    // Invalidate specific order
    await cache.invalidateByTag({
      namespace: CACHE_NAMESPACES.ORDER,
      resource: 'detail',
      id: orderId,
    });
  }

  if (customerId) {
    // Invalidate customer orders
    await cache.invalidateByTag({
      namespace: CACHE_NAMESPACES.ORDER,
      resource: 'customer',
      id: customerId,
    });
  }

  // Invalidate all orders and related caches
  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.ORDER,
    resource: 'all',
  });

  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.ORDER,
    resource: 'recent',
  });

  // Invalidate all status caches
  await cache.invalidateByPattern(`${CACHE_NAMESPACES.ORDER}:status:*`);
}

/**
 * Invalidate orders by status
 */
export async function invalidateOrderStatusCache(status: string): Promise<void> {
  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.ORDER,
    resource: 'status',
    id: status,
  });

  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.ORDER,
    resource: 'all',
  });
}
