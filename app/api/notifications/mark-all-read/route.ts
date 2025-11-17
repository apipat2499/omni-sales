import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function POST() {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('read', false);

    if (error) {
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
