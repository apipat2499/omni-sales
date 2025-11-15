import { NextRequest, NextResponse } from 'next/server';
import { moderateReview, respondToReview, getPendingReviews } from '@/lib/review/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const { reviews, total } = await getPendingReviews(userId, limit, offset);

    return NextResponse.json({
      data: reviews,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { reviewId, action, status, notes, responseText, respondedBy } =
      await req.json();

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: 'Missing reviewId or action' },
        { status: 400 }
      );
    }

    if (action === 'moderate') {
      const success = await moderateReview(
        reviewId,
        status as 'approved' | 'rejected',
        notes
      );
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to moderate review' },
          { status: 500 }
        );
      }
    } else if (action === 'respond') {
      const success = await respondToReview(reviewId, responseText, respondedBy);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to respond to review' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moderating review:', error);
    return NextResponse.json(
      { error: 'Failed to moderate review' },
      { status: 500 }
    );
  }
}
