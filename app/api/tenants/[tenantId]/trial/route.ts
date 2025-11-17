import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Params {
  params: {
    tenantId: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  const { tenantId } = params;
  const body = await request.json().catch(() => ({}));
  const daysInput = Number(body?.days ?? 14);
  const days = Number.isFinite(daysInput) && daysInput > 0 ? daysInput : 14;
  const newTrialDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Missing tenantId' },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({
      success: true,
      offline: true,
      trialEndsAt: newTrialDate.toISOString(),
      trialEndsInDays: days,
    });
  }

  const supabase = createClient(url, serviceKey);
  const { error } = await supabase
    .from('tenants')
    .update({
      trial_ends_at: newTrialDate.toISOString(),
      subscription_status: 'trial',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (error) {
    console.error('Failed to extend trial', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    trialEndsAt: newTrialDate.toISOString(),
    trialEndsInDays: days,
  });
}
