import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, queueEmail } from '@/lib/email/sender';
import { getEmailDatabaseService } from '@/lib/email/database';

/**
 * POST /api/email/test
 * Test email integration with database logging
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, to, testType = 'send' } = body;

    if (!userId || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, to' },
        { status: 400 }
      );
    }

    const testEmail = {
      userId,
      to,
      subject: 'Test Email - Database Integration',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #333;">Email Integration Test</h1>
            <p>This is a test email to verify the email integration with database logging.</p>
            <p><strong>Test Type:</strong> ${testType}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This email was sent from the Omni Sales email system.
              All emails are logged in the database for tracking and analytics.
            </p>
          </body>
        </html>
      `,
      text: `
        Email Integration Test

        This is a test email to verify the email integration with database logging.

        Test Type: ${testType}
        Timestamp: ${new Date().toISOString()}

        This email was sent from the Omni Sales email system.
        All emails are logged in the database for tracking and analytics.
      `,
      metadata: {
        test: true,
        testType,
        timestamp: new Date().toISOString(),
      },
    };

    if (testType === 'queue') {
      // Test queuing
      const result = await queueEmail(testEmail);

      return NextResponse.json({
        success: result.success,
        message: 'Email queued successfully',
        queueId: result.queueId,
        error: result.error,
      });
    } else {
      // Test direct send
      const result = await sendEmail(testEmail);

      return NextResponse.json({
        success: result.success,
        message: 'Email sent successfully',
        messageId: result.messageId,
        logId: result.logId,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error in email test:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/test
 * Get email statistics for testing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const dbService = getEmailDatabaseService();

    // Get email stats
    const stats = await dbService.getEmailStats(userId);

    // Get pending queue count
    const pendingEmails = await dbService.getPendingEmails(1000);
    const userPendingEmails = pendingEmails.filter(
      (email) => email.user_id === userId
    );

    return NextResponse.json({
      success: true,
      stats,
      queueStats: {
        totalPending: pendingEmails.length,
        userPending: userPendingEmails.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting email test stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
