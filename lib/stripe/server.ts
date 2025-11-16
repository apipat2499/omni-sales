import Stripe from 'stripe';

/**
 * Validate Stripe configuration
 */
const validateStripeConfig = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Please add it to your environment variables.'
    );
  }

  if (!secretKey.startsWith('sk_')) {
    throw new Error(
      'Invalid STRIPE_SECRET_KEY format. Key must start with "sk_"'
    );
  }

  return secretKey;
};

/**
 * Initialize Stripe with proper configuration and error handling
 */
const initializeStripe = (): Stripe => {
  try {
    const secretKey = validateStripeConfig();

    return new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
      maxNetworkRetries: 3,
      timeout: 30000, // 30 seconds
    });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    throw error;
  }
};

// Export singleton instance
const stripe = initializeStripe();

/**
 * Error handler for Stripe operations
 */
export const handleStripeError = (error: any): {
  message: string;
  type: string;
  code?: string;
  statusCode: number;
} => {
  if (error instanceof Stripe.errors.StripeError) {
    return {
      message: error.message || 'A payment error occurred',
      type: error.type,
      code: error.code,
      statusCode: error.statusCode || 500,
    };
  }

  // Generic error
  return {
    message: 'An unexpected error occurred',
    type: 'unknown_error',
    statusCode: 500,
  };
};

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = (): boolean => {
  try {
    validateStripeConfig();
    return true;
  } catch {
    return false;
  }
};

export default stripe;
