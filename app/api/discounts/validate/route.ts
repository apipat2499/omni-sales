import { NextRequest, NextResponse } from 'next/server';
import { validateCouponCode, calculateOrderDiscount } from '@/lib/discount/service';

export async function POST(req: NextRequest) {
  try {
    const { userId, code, customerId, orderValue } = await req.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'Missing userId or code' },
        { status: 400 }
      );
    }

    const { valid, reason, discount } = await validateCouponCode(
      userId,
      code,
      customerId,
      orderValue
    );

    if (!valid) {
      return NextResponse.json(
        { valid: false, reason },
        { status: 400 }
      );
    }

    // Calculate discount amount if order value provided
    let discountAmount = null;
    if (orderValue) {
      const calculation = await calculateOrderDiscount(
        userId,
        code,
        orderValue
      );
      discountAmount = calculation?.discountAmount || 0;
    }

    const discountData = discount as any;
    return NextResponse.json({
      valid: true,
      discount: {
        id: discountData?.id,
        code: discountData?.code,
        discountType: discountData?.discountType || discountData?.discount_type,
        discountValue: discountData?.discountValue || discountData?.discount_value,
        discountAmount,
        minimumOrderValue: discountData?.minimumOrderValue || discountData?.minimum_order_value,
        maximumDiscountAmount: discountData?.maximumDiscountAmount || discountData?.maximum_discount_amount,
        currency: discountData?.currency,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
