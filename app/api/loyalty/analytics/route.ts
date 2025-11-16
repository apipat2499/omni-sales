import { NextRequest, NextResponse } from 'next/server';
import {
  getLoyaltyAnalytics,
  recordLoyaltyAnalytics,
} from '@/lib/loyalty/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const programId = req.nextUrl.searchParams.get('programId');
    const days = req.nextUrl.searchParams.get('days');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const analytics = await getLoyaltyAnalytics(
      userId,
      programId || undefined
    );

    return NextResponse.json({
      data: analytics,
      total: analytics.length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      loyaltyProgramId,
      totalActiveMembers,
      newMembers,
      pointsIssued,
      pointsRedeemed,
      pointsExpired,
      rewardsClaimed,
      rewardsUsed,
      engagementRate,
      repeatPurchaseRate,
      revenueFromLoyaltyPurchases,
    } = await req.json();

    if (!userId || !loyaltyProgramId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analytics = await recordLoyaltyAnalytics(
      userId,
      loyaltyProgramId,
      {
        totalActiveMembers,
        newMembers,
        pointsIssued,
        pointsRedeemed,
        pointsExpired,
        rewardsClaimed,
        rewardsUsed,
        engagementRate,
        repeatPurchaseRate,
        revenueFromLoyaltyPurchases,
      }
    );

    if (!analytics) {
      return NextResponse.json(
        { error: 'Failed to record analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error recording analytics:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics' },
      { status: 500 }
    );
  }
}
