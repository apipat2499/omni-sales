import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerLoyaltyAccount,
  initializeCustomerLoyalty,
} from '@/lib/loyalty/service';

export async function GET(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const customerId = params.customerId;
    const programId = req.nextUrl.searchParams.get('programId');

    if (!customerId || !programId) {
      return NextResponse.json(
        { error: 'Missing customerId or programId' },
        { status: 400 }
      );
    }

    const account = await getCustomerLoyaltyAccount(customerId, programId);

    if (!account) {
      return NextResponse.json(
        { error: 'Loyalty account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching loyalty account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty account' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const customerId = params.customerId;
    const { userId, loyaltyProgramId, bonusPointsOnJoin } = await req.json();

    if (!userId || !customerId || !loyaltyProgramId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await initializeCustomerLoyalty(
      userId,
      customerId,
      loyaltyProgramId,
      bonusPointsOnJoin || 0
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to initialize loyalty account' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Loyalty account initialized' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error initializing loyalty account:', error);
    return NextResponse.json(
      { error: 'Failed to initialize loyalty account' },
      { status: 500 }
    );
  }
}
