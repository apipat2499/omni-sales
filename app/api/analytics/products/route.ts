import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch orders with items in the period
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        subtotal
      `)
      .gte('created_at', startDate.toISOString());

    if (ordersError) throw ordersError;

    // Fetch all order items for these orders
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*');

    if (itemsError) throw itemsError;

    // Fetch all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) throw productsError;

    // Calculate product performance
    interface ProductPerformance {
      productId: string;
      productName: string;
      sku: string;
      category: string;
      totalSold: number;
      totalRevenue: number;
      averagePrice: number;
      currentStock: number;
      costPerUnit: number;
      profit: number;
      profitMargin: number;
    }

    const productStats: Record<string, ProductPerformance> = {};

    // Initialize product stats
    products?.forEach((product) => {
      productStats[product.id] = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        totalSold: 0,
        totalRevenue: 0,
        averagePrice: parseFloat(product.price),
        currentStock: product.stock,
        costPerUnit: parseFloat(product.cost),
        profit: 0,
        profitMargin: 0,
      };
    });

    // Aggregate sales from order items
    orderItems?.forEach((item) => {
      const productId = item.product_id;
      if (productStats[productId]) {
        const revenue = parseFloat(item.price) * item.quantity;
        productStats[productId].totalSold += item.quantity;
        productStats[productId].totalRevenue += revenue;
      }
    });

    // Calculate profit and profit margin
    Object.values(productStats).forEach((product) => {
      product.profit = product.totalRevenue - (product.costPerUnit * product.totalSold);
      product.profitMargin = product.totalRevenue > 0
        ? (product.profit / product.totalRevenue) * 100
        : 0;
    });

    // Sort by revenue
    const topProducts = Object.values(productStats)
      .filter((p) => p.totalSold > 0)
      .sort((a, b) => b.totalRevenue - a.revenue);

    // Group by category
    const categoryPerformance: Record<string, {
      category: string;
      totalSold: number;
      totalRevenue: number;
      productCount: number;
    }> = {};

    Object.values(productStats).forEach((product) => {
      if (!categoryPerformance[product.category]) {
        categoryPerformance[product.category] = {
          category: product.category,
          totalSold: 0,
          totalRevenue: 0,
          productCount: 0,
        };
      }
      categoryPerformance[product.category].totalSold += product.totalSold;
      categoryPerformance[product.category].totalRevenue += product.totalRevenue;
      categoryPerformance[product.category].productCount += 1;
    });

    const categories = Object.values(categoryPerformance)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json({
      topProducts: topProducts.slice(0, 10),
      categoryPerformance: categories,
      summary: {
        totalProducts: products?.length || 0,
        totalSold: Object.values(productStats).reduce((sum, p) => sum + p.totalSold, 0),
        totalRevenue: Object.values(productStats).reduce((sum, p) => sum + p.totalRevenue, 0),
        averageProfit Margin: Object.values(productStats)
          .filter((p) => p.totalSold > 0)
          .reduce((sum, p, _, arr) => sum + p.profitMargin / arr.length, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics' },
      { status: 500 }
    );
  }
}
