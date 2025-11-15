import { NextRequest, NextResponse } from 'next/server';
import { reportReview } from '@/lib/review/service';

export async function POST(req: NextRequest) {
  try {
    const { userId, reviewId, reporterEmail, reason, description } =
      await req.json();

    if (!userId || !reviewId || !reporterEmail || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validReasons = [
      'inappropriate',
      'fake',
      'spam',
      'offensive',
      'factually_incorrect',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid report reason' },
        { status: 400 }
      );
    }

    const report = await reportReview(
      userId,
      reviewId,
      reporterEmail,
      reason,
      description
    );

    if (!report) {
      return NextResponse.json(
        { error: 'Failed to report review' },
        { status: 500 }
      );
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error reporting review:', error);
    return NextResponse.json(
      { error: 'Failed to report review' },
      { status: 500 }
    );
  }
}
