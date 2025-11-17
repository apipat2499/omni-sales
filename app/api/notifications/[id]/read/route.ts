import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const notificationId = parseInt(params.id);

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notification as read', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Unexpected error in notification read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
