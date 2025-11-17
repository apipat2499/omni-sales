import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const activities: any[] = [];

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total, created_at, customers(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    recentOrders?.forEach((order) => {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `ออเดอร์ใหม่ #${order.id}`,
        description: `${(order.customers as any)?.name || 'ลูกค้า'} สั่งซื้อ ${formatCurrency(order.total)}`,
        time: order.created_at,
        link: `/orders`,
      });
    });

    // Get recent customers
    const { data: recentCustomers } = await supabase
      .from('customers')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    recentCustomers?.forEach((customer) => {
      activities.push({
        id: `customer-${customer.id}`,
        type: 'customer',
        title: 'ลูกค้าใหม่',
        description: `${customer.name} เพิ่มเข้าระบบ`,
        time: customer.created_at,
        link: `/customers`,
      });
    });

    // Get low stock products
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('id, name, stock')
      .lte('stock', 10)
      .order('stock', { ascending: true })
      .limit(3);

    lowStockProducts?.forEach((product) => {
      activities.push({
        id: `low-stock-${product.id}`,
        type: 'low_stock',
        title: 'สินค้าใกล้หมด',
        description: `${product.name} เหลือ ${product.stock} ชิ้น`,
        time: new Date().toISOString(),
        link: `/products`,
      });
    });

    // Sort by time (most recent first)
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      activities: activities.slice(0, 15),
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
