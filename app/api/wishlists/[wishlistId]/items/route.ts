import { NextRequest, NextResponse } from 'next/server';
import {
  addWishlistItem,
  removeWishlistItem,
} from '@/lib/wishlist/service';

export async function POST(
  req: NextRequest,
  { params }: { params: { wishlistId: string } }
) {
  try {
    const wishlistId = params.wishlistId;
    const {
      userId,
      productId,
      productName,
      productImage,
      priceAtAdded,
      currentPrice,
      priority,
      notes,
      quantityDesired,
    } = await req.json();

    if (!userId || !wishlistId || !productId || !productName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const item = await addWishlistItem(userId, wishlistId, {
      productId,
      productName,
      productImage,
      priceAtAdded,
      currentPrice,
      priority,
      notes,
      quantityDesired,
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Failed to add wishlist item' },
        { status: 500 }
      );
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding wishlist item:', error);
    return NextResponse.json(
      { error: 'Failed to add wishlist item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { wishlistId: string } }
) {
  try {
    const wishlistId = params.wishlistId;
    const { userId, itemId } = await req.json();

    if (!userId || !wishlistId || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await removeWishlistItem(userId, wishlistId, itemId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove wishlist item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    return NextResponse.json(
      { error: 'Failed to remove wishlist item' },
      { status: 500 }
    );
  }
}
