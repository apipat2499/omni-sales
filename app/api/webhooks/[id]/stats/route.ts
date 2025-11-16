import { NextRequest, NextResponse } from 'next/server';
import { WebhookManager } from '@/lib/webhooks/webhook-manager';

/**
 * GET /api/webhooks/:id/stats
 * Get webhook statistics
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const stats = await WebhookManager.getWebhookStats(params.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error(`GET /api/webhooks/${params.id}/stats error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get webhook stats',
      },
      { status: 500 }
    );
  }
}
