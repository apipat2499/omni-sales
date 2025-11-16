import { NextRequest, NextResponse } from 'next/server';
import { getComplaintAnalytics, getComplaintStatistics } from '@/lib/complaints/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const days = req.nextUrl.searchParams.get('days') || '30';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const analytics = await getComplaintAnalytics(userId, parseInt(days));
    const statistics = await getComplaintStatistics(userId);

    return NextResponse.json({
      data: analytics,
      statistics: statistics,
      total: analytics.length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
