/**
 * POST /api/chat/start - Start a new conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatManager } from '@/lib/chat/chat-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, customerName, customerEmail, channel, subject, metadata } = body;

    // Validation
    if (!customerId || !customerName || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, customerName, channel' },
        { status: 400 }
      );
    }

    if (!['web', 'mobile', 'email'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be: web, mobile, or email' },
        { status: 400 }
      );
    }

    const chatManager = getChatManager();
    const conversation = await chatManager.startConversation({
      customerId,
      customerName,
      customerEmail,
      channel,
      subject,
      metadata,
    });

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start conversation' },
      { status: 500 }
    );
  }
}
