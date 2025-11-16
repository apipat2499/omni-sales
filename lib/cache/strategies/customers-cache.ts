import { getCacheManager, generateCacheKey, CACHE_NAMESPACES, TTL_CONFIG, type CacheTag } from '../cache-manager';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { DbCustomer } from '@/lib/supabase/database';

const cache = getCacheManager();
const CUSTOMER_TTL = TTL_CONFIG.MEDIUM; // 30 minutes

/**
 * Get customer by ID with caching
 */
export async function getCachedCustomer(customerId: string): Promise<DbCustomer | null> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CUSTOMER, 'detail', customerId);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) {
        console.error('Error fetching customer:', error);
        return null;
      }

      return data as DbCustomer;
    },
    CUSTOMER_TTL,
    [
      { namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'detail', id: customerId },
      { namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'all' },
    ]
  );
}

/**
 * Get customer by email with caching
 */
export async function getCachedCustomerByEmail(email: string): Promise<DbCustomer | null> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CUSTOMER, 'email', email);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching customer by email:', error);
        return null;
      }

      return data as DbCustomer;
    },
    CUSTOMER_TTL,
    [
      { namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'email', id: email },
      { namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'all' },
    ]
  );
}

/**
 * Get customer by phone with caching
 */
export async function getCachedCustomerByPhone(phone: string): Promise<DbCustomer | null> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CUSTOMER, 'phone', phone);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data, error } = await client
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error) {
        console.error('Error fetching customer by phone:', error);
        return null;
      }

      return data as DbCustomer;
    },
    CUSTOMER_TTL,
    [
      { namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'phone', id: phone },
      { namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'all' },
    ]
  );
}

/**
 * Get all customers with caching and filters
 */
export async function getCachedCustomers(filters?: {
  search?: string;
  tag?: string;
  minSpent?: number;
  minOrders?: number;
}): Promise<DbCustomer[]> {
  const filterKey = JSON.stringify(filters || {});
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CUSTOMER, 'list', filterKey);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      let query = client.from('customers').select('*');

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.tag) {
        query = query.contains('tags', [filters.tag]);
      }

      if (filters?.minSpent !== undefined) {
        query = query.gte('total_spent', filters.minSpent);
      }

      if (filters?.minOrders !== undefined) {
        query = query.gte('total_orders', filters.minOrders);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        return [];
      }

      return data as DbCustomer[];
    },
    CUSTOMER_TTL,
    [{ namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'all' }]
  );
}

/**
 * Get top customers by spending with caching
 */
export async function getCachedTopCustomers(limit = 10): Promise<DbCustomer[]> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CUSTOMER, 'top', String(limit));

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data, error } = await client
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top customers:', error);
        return [];
      }

      return data as DbCustomer[];
    },
    CUSTOMER_TTL,
    [{ namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'analytics' }]
  );
}

/**
 * Get customer segments with caching
 */
export async function getCachedCustomerSegments(): Promise<{
  vip: number;
  loyal: number;
  regular: number;
  new: number;
}> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CUSTOMER, 'segments');

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) {
        return { vip: 0, loyal: 0, regular: 0, new: 0 };
      }

      const [vipCount, loyalCount, regularCount, newCount] = await Promise.all([
        client
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .gte('total_spent', 10000),
        client
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .gte('total_orders', 10)
          .lt('total_spent', 10000),
        client
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .gte('total_orders', 3)
          .lt('total_orders', 10),
        client
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .lt('total_orders', 3),
      ]);

      return {
        vip: vipCount.count || 0,
        loyal: loyalCount.count || 0,
        regular: regularCount.count || 0,
        new: newCount.count || 0,
      };
    },
    CUSTOMER_TTL,
    [{ namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'segments' }]
  );
}

/**
 * Get customer orders count with caching
 */
export async function getCachedCustomerOrdersCount(customerId: string): Promise<number> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.CUSTOMER, 'orders-count', customerId);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return 0;

      const { count, error } = await client
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      if (error) {
        console.error('Error counting customer orders:', error);
        return 0;
      }

      return count || 0;
    },
    TTL_CONFIG.SHORT, // 5 minutes - orders change frequently
    [
      { namespace: CACHE_NAMESPACES.CUSTOMER, resource: 'orders', id: customerId },
    ]
  );
}

/**
 * Invalidate customer cache
 */
export async function invalidateCustomerCache(customerId?: string): Promise<void> {
  if (customerId) {
    // Get customer details first to invalidate email/phone caches
    const customer = await getCachedCustomer(customerId);

    // Invalidate specific customer
    await cache.invalidateByTag({
      namespace: CACHE_NAMESPACES.CUSTOMER,
      resource: 'detail',
      id: customerId,
    });

    // Invalidate orders count
    await cache.invalidateByTag({
      namespace: CACHE_NAMESPACES.CUSTOMER,
      resource: 'orders',
      id: customerId,
    });

    // Invalidate email and phone lookups if available
    if (customer) {
      if (customer.email) {
        await cache.invalidateByTag({
          namespace: CACHE_NAMESPACES.CUSTOMER,
          resource: 'email',
          id: customer.email,
        });
      }

      if (customer.phone) {
        await cache.invalidateByTag({
          namespace: CACHE_NAMESPACES.CUSTOMER,
          resource: 'phone',
          id: customer.phone,
        });
      }
    }
  }

  // Invalidate all customers and analytics
  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.CUSTOMER,
    resource: 'all',
  });

  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.CUSTOMER,
    resource: 'analytics',
  });

  await cache.invalidateByTag({
    namespace: CACHE_NAMESPACES.CUSTOMER,
    resource: 'segments',
  });
}

/**
 * Warm customer cache with VIP customers
 */
export async function warmCustomerCache(): Promise<void> {
  // Pre-load top customers
  await getCachedTopCustomers(50);

  // Pre-load customer segments
  await getCachedCustomerSegments();

  console.log('Customer cache warmed successfully');
}
