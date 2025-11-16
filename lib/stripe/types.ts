/**
 * Stripe integration types and interfaces
 */

export interface PaymentIntentMetadata {
  orderId?: string;
  userId?: string;
  subscriptionId?: string;
  customerId?: string;
  type: 'order' | 'subscription' | 'refund' | 'other';
  description?: string;
  [key: string]: string | undefined;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: PaymentIntentMetadata;
  description?: string;
  automaticPaymentMethods?: boolean;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  quantity?: number;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
  coupon?: string;
}

export interface StripeCustomerData {
  email: string;
  name?: string;
  phone?: string;
  metadata?: {
    userId?: string;
    supabaseId?: string;
    [key: string]: string | undefined;
  };
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface WebhookEventLog {
  id?: string;
  event_id: string;
  event_type: string;
  event_data: any;
  processed: boolean;
  processed_at?: string;
  error?: string;
  created_at?: string;
  idempotency_key: string;
}

export interface StripeSubscription {
  id?: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  canceled_at?: Date;
  ended_at?: Date;
  trial_start?: Date;
  trial_end?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface StripePayment {
  id?: string;
  stripe_payment_intent_id: string;
  stripe_customer_id?: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method_type?: string;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface StripeRefund {
  id?: string;
  stripe_refund_id: string;
  stripe_charge_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  metadata?: Record<string, any>;
  created_at?: Date;
}

export interface StripeErrorResponse {
  message: string;
  type: string;
  code?: string;
  statusCode: number;
  param?: string;
}
