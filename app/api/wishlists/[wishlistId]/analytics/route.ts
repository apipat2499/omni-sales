import { NextRequest, NextResponse } from 'next/server';
import { getWishlistAnalytics } from '@/lib/wishlist/service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const { wishlistId: wishlistId } = await params;
    const days = req.nextUrl.searchParams.get('days');

    if (!wishlistId) {
      return NextResponse.json(
        { error: 'Missing wishlistId' },
        { status: 400 }
      );
    }

    const analytics = await getWishlistAnalytics(
      wishlistId,
      days ? parseInt(days) : 30
    );

    return NextResponse.json({
      data: analytics,
      total: analytics.length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
