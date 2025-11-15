import { supabase } from '@/lib/supabase/client';
import {
  ProductReview,
  ReviewImage,
  ReviewVote,
  ReviewReport,
  ProductRatingSummary,
  ReviewAnalytics,
  ProductReviewWithDetails,
} from '@/types';

/**
 * Review & Rating Management Service
 * Handles product reviews, ratings, moderation, and analytics
 */

/**
 * Create a product review
 */
export async function createProductReview(
  userId: string,
  review: {
    productId: string;
    customerId?: string;
    orderId?: string;
    customerName: string;
    customerEmail: string;
    title: string;
    content: string;
    rating: number;
    verifiedPurchase?: boolean;
  }
): Promise<ProductReview | null> {
  try {
    // Validate rating
    if (review.rating < 1 || review.rating > 5) {
      console.error('Rating must be between 1 and 5');
      return null;
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        user_id: userId,
        product_id: review.productId,
        customer_id: review.customerId,
        order_id: review.orderId,
        customer_name: review.customerName,
        customer_email: review.customerEmail,
        title: review.title,
        content: review.content,
        rating: review.rating,
        status: 'pending',
        verified_purchase: review.verifiedPurchase || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return null;
    }

    // Update rating summary
    await updateProductRatingSummary(userId, review.productId);

    return data;
  } catch (error) {
    console.error('Error in createProductReview:', error);
    return null;
  }
}

/**
 * Add images to a review
 */
export async function addReviewImages(
  userId: string,
  reviewId: string,
  images: Array<{
    imageUrl: string;
    altText?: string;
    displayOrder?: number;
  }>
): Promise<ReviewImage[]> {
  try {
    const imageData = images.map((img, idx) => ({
      user_id: userId,
      review_id: reviewId,
      image_url: img.imageUrl,
      alt_text: img.altText,
      display_order: img.displayOrder ?? idx,
    }));

    const { data, error } = await supabase
      .from('review_images')
      .insert(imageData)
      .select();

    if (error) {
      console.error('Error adding review images:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in addReviewImages:', error);
    return [];
  }
}

/**
 * Approve/reject a review
 */
export async function moderateReview(
  reviewId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<boolean> {
  try {
    const { data: review, error: fetchError } = await supabase
      .from('product_reviews')
      .select('product_id')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return false;
    }

    const { error } = await supabase
      .from('product_reviews')
      .update({
        status,
        moderation_notes: notes,
        updated_at: new Date(),
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Error moderating review:', error);
      return false;
    }

    // Update rating summary
    const { data: productReview } = await supabase
      .from('product_reviews')
      .select('user_id, product_id')
      .eq('id', reviewId)
      .single();

    if (productReview) {
      await updateProductRatingSummary(productReview.user_id, productReview.product_id);
    }

    return true;
  } catch (error) {
    console.error('Error in moderateReview:', error);
    return false;
  }
}

/**
 * Add seller response to review
 */
export async function respondToReview(
  reviewId: string,
  responseText: string,
  respondedBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_reviews')
      .update({
        response_text: responseText,
        response_by: respondedBy,
        response_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Error responding to review:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in respondToReview:', error);
    return false;
  }
}

/**
 * Vote on review (helpful/unhelpful)
 */
export async function voteOnReview(
  userId: string,
  reviewId: string,
  voterEmail: string,
  voteType: 'helpful' | 'unhelpful'
): Promise<ReviewVote | null> {
  try {
    // Check if vote already exists
    const { data: existingVote } = await supabase
      .from('review_votes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('voter_email', voterEmail)
      .eq('vote_type', voteType)
      .single();

    if (existingVote) {
      // Vote already exists, skip
      return null;
    }

    // Create vote
    const { data, error } = await supabase
      .from('review_votes')
      .insert({
        user_id: userId,
        review_id: reviewId,
        voter_email: voterEmail,
        vote_type: voteType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error voting on review:', error);
      return null;
    }

    // Update helpful/unhelpful count
    const updateData: any = {
      updated_at: new Date(),
    };

    if (voteType === 'helpful') {
      updateData.helpful_count = supabase.rpc('increment_helpful_votes', {
        p_review_id: reviewId,
      });
    } else {
      updateData.unhelpful_count = supabase.rpc('increment_unhelpful_votes', {
        p_review_id: reviewId,
      });
    }

    await supabase
      .from('product_reviews')
      .update({ updated_at: new Date() })
      .eq('id', reviewId);

    return data;
  } catch (error) {
    console.error('Error in voteOnReview:', error);
    return null;
  }
}

/**
 * Report a review
 */
export async function reportReview(
  userId: string,
  reviewId: string,
  reporterEmail: string,
  reason: string,
  description?: string
): Promise<ReviewReport | null> {
  try {
    const { data, error } = await supabase
      .from('review_reports')
      .insert({
        user_id: userId,
        review_id: reviewId,
        reporter_email: reporterEmail,
        report_reason: reason,
        report_description: description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error reporting review:', error);
      return null;
    }

    // Increment report count
    await supabase
      .from('product_reviews')
      .update({
        reported_count: supabase.raw('reported_count + 1'),
        updated_at: new Date(),
      })
      .eq('id', reviewId);

    return data;
  } catch (error) {
    console.error('Error in reportReview:', error);
    return null;
  }
}

/**
 * Get product reviews with filtering
 */
export async function getProductReviews(
  productId: string,
  filters?: {
    status?: string;
    rating?: number;
    onlyVerified?: boolean;
    sortBy?: 'helpful' | 'recent' | 'rating';
    limit?: number;
    offset?: number;
  }
): Promise<{ reviews: ProductReviewWithDetails[]; total: number }> {
  try {
    let query = supabase
      .from('product_reviews')
      .select('*', { count: 'exact' })
      .eq('product_id', productId);

    // Filter by status (default: approved)
    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'approved');
    }

    // Filter by rating
    if (filters?.rating) {
      query = query.eq('rating', filters.rating);
    }

    // Filter by verified purchase
    if (filters?.onlyVerified) {
      query = query.eq('verified_purchase', true);
    }

    // Sort
    const sortBy = filters?.sortBy || 'recent';
    if (sortBy === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    } else if (sortBy === 'rating') {
      query = query.order('rating', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;

    const { data: reviews, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching reviews:', error);
      return { reviews: [], total: 0 };
    }

    // Fetch related data
    const reviewsWithDetails = await Promise.all(
      (reviews || []).map(async (review) => {
        const [{ data: images }, { data: votes }, { data: reports }] = await Promise.all([
          supabase.from('review_images').select('*').eq('review_id', review.id),
          supabase.from('review_votes').select('*').eq('review_id', review.id),
          supabase.from('review_reports').select('*').eq('review_id', review.id),
        ]);

        return {
          ...review,
          images: images || [],
          votes: votes || [],
          reports: reports || [],
        };
      })
    );

    return { reviews: reviewsWithDetails, total: count || 0 };
  } catch (error) {
    console.error('Error in getProductReviews:', error);
    return { reviews: [], total: 0 };
  }
}

/**
 * Get pending reviews for moderation
 */
export async function getPendingReviews(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ reviews: ProductReviewWithDetails[]; total: number }> {
  try {
    let query = supabase
      .from('product_reviews')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    const { data: reviews, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching pending reviews:', error);
      return { reviews: [], total: 0 };
    }

    // Fetch related data
    const reviewsWithDetails = await Promise.all(
      (reviews || []).map(async (review) => {
        const [{ data: images }, { data: votes }] = await Promise.all([
          supabase.from('review_images').select('*').eq('review_id', review.id),
          supabase.from('review_votes').select('*').eq('review_id', review.id),
        ]);

        return {
          ...review,
          images: images || [],
          votes: votes || [],
          reports: [],
        };
      })
    );

    return { reviews: reviewsWithDetails, total: count || 0 };
  } catch (error) {
    console.error('Error in getPendingReviews:', error);
    return { reviews: [], total: 0 };
  }
}

/**
 * Update product rating summary
 */
export async function updateProductRatingSummary(
  userId: string,
  productId: string
): Promise<ProductRatingSummary | null> {
  try {
    // Get all approved reviews for product
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (!reviews || reviews.length === 0) {
      // No reviews yet, create summary with zeros
      const { data } = await supabase
        .from('product_rating_summaries')
        .upsert({
          user_id: userId,
          product_id: productId,
          total_reviews: 0,
          approved_reviews: 0,
          average_rating: 0,
          rating_5_count: 0,
          rating_4_count: 0,
          rating_3_count: 0,
          rating_2_count: 0,
          rating_1_count: 0,
          updated_at: new Date(),
        })
        .select()
        .single();

      return data;
    }

    // Calculate summary
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviews.forEach((r) => {
      totalRating += r.rating;
      ratingCounts[r.rating as keyof typeof ratingCounts]++;
    });

    const averageRating = totalRating / reviews.length;

    const { data, error } = await supabase
      .from('product_rating_summaries')
      .upsert({
        user_id: userId,
        product_id: productId,
        total_reviews: reviews.length,
        approved_reviews: reviews.length,
        average_rating: Math.round(averageRating * 100) / 100,
        rating_5_count: ratingCounts[5],
        rating_4_count: ratingCounts[4],
        rating_3_count: ratingCounts[3],
        rating_2_count: ratingCounts[2],
        rating_1_count: ratingCounts[1],
        recommendation_count: ratingCounts[5] + ratingCounts[4],
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating rating summary:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateProductRatingSummary:', error);
    return null;
  }
}

/**
 * Get product rating summary
 */
export async function getProductRatingSummary(
  productId: string
): Promise<ProductRatingSummary | null> {
  try {
    const { data, error } = await supabase
      .from('product_rating_summaries')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error) {
      console.error('Error fetching rating summary:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getProductRatingSummary:', error);
    return null;
  }
}

/**
 * Record review analytics
 */
export async function recordReviewAnalytics(
  userId: string,
  analytics: {
    date: Date;
    productId?: string;
    totalNewReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
    averageRating: number;
    positiveReviews: number;
    negativeReviews: number;
    totalHelpfulVotes: number;
    responseRate: number;
  }
): Promise<ReviewAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('review_analytics')
      .insert({
        user_id: userId,
        date: analytics.date,
        product_id: analytics.productId,
        total_new_reviews: analytics.totalNewReviews,
        approved_reviews: analytics.approvedReviews,
        rejected_reviews: analytics.rejectedReviews,
        average_rating: analytics.averageRating,
        positive_reviews: analytics.positiveReviews,
        negative_reviews: analytics.negativeReviews,
        total_helpful_votes: analytics.totalHelpfulVotes,
        response_rate: analytics.responseRate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording review analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in recordReviewAnalytics:', error);
    return null;
  }
}

/**
 * Get review analytics for date range
 */
export async function getReviewAnalytics(
  userId: string,
  productId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<ReviewAnalytics[]> {
  try {
    let query = supabase
      .from('review_analytics')
      .select('*')
      .eq('user_id', userId);

    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      console.error('Error fetching review analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReviewAnalytics:', error);
    return [];
  }
}

/**
 * Feature a review
 */
export async function featureReview(reviewId: string, featured: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_reviews')
      .update({
        is_featured: featured,
        updated_at: new Date(),
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Error featuring review:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in featureReview:', error);
    return false;
  }
}
