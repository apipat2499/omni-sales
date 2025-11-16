import { NextRequest, NextResponse } from 'next/server';
import { shareWishlist } from '@/lib/wishlist/service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const { wishlistId: wishlistId } = await params;
    const {
      userId,
      shareEmail,
      shareName,
      shareType,
      expiresAt,
      canEdit,
    } = await req.json();

    if (!userId || !wishlistId || !shareType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const share = await shareWishlist(userId, wishlistId, {
      shareEmail,
      shareName,
      shareType,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      canEdit,
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Failed to create share' },
        { status: 500 }
      );
    }

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}
