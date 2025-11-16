/**
 * GET /api/chat/:conversationId - Get conversation details
 * PUT /api/chat/:conversationId - Update conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatManager } from '@/lib/chat/chat-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const chatManager = getChatManager();

    const result = await chatManager.getConversationWithMessages(conversationId);

    if (!result) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const body = await request.json();
    const { status, agentId } = body;

    const chatManager = getChatManager();

    if (status) {
      const conversation = await chatManager.updateConversationStatus(conversationId, status);
      return NextResponse.json({
        success: true,
        conversation,
      });
    }

    if (agentId) {
      const conversation = await chatManager.assignToAgent(conversationId, agentId);
      return NextResponse.json({
        success: true,
        conversation,
      });
    }

    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
