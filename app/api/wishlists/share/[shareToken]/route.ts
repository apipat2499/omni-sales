import { NextRequest, NextResponse } from 'next/server';
import { getSharedWishlist } from '@/lib/wishlist/service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken: shareToken } = await params;

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Missing shareToken' },
        { status: 400 }
      );
    }

    const wishlist = await getSharedWishlist(shareToken);

    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found or share has expired' },
        { status: 404 }
      );
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error fetching shared wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared wishlist' },
      { status: 500 }
    );
  }
}
