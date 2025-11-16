import { NextRequest, NextResponse } from 'next/server';
import { WebhookDeliveryService } from '@/lib/webhooks/webhook-delivery';

/**
 * POST /api/webhooks/:id/test
 * Send a test event to a webhook
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deliveryService = new WebhookDeliveryService();
    const delivery = await deliveryService.sendTestEvent(params.id);

    return NextResponse.json({
      success: true,
      data: delivery,
      message: 'Test webhook sent successfully',
    });
  } catch (error) {
    console.error(`POST /api/webhooks/${params.id}/test error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test webhook',
      },
      { status: 500 }
    );
  }
}
