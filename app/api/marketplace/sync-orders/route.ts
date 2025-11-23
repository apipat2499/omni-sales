import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { ShopeeClient } from '@/lib/marketplace/shopee-client';
import { LazadaClient } from '@/lib/marketplace/lazada-client';
import { apiRequireAuth } from '@/lib/middleware/authMiddleware';

export async function POST(req: NextRequest) {
  // Require authentication for marketplace sync
  const { user, error } = apiRequireAuth(req);
  if (error) return error;

  try {
    const { connectionId, userId } = await req.json();

    if (!connectionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('marketplace_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', userId)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Log sync start
    const { data: syncLog } = await supabase
      .from('marketplace_sync_logs')
      .insert({
        user_id: userId,
        connection_id: connectionId,
        sync_type: 'orders',
        status: 'pending',
        started_at: new Date(),
      })
      .select()
      .single();

    try {
      let orders: any[] = [];
      let itemsSynced = 0;
      let itemsFailed = 0;

      // Fetch orders based on platform
      const platform = connection.platform_code?.toLowerCase();

      if (platform === 'shopee') {
        // Initialize Shopee client
        const shopeeClient = new ShopeeClient(
          connection.shop_id || '',
          connection.shop_token || connection.access_token || '',
          process.env.SHOPEE_PARTNER_ID || '',
          process.env.SHOPEE_PARTNER_KEY || ''
        );

        // Fetch orders from Shopee (last 24 hours)
        const from24HoursAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
        orders = await shopeeClient.getOrders(from24HoursAgo);
      } else if (platform === 'lazada') {
        // Initialize Lazada client
        const lazadaClient = new LazadaClient(
          process.env.LAZADA_APP_KEY || '',
          process.env.LAZADA_APP_SECRET || ''
        );

        // Fetch orders from Lazada (last 24 hours)
        const from24HoursAgo = Math.floor(Date.now() - 24 * 60 * 60 * 1000);
        orders = await lazadaClient.getOrders(from24HoursAgo);
      }

      // Save orders to database
      for (const order of orders) {
        try {
          // Check if order already exists
          const { data: existingOrder } = await supabase
            .from('marketplace_orders')
            .select('id')
            .eq('marketplace_order_id', order.orderId)
            .eq('platform_code', connection.platform_code)
            .single();

          const orderData = {
            user_id: userId,
            connection_id: connectionId,
            marketplace_order_id: order.orderId,
            platform_code: connection.platform_code,
            customer_name: order.customerName,
            customer_email: order.customerEmail || null,
            customer_phone: order.customerPhone || null,
            order_status: order.orderStatus,
            payment_status: order.paymentStatus,
            total_amount: order.totalAmount,
            currency: 'THB',
            shipping_address: order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
            items_count: order.items?.length || 0,
            raw_data: JSON.stringify(order),
            synced_at: new Date(),
          };

          if (existingOrder) {
            // Update existing order
            await supabase
              .from('marketplace_orders')
              .update(orderData)
              .eq('id', existingOrder.id);
          } else {
            // Insert new order
            await supabase
              .from('marketplace_orders')
              .insert(orderData);
          }

          itemsSynced++;
        } catch (err) {
          console.error('Error saving order:', err);
          itemsFailed++;
        }
      }

      // Update sync log with success
      const duration = Date.now() - startTime;
      await supabase
        .from('marketplace_sync_logs')
        .update({
          status: 'completed',
          items_synced: itemsSynced,
          items_failed: itemsFailed,
          sync_duration_ms: duration,
          completed_at: new Date(),
        })
        .eq('id', syncLog?.id);

      // Update connection's last_synced_at
      await supabase
        .from('marketplace_connections')
        .update({
          last_synced_at: new Date(),
          status: 'active',
        })
        .eq('id', connectionId);

      return NextResponse.json({
        success: true,
        itemsSynced,
        itemsFailed,
        duration: `${duration}ms`,
        message: `Successfully synced ${itemsSynced} orders${itemsFailed > 0 ? ` (${itemsFailed} failed)` : ''}`,
      });
    } catch (error) {
      console.error('Sync error:', error);

      // Update sync log with error
      const duration = Date.now() - startTime;
      await supabase
        .from('marketplace_sync_logs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          sync_duration_ms: duration,
          completed_at: new Date(),
        })
        .eq('id', syncLog?.id);

      // Update connection status to error
      await supabase
        .from('marketplace_connections')
        .update({
          status: 'error',
        })
        .eq('id', connectionId);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to sync orders',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync orders' },
      { status: 500 }
    );
  }
}
