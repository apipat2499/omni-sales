import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Params {
  params: {
    tenantId: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  const { tenantId } = params;
  const body = await request.json();
  const action = body?.action as 'suspend' | 'reactivate';

  if (!tenantId || !action) {
    return NextResponse.json(
      { success: false, error: 'Missing tenantId or action' },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({
      success: true,
      offline: true,
      status: action === 'suspend' ? 'suspended' : 'active',
    });
  }

  const supabase = createClient(url, serviceKey);
  const nextStatus = action === 'suspend' ? 'suspended' : 'active';
  const nextSubscription =
    action === 'suspend' ? 'suspended' : 'active';

  const { error } = await supabase
    .from('tenants')
    .update({
      status: nextStatus,
      subscription_status: nextSubscription,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (error) {
    console.error('Failed to update tenant status', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    status: nextStatus,
    subscriptionStatus: nextSubscription,
  });
}
