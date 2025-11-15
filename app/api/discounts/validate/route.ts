import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, items } = body;

    if (!code || subtotal === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: code, subtotal' },
        { status: 400 }
      );
    }

    // Fetch discount by code
    const { data: discount, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !discount) {
      return NextResponse.json(
        { valid: false, error: 'Invalid discount code' },
        { status: 200 }
      );
    }

    // Check if discount is active
    if (!discount.active) {
      return NextResponse.json(
        { valid: false, error: 'This discount code is not active' },
        { status: 200 }
      );
    }

    // Check date validity
    const now = new Date();
    if (discount.start_date && new Date(discount.start_date) > now) {
      return NextResponse.json(
        { valid: false, error: 'This discount code is not yet available' },
        { status: 200 }
      );
    }
    if (discount.end_date && new Date(discount.end_date) < now) {
      return NextResponse.json(
        { valid: false, error: 'This discount code has expired' },
        { status: 200 }
      );
    }

    // Check usage limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return NextResponse.json(
        { valid: false, error: 'This discount code has reached its usage limit' },
        { status: 200 }
      );
    }

    // Check minimum purchase amount
    if (discount.min_purchase_amount && subtotal < parseFloat(discount.min_purchase_amount)) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum purchase amount is ฿${parseFloat(discount.min_purchase_amount).toFixed(2)}`,
        },
        { status: 200 }
      );
    }

    // Check if discount applies to the items
    if (discount.applies_to === 'category' && discount.applies_to_value && items) {
      const hasMatchingCategory = items.some(
        (item: any) => item.category === discount.applies_to_value
      );
      if (!hasMatchingCategory) {
        return NextResponse.json(
          { valid: false, error: 'This discount does not apply to any items in your cart' },
          { status: 200 }
        );
      }
    }

    if (discount.applies_to === 'product' && discount.applies_to_value && items) {
      const productIds = JSON.parse(discount.applies_to_value);
      const hasMatchingProduct = items.some((item: any) =>
        productIds.includes(item.productId)
      );
      if (!hasMatchingProduct) {
        return NextResponse.json(
          { valid: false, error: 'This discount does not apply to any items in your cart' },
          { status: 200 }
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * parseFloat(discount.value)) / 100;
    } else {
      discountAmount = parseFloat(discount.value);
    }

    // Apply max discount amount if specified
    if (discount.max_discount_amount) {
      discountAmount = Math.min(discountAmount, parseFloat(discount.max_discount_amount));
    }

    // Make sure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json(
      {
        valid: true,
        discount: {
          id: discount.id,
          code: discount.code,
          name: discount.name,
          type: discount.type,
          value: parseFloat(discount.value),
          discountAmount: parseFloat(discountAmount.toFixed(2)),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/discounts/validate:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
