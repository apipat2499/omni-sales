import { NextRequest, NextResponse } from 'next/server';
import {
  updateWishlistPreferences,
  getWishlistPreferences,
} from '@/lib/wishlist/service';

export async function GET(req: NextRequest) {
  try {
    const customerEmail = req.nextUrl.searchParams.get('customerEmail');

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Missing customerEmail' },
        { status: 400 }
      );
    }

    const preferences = await getWishlistPreferences(customerEmail);

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      customerEmail,
      notifyPriceDrops,
      priceDropThreshold,
      notifyBackInStock,
      notifySharedWishlists,
      weeklyDigest,
      defaultWishlistVisibility,
    } = await req.json();

    if (!userId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const preferences = await updateWishlistPreferences(
      userId,
      customerEmail,
      {
        notifyPriceDrops,
        priceDropThreshold,
        notifyBackInStock,
        notifySharedWishlists,
        weeklyDigest,
        defaultWishlistVisibility,
      }
    );

    if (!preferences) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(preferences, { status: 201 });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
