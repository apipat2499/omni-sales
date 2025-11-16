import { NextRequest, NextResponse } from 'next/server';
import {
  getWishlistWithItems,
  deleteWishlist,
  updateWishlistVisibility,
} from '@/lib/wishlist/service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const { wishlistId: wishlistId } = await params;

    if (!wishlistId) {
      return NextResponse.json(
        { error: 'Missing wishlistId' },
        { status: 400 }
      );
    }

    const wishlist = await getWishlistWithItems(wishlistId);

    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const { wishlistId: wishlistId } = await params;
    const { isPublic } = await req.json();

    if (!wishlistId) {
      return NextResponse.json(
        { error: 'Missing wishlistId' },
        { status: 400 }
      );
    }

    if (isPublic === undefined) {
      return NextResponse.json(
        { error: 'Missing isPublic field' },
        { status: 400 }
      );
    }

    const success = await updateWishlistVisibility(wishlistId, isPublic);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update wishlist visibility' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ wishlistId: string }> }
) {
  try {
    const { wishlistId: wishlistId } = await params;

    if (!wishlistId) {
      return NextResponse.json(
        { error: 'Missing wishlistId' },
        { status: 400 }
      );
    }

    const success = await deleteWishlist(wishlistId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete wishlist' },
      { status: 500 }
    );
  }
}
