import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch orders for this customer
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch order items count for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { count } = await supabase
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', order.id);

        return {
          ...order,
          itemCount: count || 0,
        };
      })
    );

    // Fetch communications for this customer
    const { data: communications, error: commsError } = await supabase
      .from('customer_communications')
      .select('*')
      .eq('customer_id', id)
      .order('sent_at', { ascending: false });

    if (commsError && commsError.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist, which is fine
      console.error('Error fetching communications:', commsError);
    }

    // Build timeline events
    const timeline: any[] = [];

    // Add order events
    ordersWithItems.forEach((order) => {
      timeline.push({
        id: `order-${order.id}`,
        type: 'order',
        date: order.created_at,
        title: `สั่งซื้อสินค้า`,
        description: `สร้างออเดอร์ใหม่ จำนวน ${order.itemCount} รายการ`,
        metadata: {
          orderId: order.id,
          total: parseFloat(order.total),
          status: order.status,
          itemCount: order.itemCount,
        },
      });
    });

    // Add communication events
    (communications || []).forEach((comm) => {
      timeline.push({
        id: `comm-${comm.id}`,
        type: 'communication',
        date: comm.sent_at,
        title:
          comm.channel === 'email'
            ? `ส่งอีเมล${comm.template_name ? `: ${comm.template_name}` : ''}`
            : `ส่ง SMS${comm.template_name ? `: ${comm.template_name}` : ''}`,
        description: comm.content || comm.subject || 'ส่งข้อความถึงลูกค้า',
        metadata: {
          channel: comm.channel,
          subject: comm.subject,
          templateName: comm.template_name,
          status: comm.status,
        },
      });
    });

    // Sort timeline by date (newest first)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error fetching customer timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer timeline' },
      { status: 500 }
    );
  }
}
