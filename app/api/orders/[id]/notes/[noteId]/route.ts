import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const supabase = createClient();
    const orderId = parseInt(params.id);
    const noteId = parseInt(params.noteId);

    if (isNaN(orderId) || isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('order_notes')
      .delete()
      .eq('id', noteId)
      .eq('order_id', orderId);

    if (error) {
      console.error('Error deleting order note:', error);
      return NextResponse.json(
        { error: 'Failed to delete order note', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in order notes DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
