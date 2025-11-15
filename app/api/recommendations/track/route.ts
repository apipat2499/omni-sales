import { NextRequest, NextResponse } from 'next/server';
import {
  trackRecommendationClick,
  trackRecommendationConversion,
  getRecommendationClicks,
  getRecommendationConversions,
} from '@/lib/recommendations/service';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      customerId,
      recommendationId,
      productId,
      trackingType,
      deviceType,
      orderId,
      revenue,
    } = await req.json();

    if (!userId || !customerId || !productId || !trackingType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (trackingType === 'click') {
      const success = await trackRecommendationClick(
        userId,
        customerId,
        recommendationId,
        productId,
        deviceType
      );

      if (!success) {
        return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Click tracked' }, { status: 201 });
    } else if (trackingType === 'conversion') {
      if (!orderId || !revenue) {
        return NextResponse.json(
          { error: 'Missing orderId or revenue for conversion' },
          { status: 400 }
        );
      }

      const success = await trackRecommendationConversion(
        userId,
        customerId,
        recommendationId,
        productId,
        orderId,
        revenue
      );

      if (!success) {
        return NextResponse.json({ error: 'Failed to track conversion' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Conversion tracked' }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid tracking type' }, { status: 400 });
  } catch (error) {
    console.error('Error tracking recommendation event:', error);
    return NextResponse.json(
      { error: 'Failed to track recommendation event' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get('customerId');
    const trackType = req.nextUrl.searchParams.get('type'); // 'clicks' or 'conversions'
    const days = req.nextUrl.searchParams.get('days') || '30';

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    }

    if (trackType === 'clicks') {
      const clicks = await getRecommendationClicks(customerId, parseInt(days));
      return NextResponse.json({ data: clicks, total: clicks.length });
    } else if (trackType === 'conversions') {
      // Need userId for conversions - get from request header or parameter
      const userId = req.nextUrl.searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }

      const conversions = await getRecommendationConversions(userId, parseInt(days));
      return NextResponse.json({ data: conversions, total: conversions.length });
    }

    return NextResponse.json({ error: 'Invalid tracking type' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
