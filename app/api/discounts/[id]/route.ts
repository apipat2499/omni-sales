import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Discount } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {};

    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.minPurchaseAmount !== undefined) updateData.min_purchase_amount = body.minPurchaseAmount;
    if (body.maxDiscountAmount !== undefined) updateData.max_discount_amount = body.maxDiscountAmount;
    if (body.usageLimit !== undefined) updateData.usage_limit = body.usageLimit;
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.appliesTo !== undefined) updateData.applies_to = body.appliesTo;
    if (body.appliesToValue !== undefined) updateData.applies_to_value = body.appliesToValue;

    const { data, error } = await supabase
      .from('discounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating discount:', error);
      return NextResponse.json(
        { error: 'Failed to update discount', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    const discount: Discount = {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      value: parseFloat(data.value),
      minPurchaseAmount: parseFloat(data.min_purchase_amount),
      maxDiscountAmount: data.max_discount_amount ? parseFloat(data.max_discount_amount) : undefined,
      usageLimit: data.usage_limit,
      usageCount: data.usage_count,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      active: data.active,
      appliesTo: data.applies_to,
      appliesToValue: data.applies_to_value,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(discount, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/discounts/[id]:', error);
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
      .from('discounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting discount:', error);
      return NextResponse.json(
        { error: 'Failed to delete discount', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Discount deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/discounts/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
