import { NextRequest, NextResponse } from 'next/server';
import {
  createLoyaltyProgram,
  getLoyaltyProgram,
} from '@/lib/loyalty/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // TODO: Fetch user's loyalty programs
    return NextResponse.json({
      data: [],
      total: 0,
    });
  } catch (error) {
    console.error('Error fetching loyalty programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty programs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      name,
      description,
      programType,
      pointMultiplier,
      minPurchaseForPoints,
      pointExpiryDays,
    } = await req.json();

    if (!userId || !name || !programType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const program = await createLoyaltyProgram(userId, {
      name,
      description,
      programType,
      pointMultiplier,
      minPurchaseForPoints,
      pointExpiryDays,
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Failed to create loyalty program' },
        { status: 500 }
      );
    }

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error('Error creating loyalty program:', error);
    return NextResponse.json(
      { error: 'Failed to create loyalty program' },
      { status: 500 }
    );
  }
}
