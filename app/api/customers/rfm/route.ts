import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { calculateRFMScore } from '@/lib/customer/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const rfmSegment = req.nextUrl.searchParams.get('segment');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('customer_rfm_scores')
      .select(
        `
        *,
        customer_profiles (
          id,
          email,
          first_name,
          last_name,
          lifetime_value,
          total_spent
        )
      `
      )
      .eq('user_id', userId);

    if (rfmSegment) {
      query = query.eq('rfm_segment', rfmSegment);
    }

    const { data: scores, error } = await query.order('overall_rfm_score', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching RFM scores:', error);
      // Return empty data instead of error for missing tables
      return NextResponse.json({
        scores: [],
        distribution: {},
      });
    }

    // Calculate segment distribution
    const segmentDistribution: Record<string, number> = {};
    scores?.forEach((score: any) => {
      segmentDistribution[score.rfm_segment] =
        (segmentDistribution[score.rfm_segment] || 0) + 1;
    });

    return NextResponse.json({
      scores: scores || [],
      distribution: segmentDistribution,
    });
  } catch (error) {
    console.error('Error fetching RFM scores:', error);
    // Return empty data instead of error
    return NextResponse.json({
      scores: [],
      distribution: {},
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, customerId, days } = await req.json();

    if (!userId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const score = await calculateRFMScore(userId, customerId, days || 365);

    if (!score) {
      return NextResponse.json(
        { error: 'Failed to calculate RFM score' },
        { status: 500 }
      );
    }

    return NextResponse.json(score, { status: 201 });
  } catch (error) {
    console.error('Error calculating RFM score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate RFM score' },
      { status: 500 }
    );
  }
}
