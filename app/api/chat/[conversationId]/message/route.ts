/**
 * POST /api/chat/:conversationId/message - Send a message
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatManager } from '@/lib/chat/chat-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const body = await request.json();
    const { senderId, senderName, senderType, content, messageType, attachments, metadata } =
      body;

    // Validation
    if (!senderId || !senderName || !senderType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: senderId, senderName, senderType, content' },
        { status: 400 }
      );
    }

    if (!['customer', 'agent', 'system'].includes(senderType)) {
      return NextResponse.json(
        { error: 'Invalid senderType. Must be: customer, agent, or system' },
        { status: 400 }
      );
    }

    const chatManager = getChatManager();
    const message = await chatManager.sendMessage({
      conversationId,
      senderId,
      senderName,
      senderType,
      content,
      messageType,
      attachments,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
