import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/stripe/subscription-manager';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer-manager';
import { handleStripeError } from '@/lib/stripe/server';
import { sanitizeErrorMessage } from '@/lib/stripe/encryption';

/**
 * POST /api/subscriptions/create
 * Creates a new Stripe subscription for a user
 *
 * Request body:
 * - userId: string (Supabase user ID)
 * - priceId: string (Stripe price ID)
 * - email: string (Customer email)
 * - name?: string (Customer name)
 * - quantity?: number (default: 1)
 * - trialPeriodDays?: number
 * - coupon?: string (Coupon code)
 * - metadata?: Record<string, string>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      priceId,
      email,
      name,
      quantity,
      trialPeriodDays,
      coupon,
      metadata,
    } = body;

    // Validation
    if (!userId || !priceId || !email) {
      return NextResponse.json(
        { error: 'userId, priceId, and email are required' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { customerId } = await getOrCreateStripeCustomer(userId, {
      email,
      name,
      metadata: {
        userId,
        ...metadata,
      },
    });

    // Create subscription
    const subscription = await createSubscription({
      customerId,
      priceId,
      quantity,
      trialPeriodDays,
      coupon,
      metadata: {
        userId,
        ...metadata,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        customerId: subscription.customer,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        trialStart: subscription.trial_start,
        trialEnd: subscription.trial_end,
      },
      clientSecret: (subscription.latest_invoice as any)?.payment_intent
        ?.client_secret,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);

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
