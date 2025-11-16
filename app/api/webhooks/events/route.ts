import { NextRequest, NextResponse } from 'next/server';
import { WebhookManager } from '@/lib/webhooks/webhook-manager';

/**
 * GET /api/webhooks/events
 * Get all webhook events
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('event_type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const events = await WebhookManager.getWebhookEvents(
      undefined,
      eventType as any,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        limit,
        offset,
        count: events.length,
      },
    });
  } catch (error) {
    console.error('GET /api/webhooks/events error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get webhook events',
      },
      { status: 500 }
    );
  }
}
