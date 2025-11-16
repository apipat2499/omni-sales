import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        subscription_plans (*)
      `
      )
      .eq('id', subscriptionId)
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params;
    const { action, data } = await req.json();

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const stripeSubscriptionId = subscription.stripe_subscription_id;

    switch (action) {
      case 'cancel':
        await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        await supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
          })
          .eq('id', subscriptionId);

        return NextResponse.json({
          message: 'Subscription will be canceled at end of period',
        });

      case 'reactivate':
        await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: false,
        });

        await supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: false,
          })
          .eq('id', subscriptionId);

        return NextResponse.json({ message: 'Subscription reactivated' });

      case 'update_payment_method':
        if (!data?.paymentMethodId) {
          return NextResponse.json(
            { error: 'Missing payment method ID' },
            { status: 400 }
          );
        }

        await stripe.subscriptions.update(stripeSubscriptionId, {
          default_payment_method: data.paymentMethodId,
        });

        return NextResponse.json({
          message: 'Payment method updated',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
