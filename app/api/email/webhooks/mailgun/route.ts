import { NextRequest, NextResponse } from 'next/server';
import { getEmailAnalyticsTracker } from '@/lib/email/analytics/tracker';
import { getBounceHandler } from '@/lib/email/deliverability/bounce-handler';

/**
 * POST /api/email/webhooks/mailgun
 * Handle Mailgun webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const eventData = formData.get('event-data');

    if (!eventData) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const event = JSON.parse(eventData as string);
    const { event: eventType, recipient, message, timestamp, url } = event;

    const tracker = getEmailAnalyticsTracker();
    const bounceHandler = getBounceHandler();

    const messageId = message?.headers?.['message-id'] || '';
    const email = recipient || '';
    const eventTime = new Date(timestamp * 1000).toISOString();

    switch (eventType) {
      case 'delivered':
        await tracker.trackEvent({
          messageId,
          email,
          event: 'delivered',
          timestamp: eventTime,
        });
        break;

      case 'opened':
        await tracker.trackEvent({
          messageId,
          email,
          event: 'open',
          timestamp: eventTime,
        });
        break;

      case 'clicked':
        await tracker.trackEvent({
          messageId,
          email,
          event: 'click',
          url: url || '',
          timestamp: eventTime,
        });
        break;

      case 'bounced':
      case 'failed':
        const bounceType = event.severity === 'permanent' ? 'hard' : 'soft';
        await bounceHandler.handleBounce({
          messageId,
          email,
          bounceType,
          bounceReason: event.reason || '',
          timestamp: eventTime,
        });
        break;

      case 'complained':
        await bounceHandler.handleBounce({
          messageId,
          email,
          bounceType: 'complaint',
          bounceReason: 'spam complaint',
          timestamp: eventTime,
        });
        break;

      case 'unsubscribed':
        await tracker.trackEvent({
          messageId,
          email,
          event: 'unsubscribe',
          timestamp: eventTime,
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing Mailgun webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
