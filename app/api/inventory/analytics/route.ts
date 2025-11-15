import { NextRequest, NextResponse } from 'next/server';
import { getInventoryAnalytics, getTotalInventoryValue } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const days = req.nextUrl.searchParams.get('days') || '30';

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const analytics = await getInventoryAnalytics(userId, parseInt(days));
    const totalValue = await getTotalInventoryValue(userId);

    return NextResponse.json({ data: analytics, totalValue, total: analytics.length });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
