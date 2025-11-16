import { NextRequest, NextResponse } from 'next/server';
import { initiateReturn, getReturn, getReturnItems, getReturnShipping, getRefundTransaction } from '@/lib/returns/service';

export async function GET(req: NextRequest) {
  try {
    const returnId = req.nextUrl.searchParams.get('returnId');
    const includeDetails = req.nextUrl.searchParams.get('includeDetails');

    if (!returnId) {
      return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });
    }

    const returnData = await getReturn(returnId);

    if (!returnData) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    let items = null;
    let shipping = null;
    let refund = null;

    if (includeDetails === 'true') {
      items = await getReturnItems(returnId);
      shipping = await getReturnShipping(returnId);
      refund = await getRefundTransaction(returnId);
    }

    return NextResponse.json({
      data: returnData,
      items,
      shipping,
      refund,
    });
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json({ error: 'Failed to fetch return' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, orderId, customerId, returnReasonId, reasonDetails, customerNotes } = body;

    if (!userId || !orderId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newReturn = await initiateReturn(userId, {
      orderId,
      customerId,
      returnReasonId,
      reasonDetails,
      customerNotes,
    });

    if (!newReturn) {
      return NextResponse.json({ error: 'Failed to create return' }, { status: 500 });
    }

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json({ error: 'Failed to create return' }, { status: 500 });
  }
}
