import { NextRequest, NextResponse } from 'next/server';
import { getSalesAnalyticsHistory, recordSalesAnalytics } from '@/lib/analytics/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const days = req.nextUrl.searchParams.get('days') || '30';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const analytics = await getSalesAnalyticsHistory(userId, parseInt(days));

    return NextResponse.json({
      data: analytics,
      total: analytics.length,
    });
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch sales analytics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, analyticsDate, totalOrders, totalRevenue, averageOrderValue, totalItemsSold, totalDiscountGiven, totalRefunds, netRevenue, ordersByStatus, revenueByChannel, revenueByCategory, topProducts } = body;

    if (!userId || !analyticsDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const analytics = await recordSalesAnalytics(userId, {
      analyticsDate,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalItemsSold,
      totalDiscountGiven,
      totalRefunds,
      netRevenue,
      ordersByStatus,
      revenueByChannel,
      revenueByCategory,
      topProducts,
    });

    if (!analytics) {
      return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error recording sales analytics:', error);
    return NextResponse.json({ error: 'Failed to record sales analytics' }, { status: 500 });
  }
}
