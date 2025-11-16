/**
 * Marketplace Order Sync Module
 * Synchronizes orders from Shopee and Lazada to the omni-sales system
 */

import { createClient } from '@supabase/supabase-js';
import { ShopeeClient, ShopeeOrderDetail } from './shopee/client';
import { LazadaClient, LazadaOrder, LazadaOrderItem } from './lazada/client';

export interface SyncConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export interface MarketplaceConnection {
  id: string;
  marketplace_type: 'shopee' | 'lazada';
  shop_id: string;
  shop_name: string;
  access_token: string;
  refresh_token?: string;
  credentials: Record<string, any>;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderSyncResult {
  success: boolean;
  marketplace: string;
  shop_id: string;
  orders_synced: number;
  orders_failed: number;
  errors: string[];
  synced_at: string;
}

/**
 * Order Sync Service
 */
export class OrderSyncService {
  private supabase;

  constructor(config: SyncConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Sync orders from Shopee
   */
  async syncShopeeOrders(connection: MarketplaceConnection): Promise<OrderSyncResult> {
    const result: OrderSyncResult = {
      success: false,
      marketplace: 'shopee',
      shop_id: connection.shop_id,
      orders_synced: 0,
      orders_failed: 0,
      errors: [],
      synced_at: new Date().toISOString(),
    };

    try {
      const client = new ShopeeClient({
        partnerId: connection.credentials.partner_id,
        partnerKey: connection.credentials.partner_key,
        shopId: parseInt(connection.shop_id),
        accessToken: connection.access_token,
      });

      // Get orders from last sync or last 7 days
      const lastSync = connection.last_sync_at
        ? new Date(connection.last_sync_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const timeFrom = Math.floor(lastSync.getTime() / 1000);
      const timeTo = Math.floor(Date.now() / 1000);

      let cursor = '';
      let hasMore = true;

      while (hasMore) {
        const orderListResponse = await client.getOrderList({
          time_range_field: 'update_time',
          time_from: timeFrom,
          time_to: timeTo,
          page_size: 50,
          cursor: cursor || undefined,
        });

        if (orderListResponse.order_list && orderListResponse.order_list.length > 0) {
          const orderSns = orderListResponse.order_list.map((o) => o.order_sn);
          const orderDetailsResponse = await client.getOrderDetails(orderSns);

          for (const order of orderDetailsResponse.order_list) {
            try {
              await this.saveShopeeOrder(order, connection.id);
              result.orders_synced++;
            } catch (error) {
              result.orders_failed++;
              result.errors.push(`Failed to save order ${order.order_sn}: ${error}`);
              console.error(`Error saving Shopee order ${order.order_sn}:`, error);
            }
          }
        }

        hasMore = orderListResponse.more;
        cursor = orderListResponse.next_cursor;
      }

      // Update last sync time
      await this.updateLastSync(connection.id);

      result.success = true;
    } catch (error) {
      result.errors.push(`Shopee sync failed: ${error}`);
      console.error('Shopee order sync error:', error);
    }

    return result;
  }

  /**
   * Sync orders from Lazada
   */
  async syncLazadaOrders(connection: MarketplaceConnection): Promise<OrderSyncResult> {
    const result: OrderSyncResult = {
      success: false,
      marketplace: 'lazada',
      shop_id: connection.shop_id,
      orders_synced: 0,
      orders_failed: 0,
      errors: [],
      synced_at: new Date().toISOString(),
    };

    try {
      const client = new LazadaClient({
        appKey: connection.credentials.app_key,
        appSecret: connection.credentials.app_secret,
        accessToken: connection.access_token,
        region: connection.credentials.region || 'TH',
      });

      // Get orders from last sync or last 7 days
      const lastSync = connection.last_sync_at
        ? new Date(connection.last_sync_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const ordersResponse = await client.getOrders({
        updated_after: lastSync.toISOString(),
        limit: 100,
      });

      if (ordersResponse.data && ordersResponse.data.orders) {
        for (const order of ordersResponse.data.orders) {
          try {
            // Get order items
            const itemsResponse = await client.getOrderItems(order.order_id);
            await this.saveLazadaOrder(order, itemsResponse.data, connection.id);
            result.orders_synced++;
          } catch (error) {
            result.orders_failed++;
            result.errors.push(`Failed to save order ${order.order_number}: ${error}`);
            console.error(`Error saving Lazada order ${order.order_number}:`, error);
          }
        }
      }

      // Update last sync time
      await this.updateLastSync(connection.id);

      result.success = true;
    } catch (error) {
      result.errors.push(`Lazada sync failed: ${error}`);
      console.error('Lazada order sync error:', error);
    }

    return result;
  }

  /**
   * Save Shopee order to database
   */
  private async saveShopeeOrder(
    shopeeOrder: ShopeeOrderDetail,
    connectionId: string
  ): Promise<void> {
    // Check if order already exists
    const { data: existingOrder } = await this.supabase
      .from('marketplace_orders')
      .select('id')
      .eq('marketplace_order_id', shopeeOrder.order_sn)
      .eq('marketplace_type', 'shopee')
      .single();

    const orderData = {
      marketplace_type: 'shopee',
      marketplace_connection_id: connectionId,
      marketplace_order_id: shopeeOrder.order_sn,
      marketplace_order_number: shopeeOrder.order_sn,
      status: this.mapShopeeStatus(shopeeOrder.order_status),
      customer_name: shopeeOrder.recipient_address?.name || 'Unknown',
      customer_email: null,
      customer_phone: shopeeOrder.recipient_address?.phone || '',
      total_amount: shopeeOrder.total_amount,
      currency: shopeeOrder.currency || 'THB',
      payment_method: shopeeOrder.payment_method || 'unknown',
      shipping_address: JSON.stringify(shopeeOrder.recipient_address),
      shipping_fee: shopeeOrder.actual_shipping_fee || 0,
      items: JSON.stringify(shopeeOrder.item_list),
      metadata: JSON.stringify({
        region: shopeeOrder.region,
        cod: shopeeOrder.cod,
        shipping_carrier: shopeeOrder.shipping_carrier,
        tracking_number: null,
        buyer_username: shopeeOrder.buyer_username,
        note: shopeeOrder.note,
        pay_time: shopeeOrder.pay_time,
      }),
      marketplace_created_at: new Date(shopeeOrder.create_time * 1000).toISOString(),
      marketplace_updated_at: new Date(shopeeOrder.update_time * 1000).toISOString(),
    };

    if (existingOrder) {
      // Update existing order
      await this.supabase
        .from('marketplace_orders')
        .update({
          ...orderData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOrder.id);
    } else {
      // Create new order
      const { data: marketplaceOrder, error: orderError } = await this.supabase
        .from('marketplace_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create corresponding order in main orders table
      await this.createOmniSalesOrder(marketplaceOrder);
    }
  }

  /**
   * Save Lazada order to database
   */
  private async saveLazadaOrder(
    lazadaOrder: LazadaOrder,
    items: LazadaOrderItem[],
    connectionId: string
  ): Promise<void> {
    // Check if order already exists
    const { data: existingOrder } = await this.supabase
      .from('marketplace_orders')
      .select('id')
      .eq('marketplace_order_id', lazadaOrder.order_id.toString())
      .eq('marketplace_type', 'lazada')
      .single();

    const orderData = {
      marketplace_type: 'lazada',
      marketplace_connection_id: connectionId,
      marketplace_order_id: lazadaOrder.order_id.toString(),
      marketplace_order_number: lazadaOrder.order_number,
      status: this.mapLazadaStatus(lazadaOrder.status),
      customer_name: `${lazadaOrder.customer_first_name} ${lazadaOrder.customer_last_name}`,
      customer_email: null,
      customer_phone: lazadaOrder.address_shipping?.phone || '',
      total_amount: parseFloat(lazadaOrder.price),
      currency: 'THB',
      payment_method: lazadaOrder.payment_method || 'unknown',
      shipping_address: JSON.stringify(lazadaOrder.address_shipping),
      shipping_fee: lazadaOrder.shipping_fee || 0,
      items: JSON.stringify(items),
      metadata: JSON.stringify({
        voucher: lazadaOrder.voucher,
        promised_shipping_time: lazadaOrder.promised_shipping_time,
        remarks: lazadaOrder.remarks,
        statuses: lazadaOrder.statuses,
        items_count: lazadaOrder.items_count,
      }),
      marketplace_created_at: lazadaOrder.created_at,
      marketplace_updated_at: lazadaOrder.updated_at,
    };

    if (existingOrder) {
      // Update existing order
      await this.supabase
        .from('marketplace_orders')
        .update({
          ...orderData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOrder.id);
    } else {
      // Create new order
      const { data: marketplaceOrder, error: orderError } = await this.supabase
        .from('marketplace_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create corresponding order in main orders table
      await this.createOmniSalesOrder(marketplaceOrder);
    }
  }

  /**
   * Create order in main orders table
   */
  private async createOmniSalesOrder(marketplaceOrder: any): Promise<void> {
    const items = JSON.parse(marketplaceOrder.items);
    const shippingAddress = JSON.parse(marketplaceOrder.shipping_address);

    // Create order
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        customer_name: marketplaceOrder.customer_name,
        customer_email: marketplaceOrder.customer_email,
        customer_phone: marketplaceOrder.customer_phone,
        status: marketplaceOrder.status,
        total_amount: marketplaceOrder.total_amount,
        payment_status: 'paid',
        payment_method: marketplaceOrder.payment_method,
        shipping_address: marketplaceOrder.shipping_address,
        marketplace_order_id: marketplaceOrder.id,
        notes: `Imported from ${marketplaceOrder.marketplace_type.toUpperCase()} - Order #${marketplaceOrder.marketplace_order_number}`,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating omni-sales order:', orderError);
      return;
    }

    // Create order items
    const orderItems = items.map((item: any) => {
      if (marketplaceOrder.marketplace_type === 'shopee') {
        return {
          order_id: order.id,
          product_name: item.item_name,
          sku: item.item_sku || item.model_sku,
          quantity: item.model_quantity_purchased,
          price: item.model_discounted_price,
          total: item.model_discounted_price * item.model_quantity_purchased,
        };
      } else {
        // Lazada
        return {
          order_id: order.id,
          product_name: item.name,
          sku: item.sku,
          quantity: 1,
          price: item.paid_price,
          total: item.paid_price,
        };
      }
    });

    await this.supabase.from('order_items').insert(orderItems);

    // Update marketplace order with omni-sales order reference
    await this.supabase
      .from('marketplace_orders')
      .update({ omni_sales_order_id: order.id })
      .eq('id', marketplaceOrder.id);
  }

  /**
   * Map Shopee order status to internal status
   */
  private mapShopeeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      UNPAID: 'pending',
      READY_TO_SHIP: 'processing',
      PROCESSED: 'processing',
      SHIPPED: 'shipped',
      TO_CONFIRM_RECEIVE: 'shipped',
      IN_CANCEL: 'cancelled',
      CANCELLED: 'cancelled',
      TO_RETURN: 'returned',
      COMPLETED: 'completed',
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Map Lazada order status to internal status
   */
  private mapLazadaStatus(status: string): string {
    const statusMap: Record<string, string> = {
      unpaid: 'pending',
      pending: 'processing',
      ready_to_ship: 'processing',
      shipped: 'shipped',
      delivered: 'completed',
      canceled: 'cancelled',
      returned: 'returned',
      failed: 'cancelled',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  }

  /**
   * Update last sync timestamp for connection
   */
  private async updateLastSync(connectionId: string): Promise<void> {
    await this.supabase
      .from('marketplace_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);
  }

  /**
   * Get all active marketplace connections
   */
  async getActiveConnections(): Promise<MarketplaceConnection[]> {
    const { data, error } = await this.supabase
      .from('marketplace_connections')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching connections:', error);
      return [];
    }

    return data as MarketplaceConnection[];
  }

  /**
   * Sync all active marketplace connections
   */
  async syncAllMarketplaces(): Promise<OrderSyncResult[]> {
    const connections = await this.getActiveConnections();
    const results: OrderSyncResult[] = [];

    for (const connection of connections) {
      try {
        let result: OrderSyncResult;

        if (connection.marketplace_type === 'shopee') {
          result = await this.syncShopeeOrders(connection);
        } else if (connection.marketplace_type === 'lazada') {
          result = await this.syncLazadaOrders(connection);
        } else {
          continue;
        }

        results.push(result);

        // Log sync result
        await this.logSyncResult(result);
      } catch (error) {
        console.error(`Error syncing ${connection.marketplace_type} shop ${connection.shop_id}:`, error);
        results.push({
          success: false,
          marketplace: connection.marketplace_type,
          shop_id: connection.shop_id,
          orders_synced: 0,
          orders_failed: 0,
          errors: [`Sync failed: ${error}`],
          synced_at: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Log sync result to database
   */
  private async logSyncResult(result: OrderSyncResult): Promise<void> {
    await this.supabase.from('marketplace_sync_logs').insert({
      marketplace_type: result.marketplace,
      shop_id: result.shop_id,
      success: result.success,
      orders_synced: result.orders_synced,
      orders_failed: result.orders_failed,
      errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
      synced_at: result.synced_at,
    });
  }
}
