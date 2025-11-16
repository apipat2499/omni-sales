import { NextRequest, NextResponse } from 'next/server';
import { getEmailAnalyticsTracker } from '@/lib/email/analytics/tracker';

/**
 * GET /api/email/track/click
 * Track email link clicks and redirect
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('mid');
    const url = searchParams.get('url');

    if (!messageId || !url) {
      return NextResponse.json(
        { error: 'Missing required parameters: mid, url' },
        { status: 400 }
      );
    }

    const tracker = getEmailAnalyticsTracker();
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;

    // Track the click event (don't await to make redirect faster)
    tracker.trackEvent({
      messageId,
      email: '', // Will be looked up from email_logs
      event: 'click',
      url,
      timestamp: new Date().toISOString(),
      userAgent,
      ipAddress,
    });

    // Redirect to the original URL
    return NextResponse.redirect(decodeURIComponent(url), 302);
  } catch (error: any) {
    console.error('Error tracking email click:', error);

    // Try to redirect anyway
    const url = new URL(request.url).searchParams.get('url');
    if (url) {
      return NextResponse.redirect(decodeURIComponent(url), 302);
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
