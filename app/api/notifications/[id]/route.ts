import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: body.isRead })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json(
        { error: 'Failed to update notification', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { id: data.id, isRead: data.is_read },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/notifications/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json(
        { error: 'Failed to delete notification', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Notification deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/notifications/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
