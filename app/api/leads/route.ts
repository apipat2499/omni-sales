import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchTelemetry } from '@/lib/telemetry';
import { sendLeadAcknowledgement } from '@/lib/email/lead';
import { notifySalesLead } from '@/lib/utils/slack';

interface LeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  budget?: string;
  channel?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LeadPayload;
  const { name, email, phone, company, message, budget, channel } = body;

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
    budget_tier: budget || null,
    preferred_channel: channel || null,
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

  await Promise.all([
    dispatchTelemetry({
      type: 'lead_capture',
      level: 'info',
      message: 'New sales lead captured',
      context: { name, email, company },
    }),
    sendLeadAcknowledgement({
      name,
      email,
      company,
      phone,
    }),
    notifySalesLead({
      title: `🎯 Lead ใหม่: ${name}`,
      message: `${company || 'ไม่ระบุบริษัท'} • งบประมาณ: ${budget || 'ไม่ระบุ'} • ช่องทาง: ${channel || 'ไม่ระบุ'}`,
      metadata: { name, email, phone, company, budget, channel },
    }),
  ]);

  return NextResponse.json({ success: true });
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({
      success: true,
      offline: true,
      leads: [],
    });
  }

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase
    .from('sales_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Failed to fetch leads', error);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถโหลดรายชื่อ lead ได้' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    leads: data || [],
  });
}
