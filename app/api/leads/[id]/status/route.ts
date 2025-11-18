import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchTelemetry } from '@/lib/telemetry';
import { notifySalesLead } from '@/lib/utils/slack';

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: Params) {
  const leadId = params.id;
  const body = await request.json().catch(() => ({}));
  const { status, ownerEmail } = body;

  if (!leadId || !status) {
    return NextResponse.json(
      { success: false, error: 'Missing lead id or status' },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({
      success: true,
      offline: true,
      status,
    });
  }

  const supabase = createClient(url, serviceKey);
  const updates: {
    status: string;
    updated_at: string;
    owner_email?: string;
    assigned_at?: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (ownerEmail) {
    updates.owner_email = ownerEmail;
    updates.assigned_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('sales_leads')
    .update(updates)
    .eq('id', leadId);

  if (error) {
    console.error('Failed to update lead status', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  await dispatchTelemetry({
    type: 'lead_status_update',
    level: 'info',
    message: `Lead ${leadId} moved to ${status}`,
    context: { ownerEmail },
  });

  await notifySalesLead({
    title: `🔁 Lead อัปเดต: ${leadId}`,
    message: `สถานะใหม่: ${status}${ownerEmail ? ` • เจ้าของ: ${ownerEmail}` : ''}`,
    metadata: { status, owner: ownerEmail || 'unassigned' },
  });

  return NextResponse.json({ success: true, status });
}
