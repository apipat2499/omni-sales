import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
    const status = req.nextUrl.searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: logs, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: logs || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

// Get stats
export async function HEAD(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get email stats
    const { data: stats } = await supabase
      .from('email_logs')
      .select('status')
      .eq('user_id', userId);

    const statsArray = stats as any[] || [];
    const aggregated = {
      total: statsArray?.length || 0,
      sent: statsArray?.filter((s: any) => s.status === 'sent').length || 0,
      failed: statsArray?.filter((s: any) => s.status === 'failed').length || 0,
      bounced: statsArray?.filter((s: any) => s.status === 'bounced').length || 0,
      opened: statsArray?.filter((s: any) => s.opened || s.is_opened).length || 0,
      clicked: statsArray?.filter((s: any) => s.clicked || s.is_clicked).length || 0,
    };

    return NextResponse.json(aggregated);
  } catch (error) {
    console.error('Error getting email stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
