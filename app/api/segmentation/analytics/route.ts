import { NextRequest, NextResponse } from 'next/server';
import { getBehavioralAnalytics, getSegmentPerformance } from '@/lib/segmentation/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const segmentId = req.nextUrl.searchParams.get('segmentId');
    const days = req.nextUrl.searchParams.get('days') || '30';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (segmentId) {
      const performance = await getSegmentPerformance(segmentId, parseInt(days));
      return NextResponse.json({ data: performance, total: performance.length });
    } else {
      const analytics = await getBehavioralAnalytics(userId, parseInt(days));
      return NextResponse.json({ data: analytics, total: analytics.length });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
