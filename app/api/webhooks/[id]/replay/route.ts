import { NextRequest, NextResponse } from 'next/server';
import { WebhookManager } from '@/lib/webhooks/webhook-manager';
import { WebhookDeliveryService } from '@/lib/webhooks/webhook-delivery';

/**
 * GET /api/webhooks/:id/replay
 * Get failed deliveries that can be replayed
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const failures = await WebhookManager.getFailedDeliveries(params.id);

    return NextResponse.json({
      success: true,
      data: failures,
      count: failures.length,
    });
  } catch (error) {
    console.error(`GET /api/webhooks/${params.id}/replay error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get failed deliveries',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/:id/replay
 * Replay failed events for a webhook
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { failure_id } = body;

    if (!failure_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'failure_id is required',
        },
        { status: 400 }
      );
    }

    const deliveryService = new WebhookDeliveryService();
    const delivery = await deliveryService.replayFailedEvent(failure_id);

    return NextResponse.json({
      success: true,
      data: delivery,
      message: 'Failed event replayed successfully',
    });
  } catch (error) {
    console.error(`POST /api/webhooks/${params.id}/replay error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to replay event',
      },
      { status: 500 }
    );
  }
}
