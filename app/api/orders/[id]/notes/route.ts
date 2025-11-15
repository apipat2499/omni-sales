import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const { data: notes, error } = await supabase
      .from('order_notes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching order notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order notes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: notes || [] });
  } catch (error) {
    console.error('Unexpected error in order notes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const orderId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const { note, is_internal = true } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note cannot be empty' }, { status: 400 });
    }

    // Create note
    const { data: newNote, error: noteError } = await supabase
      .from('order_notes')
      .insert({
        order_id: orderId,
        note: note.trim(),
        is_internal,
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error creating order note:', noteError);
      return NextResponse.json(
        { error: 'Failed to create order note', details: noteError.message },
        { status: 500 }
      );
    }

    // Create activity log
    await supabase.from('order_activities').insert({
      order_id: orderId,
      type: 'note_added',
      description: is_internal ? 'เพิ่มหมายเหตุภายใน' : 'เพิ่มหมายเหตุ',
    });

    return NextResponse.json({ data: newNote }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in order notes POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
