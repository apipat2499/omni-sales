import { NextRequest, NextResponse } from 'next/server';
import { voteOnReview } from '@/lib/review/service';

export async function POST(req: NextRequest) {
  try {
    const { userId, reviewId, voterEmail, voteType } = await req.json();

    if (!userId || !reviewId || !voterEmail || !voteType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['helpful', 'unhelpful'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid voteType' },
        { status: 400 }
      );
    }

    const vote = await voteOnReview(userId, reviewId, voterEmail, voteType);

    if (!vote) {
      return NextResponse.json(
        { error: 'Failed to record vote or vote already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    console.error('Error voting on review:', error);
    return NextResponse.json(
      { error: 'Failed to vote on review' },
      { status: 500 }
    );
  }
}
