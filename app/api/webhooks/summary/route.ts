import { NextRequest, NextResponse } from 'next/server';
import { WebhookManager } from '@/lib/webhooks/webhook-manager';

/**
 * GET /api/webhooks/summary
 * Get webhook delivery summary for all webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || undefined;
    const summary = await WebhookManager.getWebhookDeliverySummary(tenantId);

    return NextResponse.json({
      success: true,
      data: summary,
      count: summary.length,
    });
  } catch (error) {
    console.error('GET /api/webhooks/summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get webhook summary',
      },
      { status: 500 }
    );
  }
}
