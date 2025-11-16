import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { SubmitFeedbackDTO } from '@/types/help';

// POST /api/help/articles/:id/feedback - Submit feedback
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;
    const body: SubmitFeedbackDTO = await request.json();

    // Validate required fields
    if (body.is_helpful === undefined) {
      return NextResponse.json(
        { error: 'is_helpful field is required' },
        { status: 400 }
      );
    }

    // Get user info from request
    const userAgent = request.headers.get('user-agent');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    // Prepare feedback data
    const feedbackData = {
      article_id: articleId,
      is_helpful: body.is_helpful,
      feedback_text: body.feedback_text || null,
      user_id: body.user_id || null,
      user_email: body.user_email || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('help_article_feedback')
      .insert([feedbackData])
      .select()
      .single();

    if (feedbackError) {
      console.error('Error submitting feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to submit feedback', details: feedbackError.message },
        { status: 500 }
      );
    }

    // Update article helpful counts
    const fieldToUpdate = body.is_helpful ? 'helpful_count' : 'not_helpful_count';

    const { error: updateError } = await supabase.rpc('update_feedback_count', {
      article_uuid: articleId,
      is_helpful_vote: body.is_helpful
    });

    // If RPC doesn't exist, use manual update
    if (updateError) {
      await supabase
        .from('help_articles')
        .update({
          [fieldToUpdate]: supabase.raw(`${fieldToUpdate} + 1`)
        })
        .eq('id', articleId);
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/help/articles/:id/feedback:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
