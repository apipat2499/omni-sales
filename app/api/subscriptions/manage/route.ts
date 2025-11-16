import { NextRequest, NextResponse } from 'next/server';
import {
  getUserActiveSubscriptions,
  cancelSubscriptionAtPeriodEnd,
  cancelSubscriptionImmediately,
  reactivateSubscription,
  updateSubscription,
  getUpcomingInvoice,
} from '@/lib/stripe/subscription-manager';
import { handleStripeError } from '@/lib/stripe/server';
import { sanitizeErrorMessage } from '@/lib/stripe/encryption';

/**
 * GET /api/subscriptions/manage?userId=xxx
 * Get all active subscriptions for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const subscriptions = await getUserActiveSubscriptions(userId);

    return NextResponse.json({
      success: true,
      subscriptions,
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);

    const sanitizedMessage = sanitizeErrorMessage(error);

    return NextResponse.json(
      { error: sanitizedMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/subscriptions/manage
 * Update or manage subscription
 *
 * Actions:
 * - update: Update subscription (price, quantity, metadata)
 * - cancel: Cancel at period end
 * - cancel_now: Cancel immediately
 * - reactivate: Reactivate canceled subscription
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, action, ...updates } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      );
    }

    let subscription;

    switch (action) {
      case 'update':
        subscription = await updateSubscription(subscriptionId, updates);
        break;

      case 'cancel':
        subscription = await cancelSubscriptionAtPeriodEnd(subscriptionId);
        break;

      case 'cancel_now':
        subscription = await cancelSubscriptionImmediately(subscriptionId);
        break;

      case 'reactivate':
        subscription = await reactivateSubscription(subscriptionId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: update, cancel, cancel_now, or reactivate' },
          { status: 400 }
        );
    }

    // Get upcoming invoice if subscription is active
    let upcomingInvoice = null;
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      try {
        upcomingInvoice = await getUpcomingInvoice(subscriptionId);
      } catch (err) {
        console.warn('Could not fetch upcoming invoice:', err);
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        canceledAt: subscription.canceled_at,
      },
      upcomingInvoice: upcomingInvoice
        ? {
            amount: upcomingInvoice.amount_due,
            currency: upcomingInvoice.currency,
            dueDate: upcomingInvoice.due_date,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Subscription management error:', error);

    const stripeError = handleStripeError(error);
    const sanitizedMessage = sanitizeErrorMessage(error);

    return NextResponse.json(
      {
        error: sanitizedMessage,
        type: stripeError.type,
        code: stripeError.code,
      },
      { status: stripeError.statusCode }
    );
  }
}
