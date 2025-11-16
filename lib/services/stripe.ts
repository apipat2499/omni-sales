import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

export async function createPaymentIntent(
  amount: number,
  currency: string = "usd",
  description?: string,
  customerId?: string
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    throw error;
  }
}

export async function createStripeCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return {
      success: true,
      customerId: customer.id,
    };
  } catch (error) {
    console.error("Stripe customer creation error:", error);
    throw error;
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );
    return paymentIntent;
  } catch (error) {
    console.error("Stripe payment intent retrieval error:", error);
    throw error;
  }
}

export async function createCharge(
  amount: number,
  stripeToken: string,
  description?: string,
  metadata?: Record<string, string>
) {
  try {
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      source: stripeToken,
      description,
      metadata,
    });

    return {
      success: true,
      chargeId: charge.id,
      status: charge.status,
    };
  } catch (error) {
    console.error("Stripe charge error:", error);
    throw error;
  }
}

export async function refundCharge(chargeId: string, amount?: number) {
  try {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
    };
  } catch (error) {
    console.error("Stripe refund error:", error);
    throw error;
  }
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      metadata,
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
    };
  } catch (error) {
    console.error("Stripe subscription error:", error);
    throw error;
  }
}

export async function getStripeWebhookEvent(
  body: string,
  signature: string
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    throw error;
  }
}

export default stripe;
