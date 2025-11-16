import { NextRequest, NextResponse } from 'next/server';
import {
  getRecommendationAnalytics,
  getProductPerformance,
} from '@/lib/recommendations/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const productId = req.nextUrl.searchParams.get('productId');
    const days = req.nextUrl.searchParams.get('days') || '30';

    if (!userId && !productId) {
      return NextResponse.json(
        { error: 'Missing userId or productId' },
        { status: 400 }
      );
    }

    if (productId) {
      // Get performance metrics for a specific product
      const performance = await getProductPerformance(productId, parseInt(days));
      return NextResponse.json({ data: performance, total: performance.length });
    } else {
      // Get overall recommendation analytics
      const analytics = await getRecommendationAnalytics(userId as string, parseInt(days));
      return NextResponse.json({ data: analytics, total: analytics.length });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
