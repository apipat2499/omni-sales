import { NextRequest, NextResponse } from 'next/server';
import {
  getReviewAnalytics,
  recordReviewAnalytics,
} from '@/lib/review/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const productId = req.nextUrl.searchParams.get('productId');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const analytics = await getReviewAnalytics(
      userId,
      productId || undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(analytics);
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
      date,
      productId,
      totalNewReviews,
      approvedReviews,
      rejectedReviews,
      averageRating,
      positiveReviews,
      negativeReviews,
      totalHelpfulVotes,
      responseRate,
    } = await req.json();

    if (!userId || !date || totalNewReviews === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analytics = await recordReviewAnalytics(userId, {
      date: new Date(date),
      productId,
      totalNewReviews,
      approvedReviews,
      rejectedReviews,
      averageRating,
      positiveReviews,
      negativeReviews,
      totalHelpfulVotes,
      responseRate,
    });

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
