import { NextRequest, NextResponse } from 'next/server';
import { getEmailAnalyticsTracker } from '@/lib/email/analytics/tracker';

/**
 * GET /api/email/track/open
 * Track email opens via tracking pixel
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('mid');

    if (!messageId) {
      // Return transparent 1x1 pixel even on error
      return new NextResponse(
        Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'base64'
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          },
        }
      );
    }

    const tracker = getEmailAnalyticsTracker();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;

    await tracker.trackEvent({
      messageId,
      email: '', // Will be looked up from email_logs
      event: 'open',
      timestamp: new Date().toISOString(),
      userAgent,
      ipAddress,
    });

    // Return transparent 1x1 pixel
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      }
    );
  } catch (error: any) {
    console.error('Error tracking email open:', error);

    // Return transparent pixel even on error
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      }
    );
  }
}
