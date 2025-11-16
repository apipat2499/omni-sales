import { NextRequest, NextResponse } from 'next/server';
import { createDiscountCode, getDiscountCodes } from '@/lib/discount/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const status = req.nextUrl.searchParams.get('status');
    const applicableTo = req.nextUrl.searchParams.get('applicableTo');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const { codes, total } = await getDiscountCodes(userId, {
      status: status || undefined,
      applicableTo: applicableTo || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      data: codes,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const {
      code,
      description,
      discountType,
      discountValue,
      currency,
      usageLimit,
      usagePerCustomer,
      minimumOrderValue,
      maximumDiscountAmount,
      applicableTo,
      startDate,
      endDate,
      isStackable,
      isExclusive,
      autoApply,
      notes,
    } = await req.json();

    if (!userId || !code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newCode = await createDiscountCode(userId, {
      code,
      description,
      discountType,
      discountValue,
      currency,
      usageLimit,
      usagePerCustomer,
      minimumOrderValue,
      maximumDiscountAmount,
      applicableTo,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isStackable,
      isExclusive,
      autoApply,
      notes,
    });

    if (!newCode) {
      return NextResponse.json(
        { error: 'Failed to create discount code' },
        { status: 500 }
      );
    }

    return NextResponse.json(newCode, { status: 201 });
  } catch (error) {
    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to create discount code' },
      { status: 500 }
    );
  }
}
