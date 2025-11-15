import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'All notifications marked as read' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/notifications/mark-all-read:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
