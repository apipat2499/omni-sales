import { supabase } from '@/lib/supabase/client';

export async function trackProductUsage(
  subscriptionId: string,
  metricName: string,
  value: number = 1
) {
  try {
    const { data, error } = await supabase.from('billing_usage').insert({
      subscription_id: subscriptionId,
      metric_name: metricName,
      value,
      period_start: new Date(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    if (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to track usage:', error);
    throw error;
  }
}

export async function getSubscriptionUsage(subscriptionId: string) {
  try {
    const { data, error } = await supabase
      .from('billing_usage')
      .select('*')
      .eq('subscription_id', subscriptionId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get usage:', error);
    throw error;
  }
}

export async function checkProductLimit(
  subscriptionId: string,
  currentProductCount: number
) {
  try {
    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('subscription_plans (product_limit)')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    const plan = subscription.subscription_plans as any;
    const limit = plan?.product_limit || 10;

    return {
      isWithinLimit: currentProductCount < limit,
      currentCount: currentProductCount,
      limit,
      remaining: Math.max(0, limit - currentProductCount),
    };
  } catch (error) {
    console.error('Failed to check product limit:', error);
    throw error;
  }
}

export async function enforceProductLimit(
  userId: string,
  currentProductCount: number
): Promise<{ allowed: boolean; message?: string }> {
  try {
    // Get active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans (product_limit)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      // No active subscription, allow by default
      return { allowed: true };
    }

    const plan = subscription.subscription_plans as any;
    const limit = plan?.product_limit || 10;

    if (currentProductCount >= limit) {
      return {
        allowed: false,
        message: `You have reached the limit of ${limit} products for your plan. Please upgrade to add more products.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error enforcing product limit:', error);
    // Fail open - allow if there's an error
    return { allowed: true };
  }
}
