/**
 * GET /api/chat/queue - Get chat queue (pending conversations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatManager } from '@/lib/chat/chat-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId') || undefined;

    const chatManager = getChatManager();
    const queue = await chatManager.getAgentQueue(agentId);

    return NextResponse.json({
      success: true,
      queue,
    });
  } catch (error: any) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}
