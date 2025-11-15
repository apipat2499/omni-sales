import { NextRequest, NextResponse } from 'next/server';
import { submitComplaintFeedback, getComplaintFeedback } from '@/lib/complaints/service';

export async function GET(req: NextRequest) {
  try {
    const complaintId = req.nextUrl.searchParams.get('complaintId');

    if (!complaintId) {
      return NextResponse.json({ error: 'Missing complaintId' }, { status: 400 });
    }

    const feedback = await getComplaintFeedback(complaintId);

    return NextResponse.json({
      data: feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaintId, customerId, satisfactionRating, responseQualityRating, resolutionEffectivenessRating, communicationRating, overallExperienceRating, feedbackComments, wouldRecommend, npsScore, followUpRequired, followUpReason } = body;

    if (!complaintId || !customerId || !satisfactionRating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const feedback = await submitComplaintFeedback({
      complaintId,
      customerId,
      satisfactionRating,
      responseQualityRating,
      resolutionEffectivenessRating,
      communicationRating,
      overallExperienceRating,
      feedbackComments,
      wouldRecommend,
      npsScore,
      followUpRequired,
      followUpReason,
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
