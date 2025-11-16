import { NextRequest, NextResponse } from 'next/server';
import {
  createWishlist,
  getUserWishlists,
} from '@/lib/wishlist/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerEmail = req.nextUrl.searchParams.get('customerEmail');

    if (!userId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing userId or customerEmail' },
        { status: 400 }
      );
    }

    const wishlists = await getUserWishlists(userId, customerEmail);

    return NextResponse.json({
      data: wishlists,
      total: wishlists.length,
    });
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlists' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      customerEmail,
      wishlistName,
      description,
      isPublic,
    } = await req.json();

    if (!userId || !customerEmail || !wishlistName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const wishlist = await createWishlist(userId, {
      customerEmail,
      wishlistName,
      description,
      isPublic,
    });

    if (!wishlist) {
      return NextResponse.json(
        { error: 'Failed to create wishlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(wishlist, { status: 201 });
  } catch (error) {
    console.error('Error creating wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to create wishlist' },
      { status: 500 }
    );
  }
}
