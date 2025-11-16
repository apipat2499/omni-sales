import { NextRequest, NextResponse } from 'next/server';
import stripe, { handleStripeError } from '@/lib/stripe/server';
import { sanitizeErrorMessage } from '@/lib/stripe/encryption';
import type { PaymentIntentMetadata } from '@/lib/stripe/types';

/**
 * POST /api/payments/create-payment-intent
 * Creates a Stripe Payment Intent for order or subscription payments
 *
 * Request body:
 * - amount: number (in dollars, will be converted to cents)
 * - currency: string (default: 'usd')
 * - customerId?: string (Stripe customer ID)
 * - metadata: PaymentIntentMetadata
 *   - type: 'order' | 'subscription' | 'refund' | 'other'
 *   - orderId?: string
 *   - userId?: string
 *   - subscriptionId?: string
 *   - description?: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = 'usd',
      customerId,
      metadata,
      description,
    } = body;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    if (!metadata || !metadata.type) {
      return NextResponse.json(
        { error: 'Metadata with type is required' },
        { status: 400 }
      );
    }

    // Validate payment type
    const validTypes = ['order', 'subscription', 'refund', 'other'];
    if (!validTypes.includes(metadata.type)) {
      return NextResponse.json(
        { error: `Invalid payment type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate specific requirements
    if (metadata.type === 'order' && !metadata.orderId) {
      return NextResponse.json(
        { error: 'orderId is required for order payments' },
        { status: 400 }
      );
    }

    if (metadata.type === 'subscription' && !metadata.subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required for subscription payments' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntentParams: any = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        // Ensure all metadata values are strings
        amount: amount.toString(),
        timestamp: new Date().toISOString(),
      },
      description:
        description ||
        metadata.description ||
        `Payment for ${metadata.type}: ${metadata.orderId || metadata.subscriptionId || 'N/A'}`,
    };

    // Add customer if provided
    if (customerId) {
      paymentIntentParams.customer = customerId;
    }

    // Enable automatic payment methods
    paymentIntentParams.automatic_payment_methods = {
      enabled: true,
    };

    // For orders, set specific settings
    if (metadata.type === 'order') {
      paymentIntentParams.capture_method = 'automatic';
      paymentIntentParams.statement_descriptor = 'ORDER PAYMENT';
    }

    // For subscriptions, set specific settings
    if (metadata.type === 'subscription') {
      paymentIntentParams.setup_future_usage = 'off_session';
      paymentIntentParams.statement_descriptor = 'SUBSCRIPTION';
    }

    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentParams
    );

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);

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
