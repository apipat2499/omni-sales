/**
 * AI Chatbot API - Escalate to Human
 * POST /api/ai/chat/escalate - Escalate conversation to human agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getChatManager } from '@/lib/chat/chat-manager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, customerId, customerName, customerEmail, reason, message } = body;

    // Validation
    if (!conversationId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, customerId' },
        { status: 400 }
      );
    }

    // Get chatbot conversation
    const { data: chatbotConv, error: convError } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !chatbotConv) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Mark chatbot conversation as escalated
    const { error: updateError } = await supabase
      .from('chatbot_conversations')
      .update({
        escalated: true,
        escalation_reason: reason || 'user_request',
        escalated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json(
        { error: 'Failed to escalate conversation' },
        { status: 500 }
      );
    }

    // Create a live chat conversation for human agent
    const chatManager = getChatManager();
    const liveConversation = await chatManager.startConversation({
      customerId,
      customerName: customerName || chatbotConv.customer_name,
      customerEmail: customerEmail || chatbotConv.customer_email,
      channel: chatbotConv.channel === 'web' ? 'web' : 'mobile',
      subject: `Escalated from AI Chatbot - ${reason || 'User Request'}`,
      metadata: {
        escalatedFromChatbot: true,
        chatbotConversationId: conversationId,
        escalationReason: reason,
        context: chatbotConv.context,
      },
    });

    // Add system message about escalation
    await chatManager.sendMessage({
      conversationId: liveConversation.id,
      senderId: 'system',
      senderName: 'System',
      senderType: 'system',
      content: `This conversation was escalated from the AI chatbot. Reason: ${reason || 'User request'}`,
      messageType: 'system',
    });

    // If there's a message from the customer, add it
    if (message) {
      await chatManager.sendMessage({
        conversationId: liveConversation.id,
        senderId: customerId,
        senderName: customerName || chatbotConv.customer_name,
        senderType: 'customer',
        content: message,
      });
    }

    // Get recent chatbot messages to provide context
    const { data: recentMessages } = await supabase
      .from('chatbot_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentMessages && recentMessages.length > 0) {
      const contextMessage = `Recent conversation history:\n${recentMessages
        .reverse()
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')}`;

      await chatManager.sendMessage({
        conversationId: liveConversation.id,
        senderId: 'system',
        senderName: 'System',
        senderType: 'system',
        content: contextMessage,
        messageType: 'system',
      });
    }

    // Update chatbot conversation with live chat reference
    await supabase
      .from('chatbot_conversations')
      .update({
        escalated_to: liveConversation.agentId,
      })
      .eq('id', conversationId);

    return NextResponse.json({
      success: true,
      liveConversationId: liveConversation.id,
      message: 'Conversation escalated successfully. An agent will assist you shortly.',
    });
  } catch (error) {
    console.error('Escalation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
