/**
 * POST /api/marketplace/webhooks/shopee
 * Handle Shopee webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Verify Shopee webhook signature
 */
function verifyShopeeWebhook(body: string, signature: string, partnerKey: string): boolean {
  const hmac = crypto.createHmac('sha256', partnerKey);
  hmac.update(body);
  const calculatedSignature = hmac.digest('hex');

  return calculatedSignature === signature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('authorization') || '';
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
      marketplace_type: 'shopee',
      shop_id: payload.shop_id?.toString() || null,
      event_type: payload.code || 'unknown',
      payload: payload,
      processed: false,
    });

    if (webhookError) {
      console.error('Error storing Shopee webhook:', webhookError);
    }

    // Process webhook based on event type
    const eventCode = payload.code;

    switch (eventCode) {
      case 1: // Order status update
        await handleOrderUpdate(payload, supabase);
        break;

      case 2: // Order shipped
        await handleOrderShipped(payload, supabase);
        break;

      case 3: // Order completed
        await handleOrderCompleted(payload, supabase);
        break;

      case 4: // Order cancelled
        await handleOrderCancelled(payload, supabase);
        break;

      default:
        console.log(`Unhandled Shopee webhook event: ${eventCode}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing Shopee webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleOrderUpdate(payload: any, supabase: any) {
  try {
    const orderSn = payload.data?.ordersn;

    if (!orderSn) {
      console.error('No order SN in webhook payload');
      return;
    }

    // Update order status in database
    await supabase
      .from('marketplace_orders')
      .update({
        status: mapShopeeStatus(payload.data?.order_status),
        updated_at: new Date().toISOString(),
      })
      .eq('marketplace_order_id', orderSn)
      .eq('marketplace_type', 'shopee');

    console.log(`Updated Shopee order ${orderSn}`);
  } catch (error) {
    console.error('Error handling Shopee order update:', error);
  }
}

async function handleOrderShipped(payload: any, supabase: any) {
  try {
    const orderSn = payload.data?.ordersn;

    if (!orderSn) return;

    await supabase
      .from('marketplace_orders')
      .update({
        status: 'shipped',
        updated_at: new Date().toISOString(),
      })
      .eq('marketplace_order_id', orderSn)
      .eq('marketplace_type', 'shopee');

    console.log(`Shopee order ${orderSn} shipped`);
  } catch (error) {
    console.error('Error handling Shopee order shipped:', error);
  }
}

async function handleOrderCompleted(payload: any, supabase: any) {
  try {
    const orderSn = payload.data?.ordersn;

    if (!orderSn) return;

    await supabase
      .from('marketplace_orders')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('marketplace_order_id', orderSn)
      .eq('marketplace_type', 'shopee');

    console.log(`Shopee order ${orderSn} completed`);
  } catch (error) {
    console.error('Error handling Shopee order completed:', error);
  }
}

async function handleOrderCancelled(payload: any, supabase: any) {
  try {
    const orderSn = payload.data?.ordersn;

    if (!orderSn) return;

    await supabase
      .from('marketplace_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('marketplace_order_id', orderSn)
      .eq('marketplace_type', 'shopee');

    console.log(`Shopee order ${orderSn} cancelled`);
  } catch (error) {
    console.error('Error handling Shopee order cancelled:', error);
  }
}

function mapShopeeStatus(status: string): string {
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
