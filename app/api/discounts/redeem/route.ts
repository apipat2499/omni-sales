import { NextRequest, NextResponse } from 'next/server';
import { redeemCoupon } from '@/lib/discount/service';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      discountCodeId,
      customerId,
      orderId,
      discountAmount,
    } = await req.json();

    if (!userId || !discountCodeId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const redemption = await redeemCoupon(
      userId,
      discountCodeId,
      customerId,
      orderId,
      discountAmount
    );

    if (!redemption) {
      return NextResponse.json(
        { error: 'Failed to redeem coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json(redemption, { status: 201 });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json(
      { error: 'Failed to redeem coupon' },
      { status: 500 }
    );
  }
}
