import { NextRequest, NextResponse } from 'next/server';
import { getProductReviews, getProductRatingSummary } from '@/lib/review/service';

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    const status = req.nextUrl.searchParams.get('status');
    const rating = req.nextUrl.searchParams.get('rating');
    const onlyVerified = req.nextUrl.searchParams.get('onlyVerified') === 'true';
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'recent';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId' },
        { status: 400 }
      );
    }

    // Get reviews
    const { reviews, total } = await getProductReviews(productId, {
      status: status || undefined,
      rating: rating ? parseInt(rating) : undefined,
      onlyVerified,
      sortBy: sortBy as 'helpful' | 'recent' | 'rating',
      limit,
      offset,
    });

    // Get rating summary
    const ratingSummary = await getProductRatingSummary(productId);

    return NextResponse.json({
      data: reviews,
      total,
      limit,
      offset,
      ratingSummary,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
