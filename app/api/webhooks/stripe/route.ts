import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe/server';
import { sanitizeErrorMessage } from '@/lib/stripe/encryption';
import {
  logWebhookEvent,
  isEventProcessed,
  markEventAsProcessed,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleChargeRefunded,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from '@/lib/stripe/webhook-handlers';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events with:
 * - Signature verification
 * - Idempotent processing
 * - Event logging
 * - Error handling
 *
 * Supported events:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  // Validate webhook signature
  if (!signature) {
    console.error('Missing Stripe signature header');
    return NextResponse.json(
      { error: 'Missing signature header' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error);
    const sanitizedMessage = sanitizeErrorMessage(error);
    return NextResponse.json(
      { error: 'Invalid signature', message: sanitizedMessage },
      { status: 400 }
    );
  }

  // Log the event
  await logWebhookEvent(event, false);

  // Check for idempotency - prevent duplicate processing
  const alreadyProcessed = await isEventProcessed(event.id);
  if (alreadyProcessed) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({
      received: true,
      message: 'Event already processed',
    });
  }

  // Process the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
        // Still mark as processed to prevent retry
        await markEventAsProcessed(event.id);
        return NextResponse.json({
          received: true,
          message: `Unhandled event type: ${event.type}`,
        });
    }

    // Mark event as successfully processed
    await markEventAsProcessed(event.id);
    await logWebhookEvent(event, true);

    console.log(`Successfully processed event: ${event.id} (${event.type})`);

    return NextResponse.json({
      received: true,
      eventId: event.id,
      eventType: event.type,
    });
  } catch (error: any) {
    console.error('Webhook handler error:', error);

    // Log the error
    const sanitizedMessage = sanitizeErrorMessage(error);
    await logWebhookEvent(event, false, sanitizedMessage);

    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: sanitizedMessage,
        eventId: event.id,
      },
      { status: 500 }
    );
  }
}
