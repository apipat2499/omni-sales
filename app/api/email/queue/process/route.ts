import { NextRequest, NextResponse } from 'next/server';
import { getEmailQueueProcessor } from '@/lib/email/queue-processor';

/**
 * POST /api/email/queue/process
 * Manually trigger email queue processing
 */
export async function POST(request: NextRequest) {
  try {
    const processor = getEmailQueueProcessor();
    const result = await processor.processOnce();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
    });
  } catch (error: any) {
    console.error('Error processing email queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process queue' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/queue/process
 * Get queue processor status
 */
export async function GET(request: NextRequest) {
  try {
    const processor = getEmailQueueProcessor();
    const status = processor.getStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error('Error getting queue status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}
