/**
 * AI Chatbot API - Training Data
 * POST /api/ai/training - Add training data
 * GET /api/ai/training - Get training data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// POST - Add training data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, userMessage, expectedResponse, entities, userId } = body;

    // Validation
    if (!intent || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: intent, userMessage' },
        { status: 400 }
      );
    }

    // Valid intents
    const validIntents = [
      'order_lookup',
      'shipping_tracking',
      'return_request',
      'refund_request',
      'product_recommendation',
      'faq',
      'escalate_to_human',
      'general_inquiry',
      'complaint',
      'account_management',
    ];

    if (!validIntents.includes(intent)) {
      return NextResponse.json(
        { error: `Invalid intent. Must be one of: ${validIntents.join(', ')}` },
        { status: 400 }
      );
    }

    // Add training data
    const { data, error } = await supabase
      .from('chatbot_training_data')
      .insert({
        intent,
        user_message: userMessage,
        expected_response: expectedResponse,
        entities: entities || {},
        approved: false, // Requires approval
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding training data:', error);
      return NextResponse.json(
        { error: 'Failed to add training data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trainingData: data,
      message: 'Training data added successfully',
    });
  } catch (error) {
    console.error('Training data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Get training data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const intent = searchParams.get('intent');
    const approved = searchParams.get('approved');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('chatbot_training_data')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (intent) {
      query = query.eq('intent', intent);
    }

    if (approved !== null && approved !== undefined) {
      query = query.eq('approved', approved === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching training data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch training data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      trainingData: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Training data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH - Approve training data
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, approved, userId } = body;

    // Validation
    if (!id || approved === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: id, approved' },
        { status: 400 }
      );
    }

    // Update training data
    const { data, error } = await supabase
      .from('chatbot_training_data')
      .update({
        approved,
        approved_by: userId,
        approved_at: approved ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training data:', error);
      return NextResponse.json(
        { error: 'Failed to update training data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trainingData: data,
      message: approved ? 'Training data approved' : 'Training data rejected',
    });
  } catch (error) {
    console.error('Training data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
