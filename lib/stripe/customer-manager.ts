import stripe, { handleStripeError } from './server';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { StripeCustomerData } from './types';
import Stripe from 'stripe';

/**
 * Customer management utilities for Stripe integration
 */

/**
 * Create or retrieve Stripe customer for a Supabase user
 * @param userId - Supabase user ID
 * @param customerData - Customer data (email, name, etc.)
 * @returns Stripe customer ID
 */
export const getOrCreateStripeCustomer = async (
  userId: string,
  customerData: StripeCustomerData
): Promise<{ customerId: string; isNew: boolean }> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    // Check if customer already exists in database
    const { data: existingMapping, error: fetchError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingMapping && !fetchError) {
      // Verify customer still exists in Stripe
      try {
        await stripe.customers.retrieve(existingMapping.stripe_customer_id);
        return {
          customerId: existingMapping.stripe_customer_id,
          isNew: false,
        };
      } catch (err) {
        // Customer doesn't exist in Stripe, create new one
        console.warn(
          `Stripe customer ${existingMapping.stripe_customer_id} not found, creating new`
        );
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
      metadata: {
        ...customerData.metadata,
        userId,
        supabaseId: userId,
      },
    });

    // Store mapping in database
    const { error: insertError } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: customer.id,
        email: customerData.email,
        name: customerData.name,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to store customer mapping:', insertError);
      // Don't throw - customer is created in Stripe
    }

    return {
      customerId: customer.id,
      isNew: true,
    };
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    throw handleStripeError(error);
  }
};

/**
 * Get Stripe customer ID for a Supabase user
 * @param userId - Supabase user ID
 * @returns Stripe customer ID or null
 */
export const getStripeCustomerId = async (
  userId: string
): Promise<string | null> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.stripe_customer_id;
  } catch (err) {
    console.error('Error fetching Stripe customer ID:', err);
    return null;
  }
};

/**
 * Update Stripe customer information
 * @param customerId - Stripe customer ID
 * @param updates - Customer data to update
 */
export const updateStripeCustomer = async (
  customerId: string,
  updates: Partial<StripeCustomerData>
): Promise<Stripe.Customer> => {
  try {
    const customer = await stripe.customers.update(customerId, {
      email: updates.email,
      name: updates.name,
      phone: updates.phone,
      address: updates.address,
      metadata: updates.metadata,
    });

    // Update local database
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('stripe_customers')
        .update({
          email: updates.email,
          name: updates.name,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
    }

    return customer;
  } catch (error: any) {
    console.error('Error updating Stripe customer:', error);
    throw handleStripeError(error);
  }
};

/**
 * Delete Stripe customer
 * @param customerId - Stripe customer ID
 */
export const deleteStripeCustomer = async (
  customerId: string
): Promise<void> => {
  try {
    await stripe.customers.del(customerId);

    // Remove from local database
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('stripe_customers')
        .delete()
        .eq('stripe_customer_id', customerId);
    }
  } catch (error: any) {
    console.error('Error deleting Stripe customer:', error);
    throw handleStripeError(error);
  }
};

/**
 * Get customer payment methods
 * @param customerId - Stripe customer ID
 */
export const getCustomerPaymentMethods = async (
  customerId: string
): Promise<Stripe.PaymentMethod[]> => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    throw handleStripeError(error);
  }
};

/**
 * Attach payment method to customer
 * @param paymentMethodId - Stripe payment method ID
 * @param customerId - Stripe customer ID
 */
export const attachPaymentMethodToCustomer = async (
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> => {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return paymentMethod;
  } catch (error: any) {
    console.error('Error attaching payment method:', error);
    throw handleStripeError(error);
  }
};

/**
 * Set default payment method for customer
 * @param customerId - Stripe customer ID
 * @param paymentMethodId - Stripe payment method ID
 */
export const setDefaultPaymentMethod = async (
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> => {
  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return customer;
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    throw handleStripeError(error);
  }
};
