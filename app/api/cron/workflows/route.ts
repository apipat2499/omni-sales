/**
 * Workflow Cron Job
 * Run scheduled workflows and resume waiting executions
 * This should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { scheduleWorkflows, resumeWaitingExecutions } from '@/lib/automation/workflow-engine';

/**
 * GET /api/cron/workflows
 * Execute scheduled workflows and resume waiting executions
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Running workflow scheduler...');

    // Run scheduled workflows
    await scheduleWorkflows();
    console.log('[Cron] Scheduled workflows processed');

    // Resume waiting executions
    await resumeWaitingExecutions();
    console.log('[Cron] Waiting executions resumed');

    return NextResponse.json({
      success: true,
      message: 'Workflow cron job completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Workflow cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
