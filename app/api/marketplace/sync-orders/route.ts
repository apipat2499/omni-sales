import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
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
      // TODO: Implement actual API calls based on platform
      // For now, this is a placeholder that simulates syncing orders
      const orders: any[] = [];
      let itemsSynced = 0;
      let itemsFailed = 0;

      // In production, call actual marketplace APIs here
      // Example: const orders = await fetchShopeeOrders(connection);

      // Save orders to database
      for (const order of orders) {
        try {
          await supabase.from('marketplace_orders').upsert({
            user_id: userId,
            connection_id: connectionId,
            marketplace_order_id: order.orderId,
            platform_code: connection.platform_code,
            customer_name: order.customerName,
            customer_email: order.customerEmail,
            customer_phone: order.customerPhone,
            order_status: order.orderStatus,
            payment_status: order.paymentStatus,
            total_amount: order.totalAmount,
            currency: 'THB',
            shipping_address: order.shippingAddress,
            items_count: order.items?.length || 0,
            raw_data: order,
            synced_at: new Date(),
          });

          itemsSynced++;
        } catch (err) {
          console.error('Error saving order:', err);
          itemsFailed++;
        }
      }

      // Update sync log
      const duration = Date.now() - startTime;
      await supabase
        .from('marketplace_sync_logs')
        .update({
          status: 'success',
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
        })
        .eq('id', connectionId);

      return NextResponse.json({
        success: true,
        itemsSynced,
        itemsFailed,
        duration: `${duration}ms`,
      });
    } catch (error) {
      console.error('Sync error:', error);

      // Update sync log with error
      await supabase
        .from('marketplace_sync_logs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date(),
        })
        .eq('id', syncLog?.id);

      return NextResponse.json(
        { error: 'Failed to sync orders' },
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
