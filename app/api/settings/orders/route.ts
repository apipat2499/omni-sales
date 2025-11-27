import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch order number settings
    const { data: numberSettings, error: numberError } = await supabase
      .from('order_number_settings')
      .select('*')
      .eq('tenant_id', user.id)
      .single();

    // Fetch custom order statuses
    const { data: statuses, error: statusError } = await supabase
      .from('order_status_custom')
      .select('*')
      .eq('tenant_id', user.id)
      .order('sort_order', { ascending: true });

    if (numberError && numberError.code !== 'PGRST116') {
      return NextResponse.json({ error: numberError.message }, { status: 500 });
    }

    return NextResponse.json({
      numberSettings: numberSettings || {},
      statuses: statuses || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Update order number settings
    const { data, error } = await supabase
      .from('order_number_settings')
      .upsert({
        tenant_id: user.id,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
