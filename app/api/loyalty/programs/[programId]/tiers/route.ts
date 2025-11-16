import { NextRequest, NextResponse } from 'next/server';
import { createLoyaltyTier, getLoyaltyTiers } from '@/lib/loyalty/service';

export async function GET(
  req: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const programId = params.programId;

    if (!programId) {
      return NextResponse.json({ error: 'Missing programId' }, { status: 400 });
    }

    const tiers = await getLoyaltyTiers(programId);

    return NextResponse.json({
      data: tiers,
      total: tiers.length,
    });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiers' },
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
      tierName,
      tierLevel,
      minPoints,
      maxPoints,
      minAnnualSpending,
      pointsMultiplier,
      bonusPointsOnJoin,
      exclusiveBenefits,
      isVip,
    } = await req.json();

    if (!userId || !programId || !tierName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const tier = await createLoyaltyTier(userId, {
      loyaltyProgramId: programId,
      tierName,
      tierLevel,
      minPoints,
      maxPoints,
      minAnnualSpending,
      pointsMultiplier,
      bonusPointsOnJoin,
      exclusiveBenefits,
      isVip,
    });

    if (!tier) {
      return NextResponse.json(
        { error: 'Failed to create tier' },
        { status: 500 }
      );
    }

    return NextResponse.json(tier, { status: 201 });
  } catch (error) {
    console.error('Error creating tier:', error);
    return NextResponse.json(
      { error: 'Failed to create tier' },
      { status: 500 }
    );
  }
}
