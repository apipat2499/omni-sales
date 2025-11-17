import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchTelemetry } from '@/lib/telemetry';

interface LeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LeadPayload;
  const { name, email, phone, company, message } = body;

  if (!name || !email) {
    return NextResponse.json(
      { success: false, error: 'กรุณากรอกชื่อและอีเมล' },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn('[Leads] Missing Supabase credentials, running in offline mode');
    await dispatchTelemetry({
      type: 'lead_capture_offline',
      level: 'warning',
      message: 'Lead captured while Supabase offline',
      context: { name, email, company },
    });
    return NextResponse.json({ success: true, offline: true });
  }

  const supabase = createClient(url, serviceKey);

  const { error } = await supabase.from('sales_leads').insert({
    name,
    email,
    phone,
    company,
    message,
    source: 'lead_capture_widget',
    status: 'new',
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to store lead', error);
    return NextResponse.json(
      { success: false, error: error.message || 'ไม่สามารถบันทึกข้อมูลได้' },
      { status: 500 }
    );
  }

  await dispatchTelemetry({
    type: 'lead_capture',
    level: 'info',
    message: 'New sales lead captured',
    context: { name, email, company },
  });

  return NextResponse.json({ success: true });
}
