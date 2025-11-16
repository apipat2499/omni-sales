import { NextRequest, NextResponse } from 'next/server';
import { getDiscountCodeWithDetails } from '@/lib/discount/service';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codeId: string }> }
) {
  try {
    const { codeId: codeId } = await params;

    if (!codeId) {
      return NextResponse.json(
        { error: 'Missing codeId' },
        { status: 400 }
      );
    }

    const code = await getDiscountCodeWithDetails(codeId);

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(code);
  } catch (error) {
    console.error('Error fetching discount code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount code' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ codeId: string }> }
) {
  try {
    const { codeId: codeId } = await params;
    const updates = await req.json();

    if (!codeId) {
      return NextResponse.json(
        { error: 'Missing codeId' },
        { status: 400 }
      );
    }

    // Map camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.usageLimit !== undefined) dbUpdates.usage_limit = updates.usageLimit;
    if (updates.isStackable !== undefined) dbUpdates.is_stackable = updates.isStackable;
    if (updates.isExclusive !== undefined) dbUpdates.is_exclusive = updates.isExclusive;
    if (updates.autoApply !== undefined) dbUpdates.auto_apply = updates.autoApply;
    if (updates.notes) dbUpdates.notes = updates.notes;

    dbUpdates.updated_at = new Date();

    const { data: code, error } = await supabase
      .from('discount_codes')
      .update(dbUpdates)
      .eq('id', codeId)
      .select()
      .single();

    if (error || !code) {
      return NextResponse.json(
        { error: 'Failed to update discount code' },
        { status: 500 }
      );
    }

    return NextResponse.json(code);
  } catch (error) {
    console.error('Error updating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to update discount code' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ codeId: string }> }
) {
  try {
    const { codeId: codeId } = await params;

    if (!codeId) {
      return NextResponse.json(
        { error: 'Missing codeId' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('discount_codes')
      .update({ status: 'archived' })
      .eq('id', codeId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete discount code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    );
  }
}
