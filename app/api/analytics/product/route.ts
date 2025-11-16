import { NextRequest, NextResponse } from 'next/server';
import { getTopProducts, recordProductAnalytics } from '@/lib/analytics/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const topProducts = await getTopProducts(userId, date, limit);

    return NextResponse.json({
      data: topProducts,
      total: topProducts.length,
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch product analytics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, productId, analyticsDate, unitsSold, revenue, costOfGoods, grossProfit, grossMargin, averageRating, reviewCount, returnRate, stockLevel, turnoverRate, inventoryValue } = body;

    if (!userId || !productId || !analyticsDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const analytics = await recordProductAnalytics(userId, {
      productId,
      analyticsDate,
      unitsSold,
      revenue,
      costOfGoods,
      grossProfit,
      grossMargin,
      averageRating,
      reviewCount,
      returnRate,
      stockLevel,
      turnoverRate,
      inventoryValue,
    });

    if (!analytics) {
      return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error recording product analytics:', error);
    return NextResponse.json({ error: 'Failed to record product analytics' }, { status: 500 });
  }
}
