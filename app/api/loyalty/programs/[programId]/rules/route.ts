import { NextRequest, NextResponse } from 'next/server';
import { createPointRule } from '@/lib/loyalty/service';

export async function POST(
  req: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const programId = params.programId;
    const {
      userId,
      ruleName,
      ruleType,
      triggerEvent,
      pointsEarned,
      pointsCalculationType,
      percentageValue,
      minTransactionAmount,
      maxPointsPerTransaction,
    } = await req.json();

    if (!userId || !programId || !ruleName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const rule = await createPointRule(userId, {
      loyaltyProgramId: programId,
      ruleName,
      ruleType,
      triggerEvent,
      pointsEarned,
      pointsCalculationType,
      percentageValue,
      minTransactionAmount,
      maxPointsPerTransaction,
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'Failed to create rule' },
        { status: 500 }
      );
    }

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}
