/**
 * GET /api/chat/:conversationId/messages - Get conversation messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatManager } from '@/lib/chat/chat-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const chatManager = getChatManager();
    const messages = await chatManager.getConversationMessages(conversationId, limit, offset);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
