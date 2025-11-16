import { NextRequest, NextResponse } from 'next/server';
import { getEmailAnalyticsTracker } from '@/lib/email/analytics/tracker';

/**
 * GET /api/email/analytics
 * Get email analytics for campaigns or date range
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const tracker = getEmailAnalyticsTracker();

    if (campaignId) {
      // Get analytics for specific campaign
      const analytics = await tracker.getCampaignAnalytics(campaignId);

      if (!analytics) {
        return NextResponse.json(
          { error: 'Analytics not found for campaign' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        analytics,
      });
    } else if (userId && startDate && endDate) {
      // Get analytics for date range
      const analytics = await tracker.getAnalyticsByDateRange(
        userId,
        startDate,
        endDate
      );

      return NextResponse.json({
        success: true,
        analytics,
      });
    } else {
      return NextResponse.json(
        {
          error:
            'Either campaignId or userId+startDate+endDate parameters are required',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in /api/email/analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
