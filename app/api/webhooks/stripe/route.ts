import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe/server';
import { supabase } from '@/lib/supabase/client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const { userId, planId } = session.metadata as Record<string, string>;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get the subscription ID from the session
  if (!session.subscription) {
    console.error('No subscription in checkout session');
    return;
  }

  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Save subscription to database
  const { error } = await supabase.from('subscriptions').insert({
    user_id: userId,
    plan_id: planId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status,
    current_period_start: new Date((subscription as any).current_period_start * 1000),
    current_period_end: new Date((subscription as any).current_period_end * 1000),
  });

  if (error) {
    console.error('Failed to save subscription:', error);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  const subscriptionId = inv.subscription as string;

  if (!subscriptionId) {
    console.log('Invoice not tied to subscription');
    return;
  }

  // Update subscription status
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: inv.status,
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (updateError) {
    console.error('Failed to update subscription:', updateError);
  }

  // Record the payment
  const { error: paymentError } = await supabase.from('payments').insert({
    stripe_payment_intent_id: inv.payment_intent as string,
    stripe_charge_id: inv.charge as string,
    stripe_invoice_id: inv.id,
    amount_cents: inv.amount_paid,
    currency: inv.currency.toUpperCase(),
    status: 'succeeded',
  });

  if (paymentError) {
    console.error('Failed to record payment:', paymentError);
  }

  // Save invoice to database
  const { error: invoiceError } = await supabase
    .from('invoices')
    .upsert({
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer as string,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      pdf_url: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      paid_at: invoice.paid_at
        ? new Date(invoice.paid_at * 1000)
        : null,
      due_date: invoice.due_date
        ? new Date(invoice.due_date * 1000)
        : null,
    });

  if (invoiceError) {
    console.error('Failed to save invoice:', invoiceError);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(
        subscription.current_period_start * 1000
      ),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: subscription.ended_at
        ? new Date(subscription.ended_at * 1000)
        : new Date(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to cancel subscription:', error);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
