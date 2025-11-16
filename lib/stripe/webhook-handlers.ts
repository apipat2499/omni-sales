import Stripe from 'stripe';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { WebhookEventLog, StripePayment, StripeRefund } from './types';
import { generateIdempotencyKey } from './encryption';

/**
 * Webhook event handlers for Stripe events
 */

/**
 * Log webhook event to database
 */
export const logWebhookEvent = async (
  event: Stripe.Event,
  processed: boolean = false,
  error?: string
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase not available, skipping webhook log');
    return;
  }

  const log: WebhookEventLog = {
    event_id: event.id,
    event_type: event.type,
    event_data: event.data.object,
    processed,
    processed_at: processed ? new Date().toISOString() : undefined,
    error,
    idempotency_key: generateIdempotencyKey(),
    created_at: new Date(event.created * 1000).toISOString(),
  };

  try {
    const { error: dbError } = await supabase
      .from('stripe_webhook_logs')
      .insert(log);

    if (dbError) {
      console.error('Failed to log webhook event:', dbError);
    }
  } catch (err) {
    console.error('Error logging webhook event:', err);
  }
};

/**
 * Check if event has already been processed (idempotency)
 */
export const isEventProcessed = async (eventId: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('stripe_webhook_logs')
      .select('id, processed')
      .eq('event_id', eventId)
      .eq('processed', true)
      .limit(1);

    if (error) {
      console.error('Error checking event processing status:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (err) {
    console.error('Error checking event:', err);
    return false;
  }
};

/**
 * Mark event as processed
 */
export const markEventAsProcessed = async (eventId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  try {
    await supabase
      .from('stripe_webhook_logs')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);
  } catch (err) {
    console.error('Error marking event as processed:', err);
  }
};

/**
 * Handle payment_intent.succeeded event
 */
export const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const payment: Omit<StripePayment, 'id' | 'created_at' | 'updated_at'> = {
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: paymentIntent.customer as string | undefined,
      order_id: paymentIntent.metadata.orderId,
      amount: paymentIntent.amount / 100, // Convert from cents to dollars
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      payment_method_type: paymentIntent.payment_method_types?.[0],
      metadata: paymentIntent.metadata,
    };

    // Insert payment record
    const { error: paymentError } = await supabase
      .from('stripe_payments')
      .insert(payment);

    if (paymentError) {
      console.error('Failed to insert payment:', paymentError);
      throw paymentError;
    }

    // Update order status if orderId is present
    if (payment.order_id) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: 'stripe',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.order_id);

      if (orderError) {
        console.error('Failed to update order status:', orderError);
      }
    }

    console.log(`Payment intent succeeded: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
};

/**
 * Handle payment_intent.payment_failed event
 */
export const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    // Update payment record
    await supabase
      .from('stripe_payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Update order status if orderId is present
    if (paymentIntent.metadata.orderId) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentIntent.metadata.orderId);
    }

    console.log(`Payment intent failed: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
    throw error;
  }
};

/**
 * Handle charge.refunded event
 */
export const handleChargeRefunded = async (
  charge: Stripe.Charge
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const refund: Omit<StripeRefund, 'id' | 'created_at'> = {
      stripe_refund_id: charge.refunds?.data[0]?.id || 'unknown',
      stripe_charge_id: charge.id,
      stripe_payment_intent_id: charge.payment_intent as string,
      amount: charge.amount_refunded / 100, // Convert from cents
      currency: charge.currency.toUpperCase(),
      status: charge.refunded ? 'succeeded' : 'pending',
      reason: charge.refunds?.data[0]?.reason || undefined,
      metadata: charge.metadata,
    };

    // Insert refund record
    const { error: refundError } = await supabase
      .from('stripe_refunds')
      .insert(refund);

    if (refundError) {
      console.error('Failed to insert refund:', refundError);
      throw refundError;
    }

    // Update payment status
    await supabase
      .from('stripe_payments')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', charge.payment_intent as string);

    // Update order status if orderId is in metadata
    if (charge.metadata.orderId) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', charge.metadata.orderId);
    }

    console.log(`Charge refunded: ${charge.id}`);
  } catch (error) {
    console.error('Error handling charge.refunded:', error);
    throw error;
  }
};

/**
 * Handle customer.subscription.created event
 */
export const handleSubscriptionCreated = async (
  subscription: Stripe.Subscription
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const subscriptionData = {
      user_id: subscription.metadata.userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: subscription.items.data[0].price.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    };

    const { error } = await supabase
      .from('stripe_subscriptions')
      .insert(subscriptionData);

    if (error) {
      console.error('Failed to insert subscription:', error);
      throw error;
    }

    console.log(`Subscription created: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling customer.subscription.created:', error);
    throw error;
  }
};

/**
 * Handle customer.subscription.updated event
 */
export const handleSubscriptionUpdated = async (
  subscription: Stripe.Subscription
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }

    console.log(`Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
    throw error;
  }
};

/**
 * Handle customer.subscription.deleted event
 */
export const handleSubscriptionDeleted = async (
  subscription: Stripe.Subscription
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        ended_at: new Date(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to delete subscription:', error);
      throw error;
    }

    console.log(`Subscription deleted: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
    throw error;
  }
};
