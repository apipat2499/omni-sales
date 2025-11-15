import { NextRequest, NextResponse } from 'next/server';
import { authorizeReturn, approveReturn, setupReturnShipping } from '@/lib/returns/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, returnId, approve, refundAmount, restockingFeePercentage, shippingData } = body;

    if (!userId || !returnId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Authorize the return
    const authSuccess = await authorizeReturn(userId, returnId);

    if (!authSuccess) {
      return NextResponse.json({ error: 'Failed to authorize return' }, { status: 500 });
    }

    let approveSuccess = true;
    let shippingSuccess = true;

    // Optionally approve for refund
    if (approve) {
      approveSuccess = await approveReturn(returnId, refundAmount, restockingFeePercentage);
    }

    // Optionally setup return shipping
    if (shippingData) {
      const shipping = await setupReturnShipping(returnId, shippingData);
      shippingSuccess = shipping !== null;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Return authorized',
        refundApproved: approve && approveSuccess,
        shippingSetup: shippingData && shippingSuccess,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error authorizing return:', error);
    return NextResponse.json({ error: 'Failed to authorize return' }, { status: 500 });
  }
}
