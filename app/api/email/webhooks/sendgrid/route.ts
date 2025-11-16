import { NextRequest, NextResponse } from 'next/server';
import { getEmailAnalyticsTracker } from '@/lib/email/analytics/tracker';
import { getBounceHandler } from '@/lib/email/deliverability/bounce-handler';

/**
 * POST /api/email/webhooks/sendgrid
 * Handle SendGrid webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const events = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const tracker = getEmailAnalyticsTracker();
    const bounceHandler = getBounceHandler();

    // Process each event
    for (const event of events) {
      const { event: eventType, email, sg_message_id, timestamp, url, reason } = event;

      // Extract message ID (SendGrid format)
      const messageId = sg_message_id?.split('.')[0] || '';

      switch (eventType) {
        case 'delivered':
          await tracker.trackEvent({
            messageId,
            email,
            event: 'delivered',
            timestamp: new Date(timestamp * 1000).toISOString(),
          });
          break;

        case 'open':
          await tracker.trackEvent({
            messageId,
            email,
            event: 'open',
            timestamp: new Date(timestamp * 1000).toISOString(),
          });
          break;

        case 'click':
          await tracker.trackEvent({
            messageId,
            email,
            event: 'click',
            url,
            timestamp: new Date(timestamp * 1000).toISOString(),
          });
          break;

        case 'bounce':
        case 'dropped':
          await bounceHandler.handleBounce({
            messageId,
            email,
            bounceType: event.type === 'hard' ? 'hard' : 'soft',
            bounceReason: reason,
            timestamp: new Date(timestamp * 1000).toISOString(),
          });
          break;

        case 'spamreport':
          await bounceHandler.handleBounce({
            messageId,
            email,
            bounceType: 'complaint',
            bounceReason: 'spam complaint',
            timestamp: new Date(timestamp * 1000).toISOString(),
          });
          break;

        case 'unsubscribe':
          await tracker.trackEvent({
            messageId,
            email,
            event: 'unsubscribe',
            timestamp: new Date(timestamp * 1000).toISOString(),
          });
          break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing SendGrid webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
