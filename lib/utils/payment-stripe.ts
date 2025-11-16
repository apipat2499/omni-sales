/**
 * Enhanced Stripe Payment Integration
 *
 * Comprehensive Stripe API wrapper for payment processing, payment intents,
 * payment methods, refunds, and webhook handling.
 */

import Stripe from 'stripe';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// ============================================================================
// Type Definitions
// ============================================================================

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string | null;
  paymentMethod?: string;
  customer?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding?: string;
    country?: string;
  };
  billingDetails: {
    name?: string;
    email?: string;
    phone?: string;
    address?: Stripe.Address;
  };
}

export interface StripeCustomer {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  defaultPaymentMethod?: string;
}

export interface StripeRefund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  paymentIntentId?: string;
  chargeId?: string;
}

export interface BillingDetails {
  name: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface PaymentIntentOptions {
  amount: number;
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethodTypes?: string[];
  setupFutureUsage?: 'on_session' | 'off_session';
  captureMethod?: 'automatic' | 'manual';
}

export interface RefundOptions {
  paymentIntentId?: string;
  chargeId?: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

// ============================================================================
// Payment Intent Functions
// ============================================================================

/**
 * Create a payment intent with enhanced options
 */
export async function createPaymentIntent(
  options: PaymentIntentOptions
): Promise<{ success: boolean; paymentIntent?: StripePaymentIntent; error?: string }> {
  try {
    const {
      amount,
      currency = 'usd',
      customerId,
      description,
      metadata = {},
      paymentMethodTypes = ['card'],
      setupFutureUsage,
      captureMethod = 'automatic',
    } = options;

    // Validate amount
    if (amount <= 0) {
      return {
        success: false,
        error: 'Amount must be greater than zero',
      };
    }

    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata,
      capture_method: captureMethod,
    };

    // Add optional fields
    if (customerId) {
      paymentIntentData.customer = customerId;
    }

    if (description) {
      paymentIntentData.description = description;
    }

    if (setupFutureUsage) {
      paymentIntentData.setup_future_usage = setupFutureUsage;
    }

    // Set payment method types
    if (paymentMethodTypes.length > 0) {
      paymentIntentData.payment_method_types = paymentMethodTypes as any;
    } else {
      paymentIntentData.automatic_payment_methods = {
        enabled: true,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        paymentMethod: paymentIntent.payment_method as string | undefined,
        customer: paymentIntent.customer as string | undefined,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment intent',
    };
  }
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<{ success: boolean; paymentIntent?: StripePaymentIntent; error?: string }> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        paymentMethod: paymentIntent.payment_method as string | undefined,
        customer: paymentIntent.customer as string | undefined,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error: any) {
    console.error('Stripe payment intent retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve payment intent',
    };
  }
}

/**
 * Update a payment intent
 */
export async function updatePaymentIntent(
  paymentIntentId: string,
  updates: {
    amount?: number;
    metadata?: Record<string, string>;
    description?: string;
  }
): Promise<{ success: boolean; paymentIntent?: StripePaymentIntent; error?: string }> {
  try {
    const updateData: Stripe.PaymentIntentUpdateParams = {};

    if (updates.amount !== undefined) {
      updateData.amount = Math.round(updates.amount * 100);
    }

    if (updates.metadata) {
      updateData.metadata = updates.metadata;
    }

    if (updates.description) {
      updateData.description = updates.description;
    }

    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      updateData
    );

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        paymentMethod: paymentIntent.payment_method as string | undefined,
        customer: paymentIntent.customer as string | undefined,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error: any) {
    console.error('Stripe payment intent update error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payment intent',
    };
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<{ success: boolean; paymentIntent?: StripePaymentIntent; error?: string }> {
  try {
    const confirmData: Stripe.PaymentIntentConfirmParams = {};

    if (paymentMethodId) {
      confirmData.payment_method = paymentMethodId;
    }

    const paymentIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      confirmData
    );

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        paymentMethod: paymentIntent.payment_method as string | undefined,
        customer: paymentIntent.customer as string | undefined,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error: any) {
    console.error('Stripe payment intent confirmation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to confirm payment intent',
    };
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
    return { success: true };
  } catch (error: any) {
    console.error('Stripe payment intent cancellation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel payment intent',
    };
  }
}

/**
 * Capture a payment intent (for manual capture)
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<{ success: boolean; paymentIntent?: StripePaymentIntent; error?: string }> {
  try {
    const captureData: Stripe.PaymentIntentCaptureParams = {};

    if (amountToCapture !== undefined) {
      captureData.amount_to_capture = Math.round(amountToCapture * 100);
    }

    const paymentIntent = await stripe.paymentIntents.capture(
      paymentIntentId,
      captureData
    );

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        paymentMethod: paymentIntent.payment_method as string | undefined,
        customer: paymentIntent.customer as string | undefined,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error: any) {
    console.error('Stripe payment intent capture error:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture payment intent',
    };
  }
}

// ============================================================================
// Customer Functions
// ============================================================================

/**
 * Create a Stripe customer
 */
export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; customer?: StripeCustomer; error?: string }> {
  try {
    const customerData: Stripe.CustomerCreateParams = {
      email,
    };

    if (name) {
      customerData.name = name;
    }

    if (metadata) {
      customerData.metadata = metadata;
    }

    const customer = await stripe.customers.create(customerData);

    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email || undefined,
        name: customer.name || undefined,
        phone: customer.phone || undefined,
        metadata: customer.metadata,
        defaultPaymentMethod: customer.invoice_settings.default_payment_method as string | undefined,
      },
    };
  } catch (error: any) {
    console.error('Stripe customer creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create customer',
    };
  }
}

/**
 * Get a Stripe customer
 */
export async function getCustomer(
  customerId: string
): Promise<{ success: boolean; customer?: StripeCustomer; error?: string }> {
  try {
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return {
        success: false,
        error: 'Customer has been deleted',
      };
    }

    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email || undefined,
        name: customer.name || undefined,
        phone: customer.phone || undefined,
        metadata: customer.metadata,
        defaultPaymentMethod: customer.invoice_settings.default_payment_method as string | undefined,
      },
    };
  } catch (error: any) {
    console.error('Stripe customer retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve customer',
    };
  }
}

/**
 * Update a Stripe customer
 */
export async function updateCustomer(
  customerId: string,
  updates: {
    email?: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
    defaultPaymentMethod?: string;
  }
): Promise<{ success: boolean; customer?: StripeCustomer; error?: string }> {
  try {
    const updateData: Stripe.CustomerUpdateParams = {};

    if (updates.email) updateData.email = updates.email;
    if (updates.name) updateData.name = updates.name;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.metadata) updateData.metadata = updates.metadata;
    if (updates.defaultPaymentMethod) {
      updateData.invoice_settings = {
        default_payment_method: updates.defaultPaymentMethod,
      };
    }

    const customer = await stripe.customers.update(customerId, updateData);

    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email || undefined,
        name: customer.name || undefined,
        phone: customer.phone || undefined,
        metadata: customer.metadata,
        defaultPaymentMethod: customer.invoice_settings.default_payment_method as string | undefined,
      },
    };
  } catch (error: any) {
    console.error('Stripe customer update error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update customer',
    };
  }
}

// ============================================================================
// Payment Method Functions
// ============================================================================

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<{ success: boolean; paymentMethod?: StripePaymentMethod; error?: string }> {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return {
      success: true,
      paymentMethod: formatPaymentMethod(paymentMethod),
    };
  } catch (error: any) {
    console.error('Stripe payment method attachment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to attach payment method',
    };
  }
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return { success: true };
  } catch (error: any) {
    console.error('Stripe payment method detachment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to detach payment method',
    };
  }
}

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string,
  type: 'card' | 'us_bank_account' = 'card'
): Promise<{ success: boolean; paymentMethods?: StripePaymentMethod[]; error?: string }> {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type,
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data.map(formatPaymentMethod),
    };
  } catch (error: any) {
    console.error('Stripe payment methods list error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list payment methods',
    };
  }
}

/**
 * Get a specific payment method
 */
export async function getPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; paymentMethod?: StripePaymentMethod; error?: string }> {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    return {
      success: true,
      paymentMethod: formatPaymentMethod(paymentMethod),
    };
  } catch (error: any) {
    console.error('Stripe payment method retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve payment method',
    };
  }
}

/**
 * Set default payment method for a customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Stripe default payment method error:', error);
    return {
      success: false,
      error: error.message || 'Failed to set default payment method',
    };
  }
}

// ============================================================================
// Refund Functions
// ============================================================================

/**
 * Create a refund
 */
export async function createRefund(
  options: RefundOptions
): Promise<{ success: boolean; refund?: StripeRefund; error?: string }> {
  try {
    const { paymentIntentId, chargeId, amount, reason, metadata } = options;

    if (!paymentIntentId && !chargeId) {
      return {
        success: false,
        error: 'Either paymentIntentId or chargeId must be provided',
      };
    }

    const refundData: Stripe.RefundCreateParams = {};

    if (paymentIntentId) {
      refundData.payment_intent = paymentIntentId;
    } else if (chargeId) {
      refundData.charge = chargeId;
    }

    if (amount !== undefined) {
      refundData.amount = Math.round(amount * 100);
    }

    if (reason) {
      refundData.reason = reason;
    }

    if (metadata) {
      refundData.metadata = metadata;
    }

    const refund = await stripe.refunds.create(refundData);

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason || undefined,
        paymentIntentId: refund.payment_intent as string | undefined,
        chargeId: refund.charge as string | undefined,
      },
    };
  } catch (error: any) {
    console.error('Stripe refund creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create refund',
    };
  }
}

/**
 * Get a refund
 */
export async function getRefund(
  refundId: string
): Promise<{ success: boolean; refund?: StripeRefund; error?: string }> {
  try {
    const refund = await stripe.refunds.retrieve(refundId);

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason || undefined,
        paymentIntentId: refund.payment_intent as string | undefined,
        chargeId: refund.charge as string | undefined,
      },
    };
  } catch (error: any) {
    console.error('Stripe refund retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve refund',
    };
  }
}

/**
 * List refunds for a payment intent
 */
export async function listRefunds(
  paymentIntentId: string
): Promise<{ success: boolean; refunds?: StripeRefund[]; error?: string }> {
  try {
    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
    });

    return {
      success: true,
      refunds: refunds.data.map((refund) => ({
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason || undefined,
        paymentIntentId: refund.payment_intent as string | undefined,
        chargeId: refund.charge as string | undefined,
      })),
    };
  } catch (error: any) {
    console.error('Stripe refunds list error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list refunds',
    };
  }
}

// ============================================================================
// Webhook Functions
// ============================================================================

/**
 * Construct and verify a webhook event
 */
export async function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  webhookSecret?: string
): Promise<{ success: boolean; event?: Stripe.Event; error?: string }> {
  try {
    const secret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!secret) {
      return {
        success: false,
        error: 'Webhook secret not configured',
      };
    }

    const event = stripe.webhooks.constructEvent(body, signature, secret);

    return {
      success: true,
      event,
    };
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error);
    return {
      success: false,
      error: error.message || 'Webhook verification failed',
    };
  }
}

// ============================================================================
// Charge Functions (Legacy support)
// ============================================================================

/**
 * Get a charge
 */
export async function getCharge(
  chargeId: string
): Promise<{ success: boolean; charge?: any; error?: string }> {
  try {
    const charge = await stripe.charges.retrieve(chargeId);
    return { success: true, charge };
  } catch (error: any) {
    console.error('Stripe charge retrieval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve charge',
    };
  }
}

/**
 * List charges for a customer
 */
export async function listCharges(
  customerId: string,
  limit: number = 10
): Promise<{ success: boolean; charges?: any[]; error?: string }> {
  try {
    const charges = await stripe.charges.list({
      customer: customerId,
      limit,
    });

    return {
      success: true,
      charges: charges.data,
    };
  } catch (error: any) {
    console.error('Stripe charges list error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list charges',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a Stripe payment method
 */
function formatPaymentMethod(pm: Stripe.PaymentMethod): StripePaymentMethod {
  return {
    id: pm.id,
    type: pm.type,
    card: pm.card
      ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
          funding: pm.card.funding,
          country: pm.card.country || undefined,
        }
      : undefined,
    billingDetails: {
      name: pm.billing_details.name || undefined,
      email: pm.billing_details.email || undefined,
      phone: pm.billing_details.phone || undefined,
      address: pm.billing_details.address || undefined,
    },
  };
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): boolean {
  const validCurrencies = [
    'usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'sek', 'nzd',
    'mxn', 'sgd', 'hkd', 'nok', 'krw', 'try', 'rub', 'inr', 'brl', 'zar',
    'thb', 'php', 'myr', 'idr', 'vnd',
  ];
  return validCurrencies.includes(currency.toLowerCase());
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Get Stripe publishable key
 */
export function getPublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
}

// Export the stripe instance for advanced usage
export default stripe;
