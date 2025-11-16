import { NextRequest, NextResponse } from 'next/server';
import { getCRMDashboardData } from '@/lib/crm/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const dashboardData = await getCRMDashboardData(userId);

    return NextResponse.json({
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching CRM dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch CRM dashboard' }, { status: 500 });
  }
}
