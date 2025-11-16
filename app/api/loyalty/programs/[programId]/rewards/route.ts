import { NextRequest, NextResponse } from 'next/server';
import { createReward, getRewards } from '@/lib/loyalty/service';

export async function GET(
  req: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const programId = params.programId;

    if (!programId) {
      return NextResponse.json({ error: 'Missing programId' }, { status: 400 });
    }

    const rewards = await getRewards(programId);

    return NextResponse.json({
      data: rewards,
      total: rewards.length,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const programId = params.programId;
    const {
      userId,
      rewardName,
      rewardType,
      rewardValue,
      rewardUnit,
      pointsRequired,
      totalAvailableQuantity,
      description,
    } = await req.json();

    if (!userId || !programId || !rewardName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const reward = await createReward(userId, {
      loyaltyProgramId: programId,
      rewardName,
      rewardType,
      rewardValue,
      rewardUnit,
      pointsRequired,
      totalAvailableQuantity,
      description,
    });

    if (!reward) {
      return NextResponse.json(
        { error: 'Failed to create reward' },
        { status: 500 }
      );
    }

    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    );
  }
}
