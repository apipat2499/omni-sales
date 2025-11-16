import stripe, { handleStripeError } from './server';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CreateSubscriptionParams } from './types';
import Stripe from 'stripe';

/**
 * Subscription management utilities for Stripe integration
 * Handles recurring billing and subscription lifecycle
 */

/**
 * Create a new subscription
 * @param params - Subscription parameters
 */
export const createSubscription = async (
  params: CreateSubscriptionParams
): Promise<Stripe.Subscription> => {
  try {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [
        {
          price: params.priceId,
          quantity: params.quantity || 1,
        },
      ],
      metadata: params.metadata || {},
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    };

    // Add trial period if specified
    if (params.trialPeriodDays) {
      subscriptionParams.trial_period_days = params.trialPeriodDays;
    }

    // Add coupon if specified
    if (params.coupon) {
      subscriptionParams.coupon = params.coupon;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    return subscription;
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    throw handleStripeError(error);
  }
};

/**
 * Get subscription by ID
 * @param subscriptionId - Stripe subscription ID
 */
export const getSubscription = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    throw handleStripeError(error);
  }
};

/**
 * Get all subscriptions for a customer
 * @param customerId - Stripe customer ID
 */
export const getCustomerSubscriptions = async (
  customerId: string
): Promise<Stripe.Subscription[]> => {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    return subscriptions.data;
  } catch (error: any) {
    console.error('Error fetching customer subscriptions:', error);
    throw handleStripeError(error);
  }
};

/**
 * Get active subscriptions for a user
 * @param userId - Supabase user ID
 */
export const getUserActiveSubscriptions = async (userId: string) => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }
};

/**
 * Update subscription
 * @param subscriptionId - Stripe subscription ID
 * @param updates - Subscription updates
 */
export const updateSubscription = async (
  subscriptionId: string,
  updates: {
    priceId?: string;
    quantity?: number;
    metadata?: Record<string, string>;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<Stripe.Subscription> => {
  try {
    const updateParams: Stripe.SubscriptionUpdateParams = {
      metadata: updates.metadata,
      cancel_at_period_end: updates.cancelAtPeriodEnd,
    };

    // Update price/quantity if provided
    if (updates.priceId || updates.quantity) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentItem = subscription.items.data[0];

      updateParams.items = [
        {
          id: currentItem.id,
          price: updates.priceId || currentItem.price.id,
          quantity: updates.quantity || currentItem.quantity || 1,
        },
      ];
    }

    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      updateParams
    );

    return subscription;
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    throw handleStripeError(error);
  }
};

/**
 * Cancel subscription at period end
 * @param subscriptionId - Stripe subscription ID
 */
export const cancelSubscriptionAtPeriodEnd = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription;
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    throw handleStripeError(error);
  }
};

/**
 * Cancel subscription immediately
 * @param subscriptionId - Stripe subscription ID
 */
export const cancelSubscriptionImmediately = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error: any) {
    console.error('Error canceling subscription immediately:', error);
    throw handleStripeError(error);
  }
};

/**
 * Reactivate a subscription that was set to cancel
 * @param subscriptionId - Stripe subscription ID
 */
export const reactivateSubscription = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return subscription;
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    throw handleStripeError(error);
  }
};

/**
 * Get upcoming invoice for a subscription
 * @param subscriptionId - Stripe subscription ID
 */
export const getUpcomingInvoice = async (
  subscriptionId: string
): Promise<Stripe.Invoice> => {
  try {
    const invoice = await stripe.invoices.retrieveUpcoming({
      subscription: subscriptionId,
    });

    return invoice;
  } catch (error: any) {
    console.error('Error fetching upcoming invoice:', error);
    throw handleStripeError(error);
  }
};

/**
 * Get all invoices for a subscription
 * @param subscriptionId - Stripe subscription ID
 */
export const getSubscriptionInvoices = async (
  subscriptionId: string
): Promise<Stripe.Invoice[]> => {
  try {
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 100,
    });

    return invoices.data;
  } catch (error: any) {
    console.error('Error fetching subscription invoices:', error);
    throw handleStripeError(error);
  }
};

/**
 * Create a usage record for metered billing
 * @param subscriptionItemId - Stripe subscription item ID
 * @param quantity - Usage quantity
 * @param timestamp - Usage timestamp (default: now)
 */
export const createUsageRecord = async (
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord> => {
  try {
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    );

    return usageRecord;
  } catch (error: any) {
    console.error('Error creating usage record:', error);
    throw handleStripeError(error);
  }
};

/**
 * Get usage record summaries for metered billing
 * @param subscriptionItemId - Stripe subscription item ID
 */
export const getUsageRecordSummaries = async (
  subscriptionItemId: string
): Promise<Stripe.UsageRecordSummary[]> => {
  try {
    const summaries = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItemId,
      { limit: 100 }
    );

    return summaries.data;
  } catch (error: any) {
    console.error('Error fetching usage record summaries:', error);
    throw handleStripeError(error);
  }
};

/**
 * Apply a coupon to a subscription
 * @param subscriptionId - Stripe subscription ID
 * @param couponId - Stripe coupon ID
 */
export const applyCouponToSubscription = async (
  subscriptionId: string,
  couponId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      coupon: couponId,
    });

    return subscription;
  } catch (error: any) {
    console.error('Error applying coupon:', error);
    throw handleStripeError(error);
  }
};

/**
 * Remove a coupon from a subscription
 * @param subscriptionId - Stripe subscription ID
 */
export const removeCouponFromSubscription = async (
  subscriptionId: string
): Promise<Stripe.Subscription> => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      coupon: '',
    });

    return subscription;
  } catch (error: any) {
    console.error('Error removing coupon:', error);
    throw handleStripeError(error);
  }
};
