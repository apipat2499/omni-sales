import { NextRequest, NextResponse } from 'next/server';
import { getEmailDatabaseService } from '@/lib/email/database';
import { queueEmail } from '@/lib/email/sender';

/**
 * POST /api/email/queue
 * Add an email to the queue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      to,
      subject,
      html,
      text,
      templateId,
      campaignId,
      scheduledFor,
      relatedOrderId,
      relatedCustomerId,
      metadata,
    } = body;

    // Validate required fields
    if (!userId || !to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, to, subject, html' },
        { status: 400 }
      );
    }

    // Queue email
    const result = await queueEmail({
      userId,
      to,
      subject,
      html,
      text: text || '',
      templateId,
      campaignId,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      relatedOrderId,
      relatedCustomerId,
      metadata,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        queueId: result.queueId,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to queue email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in /api/email/queue:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/queue
 * Get pending emails in queue
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const maxRetries = parseInt(searchParams.get('maxRetries') || '3');

    const dbService = getEmailDatabaseService();
    const pendingEmails = await dbService.getPendingEmails(limit, maxRetries);

    return NextResponse.json({
      success: true,
      emails: pendingEmails,
      count: pendingEmails.length,
    });
  } catch (error: any) {
    console.error('Error getting queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get queue' },
      { status: 500 }
    );
  }
}
