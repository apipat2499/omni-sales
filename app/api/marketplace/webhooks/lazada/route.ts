/**
 * POST /api/marketplace/webhooks/lazada
 * Handle Lazada webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store webhook event
    const { error: webhookError } = await supabase.from('marketplace_webhooks').insert({
      marketplace_type: 'lazada',
      shop_id: payload.seller_id?.toString() || null,
      event_type: payload.event || 'unknown',
      payload: payload,
      processed: false,
    });

    if (webhookError) {
      console.error('Error storing Lazada webhook:', webhookError);
    }

    // Process webhook based on event type
    const eventType = payload.event;

    switch (eventType) {
      case 'order_created':
        await handleOrderCreated(payload, supabase);
        break;

      case 'order_status_changed':
        await handleOrderStatusChanged(payload, supabase);
        break;

      case 'order_shipped':
        await handleOrderShipped(payload, supabase);
        break;

      case 'order_delivered':
        await handleOrderDelivered(payload, supabase);
        break;

      case 'order_cancelled':
        await handleOrderCancelled(payload, supabase);
        break;

      case 'product_updated':
        await handleProductUpdated(payload, supabase);
        break;

      default:
        console.log(`Unhandled Lazada webhook event: ${eventType}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing Lazada webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleOrderCreated(payload: any, supabase: any) {
  try {
    const orderId = payload.data?.order_id;

    if (!orderId) {
      console.error('No order ID in webhook payload');
      return;
    }

    // Trigger order sync for this specific order
    console.log(`New Lazada order created: ${orderId}`);

    // You can implement immediate sync here or just log it
    // The scheduled sync job will pick it up anyway
  } catch (error) {
    console.error('Error handling Lazada order created:', error);
  }
}

async function handleOrderStatusChanged(payload: any, supabase: any) {
  try {
    const orderId = payload.data?.order_id;
    const newStatus = payload.data?.status;

    if (!orderId || !newStatus) {
      console.error('Missing order ID or status in webhook payload');
      return;
    }

    // Update order status in database
    await supabase
      .from('marketplace_orders')
      .update({
        status: mapLazadaStatus(newStatus),
        updated_at: new Date().toISOString(),
      })
      .eq('marketplace_order_id', orderId.toString())
      .eq('marketplace_type', 'lazada');

    console.log(`Updated Lazada order ${orderId} to status ${newStatus}`);
  } catch (error) {
    console.error('Error handling Lazada order status change:', error);
  }
}

async function handleOrderShipped(payload: any, supabase: any) {
  try {
    const orderId = payload.data?.order_id;

    if (!orderId) return;

    await supabase
      .from('marketplace_orders')
      .update({
        status: 'shipped',
        updated_at: new Date().toISOString(),
      })
      .eq('marketplace_order_id', orderId.toString())
      .eq('marketplace_type', 'lazada');

    console.log(`Lazada order ${orderId} shipped`);
  } catch (error) {
    console.error('Error handling Lazada order shipped:', error);
  }
}

async function handleOrderDelivered(payload: any, supabase: any) {
  try {
    const orderId = payload.data?.order_id;

    if (!orderId) return;

    await supabase
      .from('marketplace_orders')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('marketplace_order_id', orderId.toString())
      .eq('marketplace_type', 'lazada');

    console.log(`Lazada order ${orderId} delivered`);
  } catch (error) {
    console.error('Error handling Lazada order delivered:', error);
  }
}

async function handleOrderCancelled(payload: any, supabase: any) {
  try {
    const orderId = payload.data?.order_id;

    if (!orderId) return;

    await supabase
      .from('marketplace_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('marketplace_order_id', orderId.toString())
      .eq('marketplace_type', 'lazada');

    console.log(`Lazada order ${orderId} cancelled`);
  } catch (error) {
    console.error('Error handling Lazada order cancelled:', error);
  }
}

async function handleProductUpdated(payload: any, supabase: any) {
  try {
    const productId = payload.data?.item_id;

    if (!productId) return;

    console.log(`Lazada product ${productId} updated`);

    // You can implement product sync logic here if needed
  } catch (error) {
    console.error('Error handling Lazada product update:', error);
  }
}

function mapLazadaStatus(status: string): string {
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
