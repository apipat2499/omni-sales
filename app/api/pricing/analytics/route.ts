import { NextRequest, NextResponse } from 'next/server';
import {
  getPricingAnalytics,
  getPricingHistory,
  recordPricingAnalytics,
} from '@/lib/pricing/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const productId = req.nextUrl.searchParams.get('productId');
    const days = req.nextUrl.searchParams.get('days') || '30';

    if (productId) {
      // Get pricing history for specific product
      const history = await getPricingHistory(productId, parseInt(days));
      return NextResponse.json({ data: history, total: history.length });
    } else if (userId) {
      // Get overall pricing analytics
      const analytics = await getPricingAnalytics(userId, parseInt(days));
      return NextResponse.json({ data: analytics, total: analytics.length });
    }

    return NextResponse.json(
      { error: 'Missing userId or productId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching pricing analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing analytics' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      date,
      strategyId,
      totalProductsAffected,
      totalPriceChanges,
      averagePriceChange,
      revenueImpact,
      marginImpact,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const analytics = await recordPricingAnalytics(userId, {
      date: date ? new Date(date) : new Date(),
      strategyId,
      totalProductsAffected,
      totalPriceChanges,
      averagePriceChange,
      revenueImpact,
      marginImpact,
    });

    if (!analytics) {
      return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error recording pricing analytics:', error);
    return NextResponse.json(
      { error: 'Failed to record pricing analytics' },
      { status: 500 }
    );
  }
}
