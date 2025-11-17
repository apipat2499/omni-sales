import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const searchTerm = `%${query}%`;
    const results: any[] = [];

    // Search products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, category')
      .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
      .limit(5);

    products?.forEach((product) => {
      results.push({
        type: 'product',
        id: product.id,
        title: product.name,
        subtitle: `${product.sku} • ${product.category}`,
        link: '/products',
      });
    });

    // Search orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, status, customers(name)')
      .or(`id.eq.${parseInt(query) || 0}`)
      .limit(5);

    orders?.forEach((order) => {
      results.push({
        type: 'order',
        id: order.id,
        title: `คำสั่งซื้อ #${order.id}`,
        subtitle: `${(order.customers as any)?.name || 'ลูกค้า'} • ฿${order.total.toLocaleString()}`,
        link: '/orders',
      });
    });

    // Search customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
      .limit(5);

    customers?.forEach((customer) => {
      results.push({
        type: 'customer',
        id: customer.id,
        title: customer.name,
        subtitle: `${customer.email} • ${customer.phone}`,
        link: '/customers',
      });
    });

    // Search discounts
    const { data: discounts } = await supabase
      .from('discounts')
      .select('id, code, type, value')
      .ilike('code', searchTerm)
      .limit(5);

    discounts?.forEach((discount) => {
      results.push({
        type: 'discount',
        id: discount.id,
        title: discount.code,
        subtitle: `${discount.type === 'percentage' ? discount.value + '%' : '฿' + discount.value} ส่วนลด`,
        link: '/discounts',
      });
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
