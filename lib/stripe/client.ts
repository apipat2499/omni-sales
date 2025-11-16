import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe client instance for client-side operations
 * @throws {Error} if Stripe publishable key is not configured
 * @returns Promise<Stripe | null>
 */
export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('Stripe publishable key is not configured');
      return null;
    }

    if (!publishableKey.startsWith('pk_')) {
      console.error('Invalid Stripe publishable key format');
      return null;
    }

    stripePromise = loadStripe(publishableKey);
  }

  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Failed to initialize Stripe');
    }
    return stripe;
  } catch (error) {
    console.error('Error loading Stripe:', error);
    return null;
  }
};

/**
 * Check if Stripe is properly configured
 * @returns boolean
 */
export const isStripeConfigured = (): boolean => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return !!publishableKey && publishableKey.startsWith('pk_');
};
