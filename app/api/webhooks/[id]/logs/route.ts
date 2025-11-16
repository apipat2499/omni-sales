import { NextRequest, NextResponse } from 'next/server';
import { WebhookManager } from '@/lib/webhooks/webhook-manager';

/**
 * GET /api/webhooks/:id/logs
 * Get delivery logs for a webhook
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const logs = await WebhookManager.getWebhookDeliveryLogs(params.id, limit, offset);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        count: logs.length,
      },
    });
  } catch (error) {
    console.error(`GET /api/webhooks/${params.id}/logs error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get delivery logs',
      },
      { status: 500 }
    );
  }
}
