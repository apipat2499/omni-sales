/**
 * AI Chatbot API - Main Chat Endpoint
 * POST /api/ai/chat - Send message to AI chatbot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getChatbotEngine } from '@/lib/ai/chatbot/chatbot-engine';
import { executeIntentAction } from '@/lib/ai/chatbot/intents';
import type { ChatRequest } from '@/lib/ai/chatbot/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Rate limiting map (in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { conversationId, customerId, customerName, customerEmail, message, channel, context } = body;

    // Validation
    if (!customerId || !customerName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, customerName, message' },
        { status: 400 }
      );
    }

    // Rate limiting by customer ID
    const rateLimitKey = `chatbot:${customerId}`;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending another message.' },
        { status: 429 }
      );
    }

    // Content filtering - check for spam or inappropriate content
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 2000 characters.' },
        { status: 400 }
      );
    }

    // Get or create conversation
    let dbConversationId = conversationId;
    let sessionId = conversationId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (!conversationId) {
      // Create new conversation in database
      const { data: newConversation, error: convError } = await supabase
        .from('chatbot_conversations')
        .insert({
          customer_id: customerId,
          customer_name: customerName,
          customer_email: customerEmail,
          session_id: sessionId,
          channel: channel || 'web',
          context: context || {},
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      dbConversationId = newConversation.id;
    }

    // Enhance context with customer data
    const enhancedContext = await enrichCustomerContext(customerId, context);

    // Get chatbot response
    const chatbot = getChatbotEngine();
    const response = await chatbot.chat({
      conversationId: dbConversationId,
      customerId,
      customerName,
      customerEmail,
      message,
      channel: channel || 'web',
      context: enhancedContext,
    });

    // Save user message to database
    const { error: userMsgError } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: dbConversationId,
        role: 'user',
        content: message,
        intent: response.intent,
        intent_confidence: response.intentConfidence,
        entities: response.entities || {},
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // Save assistant response to database
    const { error: assistantMsgError } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: dbConversationId,
        role: 'assistant',
        content: response.response,
        metadata: response.metadata || {},
      });

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    // Log intent if detected
    if (response.intent) {
      const { error: intentError } = await supabase
        .from('intent_logs')
        .insert({
          conversation_id: dbConversationId,
          message_id: response.messageId,
          intent: response.intent,
          confidence: response.intentConfidence || 'low',
          entities: response.entities || {},
        });

      if (intentError) {
        console.error('Error logging intent:', intentError);
      }

      // Execute intent action if not escalated
      if (!response.escalated && response.intent !== 'general_inquiry') {
        try {
          const actionResult = await executeIntentAction(
            response.intent,
            response.entities || {},
            customerId
          );

          // Update intent log with action result
          await supabase
            .from('intent_logs')
            .update({
              action_taken: response.intent,
              action_result: actionResult,
            })
            .eq('message_id', response.messageId);
        } catch (error) {
          console.error('Error executing intent action:', error);
        }
      }
    }

    // Handle escalation
    if (response.escalated) {
      await supabase
        .from('chatbot_conversations')
        .update({
          escalated: true,
          escalation_reason: 'user_request',
          escalated_at: new Date().toISOString(),
        })
        .eq('id', dbConversationId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Enrich customer context with order history and preferences
 */
async function enrichCustomerContext(
  customerId: string,
  baseContext?: any
): Promise<any> {
  try {
    // Get customer info
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    // Get recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get previous intents from this session
    const { data: previousMessages } = await supabase
      .from('chatbot_messages')
      .select('intent')
      .eq('conversation_id', baseContext?.conversationId || '')
      .not('intent', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    const previousIntents = previousMessages?.map(m => m.intent).filter(Boolean) || [];

    return {
      ...baseContext,
      customerInfo: customer,
      orderHistory: orders || [],
      previousIntents,
    };
  } catch (error) {
    console.error('Error enriching context:', error);
    return baseContext || {};
  }
}
