import { NextRequest, NextResponse } from 'next/server';
import {
  trackPriceChange,
  getItemPriceHistory,
} from '@/lib/wishlist/service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const { wishlistId: wishlistId } = await params;
    const { userId, wishlistItemId, newPrice } = await req.json();

    if (!userId || !wishlistItemId || newPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const priceHistory = await trackPriceChange(userId, wishlistItemId, newPrice);

    if (!priceHistory) {
      return NextResponse.json(
        { error: 'Failed to track price change' },
        { status: 500 }
      );
    }

    return NextResponse.json(priceHistory, { status: 201 });
  } catch (error) {
    console.error('Error tracking price change:', error);
    return NextResponse.json(
      { error: 'Failed to track price change' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const wishlistItemId = req.nextUrl.searchParams.get('itemId');

    if (!wishlistItemId) {
      return NextResponse.json(
        { error: 'Missing itemId' },
        { status: 400 }
      );
    }

    const priceHistory = await getItemPriceHistory(wishlistItemId);

    return NextResponse.json({
      data: priceHistory,
      total: priceHistory.length,
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
