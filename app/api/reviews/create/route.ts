import { NextRequest, NextResponse } from 'next/server';
import { createProductReview, addReviewImages } from '@/lib/review/service';

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      productId,
      customerId,
      orderId,
      customerName,
      customerEmail,
      title,
      content,
      rating,
      verifiedPurchase,
      images,
    } = await req.json();

    if (
      !userId ||
      !productId ||
      !customerName ||
      !customerEmail ||
      !title ||
      !content ||
      !rating
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create review
    const review = await createProductReview(userId, {
      productId,
      customerId,
      orderId,
      customerName,
      customerEmail,
      title,
      content,
      rating: parseInt(rating),
      verifiedPurchase,
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Add images if provided
    if (images && images.length > 0) {
      await addReviewImages(userId, review.id, images);
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
