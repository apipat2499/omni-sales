import { NextRequest, NextResponse } from 'next/server';
import { getReturns, getReturnStatistics } from '@/lib/returns/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const status = req.nextUrl.searchParams.get('status');
    const includeStats = req.nextUrl.searchParams.get('includeStats');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const returns = await getReturns(userId, status || undefined);
    let stats = null;

    if (includeStats === 'true') {
      stats = await getReturnStatistics(userId);
    }

    return NextResponse.json({
      data: returns,
      stats: stats,
      total: returns.length,
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}
