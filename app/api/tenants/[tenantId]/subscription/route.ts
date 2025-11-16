import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPlan, comparePlans } from '@/lib/tenants/plans';

/**
 * GET /api/tenants/:tenantId/subscription - Get subscription details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('subscription_plan, subscription_status, trial_ends_at, subscription_ends_at, features, usage')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const plan = getPlan(tenant.subscription_plan);

    return NextResponse.json({
      success: true,
      subscription: {
        plan: tenant.subscription_plan,
        status: tenant.subscription_status,
        trialEndsAt: tenant.trial_ends_at,
        subscriptionEndsAt: tenant.subscription_ends_at,
        features: tenant.features,
        usage: tenant.usage,
        planDetails: plan,
      },
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tenants/:tenantId/subscription - Update subscription plan
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;
    const body = await req.json();
    const { plan } = body;

    if (!plan || !['starter', 'professional', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Get current plan
    const { data: tenant } = await supabase
      .from('tenants')
      .select('subscription_plan')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Compare plans
    const comparison = comparePlans(tenant.subscription_plan, plan);

    // Get new plan features
    const newPlan = getPlan(plan);

    // Update subscription
    const { error } = await supabase
      .from('tenants')
      .update({
        subscription_plan: plan,
        subscription_status: 'active',
        features: newPlan.features,
      })
      .eq('id', tenantId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Plan ${comparison.isUpgrade ? 'upgraded' : 'downgraded'} successfully`,
      plan: newPlan,
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
