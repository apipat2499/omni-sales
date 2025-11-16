import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsDashboardData } from '@/lib/analytics/service';
import { getCachedDashboardAnalytics } from '@/lib/cache/strategies/analytics-cache';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const dateParam = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Use cached dashboard analytics if date range is provided
    if (startDate && endDate) {
      const analytics = await getCachedDashboardAnalytics(
        new Date(startDate),
        new Date(endDate)
      );

      return NextResponse.json(
        {
          data: analytics,
          startDate,
          endDate,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    // Fallback to original implementation for backward compatibility
    const dashboardData = await getAnalyticsDashboardData(userId, dateParam);

    return NextResponse.json(
      {
        data: dashboardData,
        date: dateParam,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
