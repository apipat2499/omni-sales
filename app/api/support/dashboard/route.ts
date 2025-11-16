import { NextRequest, NextResponse } from 'next/server';
import { getSupportDashboardData } from '@/lib/support/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const dashboardData = await getSupportDashboardData(userId);

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching support dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support dashboard data' },
      { status: 500 }
    );
  }
}
