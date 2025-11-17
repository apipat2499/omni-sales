import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Params {
  params: {
    tenantId: string;
  };
}

export async function POST(_request: Request, { params }: Params) {
  const { tenantId } = params;

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
      message: 'Usage refresh simulated (offline mode)',
    });
  }

  const supabase = createClient(url, serviceKey);
  const { error } = await supabase.rpc('refresh_tenant_usage', {
    p_tenant_id: tenantId,
  });

  if (error) {
    console.error('Failed to refresh tenant usage', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Tenant usage refresh triggered',
  });
}
