import { NextRequest, NextResponse } from 'next/server';
import {
  redeemReward,
  approveRedemption,
} from '@/lib/loyalty/service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId: customerId } = await params;
    const { userId, rewardId, loyaltyProgramId } = await req.json();

    if (!userId || !customerId || !rewardId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const redemption = await redeemReward(
      userId,
      customerId,
      rewardId,
      loyaltyProgramId
    );

    if (!redemption) {
      return NextResponse.json(
        { error: 'Failed to redeem reward' },
        { status: 500 }
      );
    }

    return NextResponse.json(redemption, { status: 201 });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json(
      { error: 'Failed to redeem reward' },
      { status: 500 }
    );
  }
}
