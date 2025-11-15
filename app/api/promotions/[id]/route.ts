import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Promotion } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    // Validate dates if provided
    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.minPurchase !== undefined) updateData.min_purchase = body.minPurchase;
    if (body.maxDiscount !== undefined) updateData.max_discount = body.maxDiscount;
    if (body.startDate !== undefined) updateData.start_date = new Date(body.startDate).toISOString();
    if (body.endDate !== undefined) updateData.end_date = new Date(body.endDate).toISOString();
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.usageLimit !== undefined) updateData.usage_limit = body.usageLimit;
    if (body.applicableTo !== undefined) updateData.applicable_to = body.applicableTo;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promotion:', error);
      return NextResponse.json(
        { error: 'Failed to update promotion', details: error.message },
        { status: 500 }
      );
    }

    const promotion: Promotion = {
      ...data,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/promotions/[id]:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase.from('promotions').delete().eq('id', id);

    if (error) {
      console.error('Error deleting promotion:', error);
      return NextResponse.json(
        { error: 'Failed to delete promotion', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/promotions/[id]:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
