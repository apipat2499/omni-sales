/**
 * AI Chatbot API - Conversation History
 * GET /api/ai/chat/history - Get conversation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validation
    if (!conversationId && !customerId) {
      return NextResponse.json(
        { error: 'Either conversationId or customerId is required' },
        { status: 400 }
      );
    }

    // Get conversation history
    if (conversationId) {
      // Get specific conversation with messages
      const { data, error } = await supabase
        .rpc('get_chatbot_conversation_with_messages', {
          p_conversation_id: conversationId,
        });

      if (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json(
          { error: 'Failed to fetch conversation' },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      const result = data[0];
      return NextResponse.json({
        conversation: result.conversation_data,
        messages: result.messages,
      });
    } else if (customerId) {
      // Get customer's conversation history
      const { data, error } = await supabase
        .rpc('get_customer_chatbot_history', {
          p_customer_id: customerId,
          p_limit: limit,
        });

      if (error) {
        console.error('Error fetching customer history:', error);
        return NextResponse.json(
          { error: 'Failed to fetch customer history' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        conversations: data || [],
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
