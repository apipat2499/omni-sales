import { NextRequest, NextResponse } from 'next/server';
import { getEmailMarketingDashboardData } from '@/lib/email/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const dashboardData = await getEmailMarketingDashboardData(userId);

    return NextResponse.json({
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching email marketing dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
