import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Return mock data for now - will be replaced with real queries
    return NextResponse.json({
      revenue: { total: 248750, change: 12.5, trend: 'up' },
      orders: { total: 156, change: 8.3, trend: 'up' },
      customers: { total: 892, change: 15.2, trend: 'up' },
      products: { total: 234, change: 5.1, trend: 'up' },
      aiConversations: { total: 1247, change: 23.4, trend: 'up', satisfaction: 92.5 },
      conversionRate: { rate: 3.8, change: -2.1, trend: 'down' },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
