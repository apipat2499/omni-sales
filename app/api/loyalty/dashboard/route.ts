import { NextRequest, NextResponse } from 'next/server';
import { getLoyaltyDashboardData } from '@/lib/loyalty/service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const data = await getLoyaltyDashboardData(userId);

    return NextResponse.json(
      { data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching loyalty dashboard:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
