import { supabase } from '@/lib/supabase/client';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface UserItemRating {
  userId: string;
  itemId: string;
  rating: number; // implicit rating based on interactions
  timestamp: Date;
}

export interface ItemSimilarity {
  itemId1: string;
  itemId2: string;
  similarity: number;
}

export interface UserSimilarity {
  userId1: string;
  userId2: string;
  similarity: number;
}

export interface ProductFeatures {
  productId: string;
  category: string;
  price: number;
  tags: string[];
  description: string;
}

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
  algorithm: 'collaborative' | 'content-based' | 'hybrid';
}

// ============================================
// USER-BASED COLLABORATIVE FILTERING
// ============================================

/**
 * Calculate cosine similarity between two users based on their rating vectors
 */
export function calculateCosineSimilarity(
  user1Ratings: Map<string, number>,
  user2Ratings: Map<string, number>
): number {
  const commonItems = new Set(
    [...user1Ratings.keys()].filter(item => user2Ratings.has(item))
  );

  if (commonItems.size === 0) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  commonItems.forEach(itemId => {
    const r1 = user1Ratings.get(itemId) || 0;
    const r2 = user2Ratings.get(itemId) || 0;
    dotProduct += r1 * r2;
    norm1 += r1 * r1;
    norm2 += r2 * r2;
  });

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Calculate Pearson correlation coefficient between two users
 */
export function calculatePearsonCorrelation(
  user1Ratings: Map<string, number>,
  user2Ratings: Map<string, number>
): number {
  const commonItems = new Set(
    [...user1Ratings.keys()].filter(item => user2Ratings.has(item))
  );

  if (commonItems.size < 2) return 0;

  const ratings1: number[] = [];
  const ratings2: number[] = [];

  commonItems.forEach(itemId => {
    ratings1.push(user1Ratings.get(itemId) || 0);
    ratings2.push(user2Ratings.get(itemId) || 0);
  });

  const mean1 = ratings1.reduce((a, b) => a + b, 0) / ratings1.length;
  const mean2 = ratings2.reduce((a, b) => a + b, 0) / ratings2.length;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < ratings1.length; i++) {
    const diff1 = ratings1[i] - mean1;
    const diff2 = ratings2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  if (denom1 === 0 || denom2 === 0) return 0;

  return numerator / (Math.sqrt(denom1) * Math.sqrt(denom2));
}

/**
 * Build user-item rating matrix from interaction history
 */
export async function buildUserItemMatrix(
  userId: string,
  daysBack: number = 90
): Promise<Map<string, Map<string, number>>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Fetch all customer interactions (orders, views, clicks)
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        total,
        created_at,
        order_items (
          product_id,
          quantity,
          price
        )
      `)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const matrix = new Map<string, Map<string, number>>();

    orders?.forEach((order: any) => {
      const customerId = order.customer_id;
      if (!matrix.has(customerId)) {
        matrix.set(customerId, new Map());
      }

      const userRatings = matrix.get(customerId)!;

      order.order_items?.forEach((item: any) => {
        const productId = item.product_id;
        const currentRating = userRatings.get(productId) || 0;
        // Rating = normalized quantity * price (indicates preference strength)
        const rating = Math.min(item.quantity * (item.price / 100), 10);
        userRatings.set(productId, currentRating + rating);
      });
    });

    return matrix;
  } catch (error) {
    console.error('Error building user-item matrix:', error);
    return new Map();
  }
}

/**
 * Find K most similar users to target user
 */
export async function findSimilarUsers(
  targetUserId: string,
  k: number = 10
): Promise<UserSimilarity[]> {
  try {
    const matrix = await buildUserItemMatrix(targetUserId);
    const targetRatings = matrix.get(targetUserId);

    if (!targetRatings || targetRatings.size === 0) {
      return [];
    }

    const similarities: UserSimilarity[] = [];

    matrix.forEach((userRatings, userId) => {
      if (userId === targetUserId) return;

      const similarity = calculatePearsonCorrelation(targetRatings, userRatings);

      if (similarity > 0) {
        similarities.push({
          userId1: targetUserId,
          userId2: userId,
          similarity,
        });
      }
    });

    // Sort by similarity and take top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  } catch (error) {
    console.error('Error finding similar users:', error);
    return [];
  }
}

/**
 * Generate user-based collaborative filtering recommendations
 */
export async function userBasedCollaborativeFiltering(
  userId: string,
  topN: number = 10
): Promise<RecommendationResult[]> {
  try {
    const similarUsers = await findSimilarUsers(userId, 20);

    if (similarUsers.length === 0) {
      return [];
    }

    const matrix = await buildUserItemMatrix(userId);
    const targetRatings = matrix.get(userId) || new Map();
    const productScores = new Map<string, number>();
    const productWeights = new Map<string, number>();

    // Aggregate ratings from similar users
    similarUsers.forEach(({ userId2, similarity }) => {
      const userRatings = matrix.get(userId2);
      if (!userRatings) return;

      userRatings.forEach((rating, productId) => {
        // Skip products already rated by target user
        if (targetRatings.has(productId)) return;

        const currentScore = productScores.get(productId) || 0;
        const currentWeight = productWeights.get(productId) || 0;

        productScores.set(productId, currentScore + rating * similarity);
        productWeights.set(productId, currentWeight + similarity);
      });
    });

    // Calculate weighted average scores
    const recommendations: RecommendationResult[] = [];
    productScores.forEach((score, productId) => {
      const weight = productWeights.get(productId) || 1;
      const normalizedScore = score / weight;

      recommendations.push({
        productId,
        score: normalizedScore,
        reason: `Based on similar users' preferences`,
        algorithm: 'collaborative',
      });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  } catch (error) {
    console.error('Error in user-based collaborative filtering:', error);
    return [];
  }
}

// ============================================
// ITEM-BASED COLLABORATIVE FILTERING
// ============================================

/**
 * Calculate Jaccard similarity between two items based on user overlap
 */
export function calculateJaccardSimilarity(
  item1Users: Set<string>,
  item2Users: Set<string>
): number {
  const intersection = new Set([...item1Users].filter(u => item2Users.has(u)));
  const union = new Set([...item1Users, ...item2Users]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Build item-item similarity matrix
 */
export async function buildItemSimilarityMatrix(): Promise<Map<string, Map<string, number>>> {
  try {
    const matrix = await buildUserItemMatrix('all');
    const itemUsers = new Map<string, Set<string>>();

    // Build reverse index: item -> users who rated it
    matrix.forEach((userRatings, userId) => {
      userRatings.forEach((rating, productId) => {
        if (!itemUsers.has(productId)) {
          itemUsers.set(productId, new Set());
        }
        itemUsers.get(productId)!.add(userId);
      });
    });

    // Calculate item-item similarities
    const similarities = new Map<string, Map<string, number>>();
    const products = Array.from(itemUsers.keys());

    for (let i = 0; i < products.length; i++) {
      const product1 = products[i];
      const users1 = itemUsers.get(product1)!;

      if (!similarities.has(product1)) {
        similarities.set(product1, new Map());
      }

      for (let j = i + 1; j < products.length; j++) {
        const product2 = products[j];
        const users2 = itemUsers.get(product2)!;

        const similarity = calculateJaccardSimilarity(users1, users2);

        if (similarity > 0) {
          similarities.get(product1)!.set(product2, similarity);
          if (!similarities.has(product2)) {
            similarities.set(product2, new Map());
          }
          similarities.get(product2)!.set(product1, similarity);
        }
      }
    }

    return similarities;
  } catch (error) {
    console.error('Error building item similarity matrix:', error);
    return new Map();
  }
}

/**
 * Generate item-based collaborative filtering recommendations
 */
export async function itemBasedCollaborativeFiltering(
  userId: string,
  topN: number = 10
): Promise<RecommendationResult[]> {
  try {
    const matrix = await buildUserItemMatrix(userId);
    const userRatings = matrix.get(userId);

    if (!userRatings || userRatings.size === 0) {
      return [];
    }

    const similarities = await buildItemSimilarityMatrix();
    const productScores = new Map<string, number>();
    const productWeights = new Map<string, number>();

    // For each item the user has rated
    userRatings.forEach((rating, ratedProductId) => {
      const similarItems = similarities.get(ratedProductId);
      if (!similarItems) return;

      // For each similar item
      similarItems.forEach((similarity, candidateProductId) => {
        // Skip if user already rated this item
        if (userRatings.has(candidateProductId)) return;

        const currentScore = productScores.get(candidateProductId) || 0;
        const currentWeight = productWeights.get(candidateProductId) || 0;

        productScores.set(candidateProductId, currentScore + rating * similarity);
        productWeights.set(candidateProductId, currentWeight + similarity);
      });
    });

    // Calculate weighted average scores
    const recommendations: RecommendationResult[] = [];
    productScores.forEach((score, productId) => {
      const weight = productWeights.get(productId) || 1;
      const normalizedScore = score / weight;

      recommendations.push({
        productId,
        score: normalizedScore,
        reason: 'Based on items you liked',
        algorithm: 'collaborative',
      });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  } catch (error) {
    console.error('Error in item-based collaborative filtering:', error);
    return [];
  }
}

// ============================================
// CONTENT-BASED FILTERING
// ============================================

/**
 * Extract TF-IDF features from product descriptions
 */
export function calculateTFIDF(
  productDescriptions: Map<string, string>
): Map<string, Map<string, number>> {
  const productFeatures = new Map<string, Map<string, number>>();
  const documentFrequency = new Map<string, number>();
  const totalDocuments = productDescriptions.size;

  // Calculate term frequency for each document
  productDescriptions.forEach((description, productId) => {
    const words = description.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const termFreq = new Map<string, number>();

    words.forEach(word => {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    });

    productFeatures.set(productId, termFreq);

    // Update document frequency
    new Set(words).forEach(word => {
      documentFrequency.set(word, (documentFrequency.get(word) || 0) + 1);
    });
  });

  // Calculate TF-IDF
  productFeatures.forEach((termFreq, productId) => {
    const tfidf = new Map<string, number>();

    termFreq.forEach((tf, term) => {
      const df = documentFrequency.get(term) || 1;
      const idf = Math.log(totalDocuments / df);
      tfidf.set(term, tf * idf);
    });

    productFeatures.set(productId, tfidf);
  });

  return productFeatures;
}

/**
 * Calculate content similarity between two products
 */
export function calculateContentSimilarity(
  product1Features: Map<string, number>,
  product2Features: Map<string, number>
): number {
  const allTerms = new Set([...product1Features.keys(), ...product2Features.keys()]);
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  allTerms.forEach(term => {
    const val1 = product1Features.get(term) || 0;
    const val2 = product2Features.get(term) || 0;

    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  });

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Generate content-based filtering recommendations
 */
export async function contentBasedFiltering(
  userId: string,
  topN: number = 10
): Promise<RecommendationResult[]> {
  try {
    // Get user's purchase/view history
    const matrix = await buildUserItemMatrix(userId);
    const userRatings = matrix.get(userId);

    if (!userRatings || userRatings.size === 0) {
      return [];
    }

    // Fetch all products with descriptions
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, category, description, price');

    if (error) throw error;

    const productDescriptions = new Map<string, string>();
    const productData = new Map<string, any>();

    products?.forEach((product: any) => {
      const description = `${product.name} ${product.category} ${product.description || ''}`;
      productDescriptions.set(product.id, description);
      productData.set(product.id, product);
    });

    // Calculate TF-IDF features
    const features = calculateTFIDF(productDescriptions);

    // Build user profile from rated items
    const userProfile = new Map<string, number>();
    const ratedProducts = Array.from(userRatings.keys());

    ratedProducts.forEach(productId => {
      const productFeatures = features.get(productId);
      const rating = userRatings.get(productId) || 0;

      productFeatures?.forEach((value, term) => {
        userProfile.set(term, (userProfile.get(term) || 0) + value * rating);
      });
    });

    // Score all unrated products against user profile
    const recommendations: RecommendationResult[] = [];

    features.forEach((productFeatures, productId) => {
      if (userRatings.has(productId)) return;

      const similarity = calculateContentSimilarity(userProfile, productFeatures);

      if (similarity > 0) {
        recommendations.push({
          productId,
          score: similarity,
          reason: 'Based on your interests',
          algorithm: 'content-based',
        });
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  } catch (error) {
    console.error('Error in content-based filtering:', error);
    return [];
  }
}

// ============================================
// HYBRID RECOMMENDATION ENGINE
// ============================================

/**
 * Combine multiple recommendation algorithms using weighted average
 */
export async function hybridRecommendation(
  userId: string,
  topN: number = 10,
  weights: {
    userBased: number;
    itemBased: number;
    contentBased: number;
  } = { userBased: 0.4, itemBased: 0.4, contentBased: 0.2 }
): Promise<RecommendationResult[]> {
  try {
    // Run all algorithms in parallel
    const [userBasedRecs, itemBasedRecs, contentBasedRecs] = await Promise.all([
      userBasedCollaborativeFiltering(userId, topN * 2),
      itemBasedCollaborativeFiltering(userId, topN * 2),
      contentBasedFiltering(userId, topN * 2),
    ]);

    // Combine scores
    const combinedScores = new Map<string, number>();
    const reasons = new Map<string, string[]>();

    const addRecommendations = (recs: RecommendationResult[], weight: number) => {
      recs.forEach(rec => {
        const currentScore = combinedScores.get(rec.productId) || 0;
        combinedScores.set(rec.productId, currentScore + rec.score * weight);

        if (!reasons.has(rec.productId)) {
          reasons.set(rec.productId, []);
        }
        reasons.get(rec.productId)!.push(rec.reason);
      });
    };

    addRecommendations(userBasedRecs, weights.userBased);
    addRecommendations(itemBasedRecs, weights.itemBased);
    addRecommendations(contentBasedRecs, weights.contentBased);

    // Build final recommendations
    const recommendations: RecommendationResult[] = [];
    combinedScores.forEach((score, productId) => {
      const productReasons = reasons.get(productId) || [];
      recommendations.push({
        productId,
        score,
        reason: productReasons[0] || 'Recommended for you',
        algorithm: 'hybrid',
      });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  } catch (error) {
    console.error('Error in hybrid recommendation:', error);
    return [];
  }
}

// ============================================
// RECOMMENDATION STORAGE & RETRIEVAL
// ============================================

/**
 * Store recommendation scores in database cache
 */
export async function storeRecommendations(
  userId: string,
  recommendations: RecommendationResult[],
  context: string = 'general'
): Promise<boolean> {
  try {
    const records = recommendations.map((rec, index) => ({
      user_id: userId,
      product_id: rec.productId,
      score: rec.score,
      reason: rec.reason,
      algorithm: rec.algorithm,
      rank: index + 1,
      context,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }));

    // Delete old recommendations for this user/context
    await supabase
      .from('ml_recommendation_cache')
      .delete()
      .eq('user_id', userId)
      .eq('context', context);

    // Insert new recommendations
    const { error } = await supabase
      .from('ml_recommendation_cache')
      .insert(records);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error storing recommendations:', error);
    return false;
  }
}

/**
 * Retrieve cached recommendations
 */
export async function getCachedRecommendations(
  userId: string,
  context: string = 'general'
): Promise<RecommendationResult[]> {
  try {
    const { data, error } = await supabase
      .from('ml_recommendation_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('context', context)
      .gt('expires_at', new Date().toISOString())
      .order('rank', { ascending: true });

    if (error) throw error;

    return (data || []).map((record: any) => ({
      productId: record.product_id,
      score: record.score,
      reason: record.reason,
      algorithm: record.algorithm as any,
    }));
  } catch (error) {
    console.error('Error retrieving cached recommendations:', error);
    return [];
  }
}

/**
 * Main recommendation function with caching
 */
export async function getRecommendations(
  userId: string,
  options: {
    topN?: number;
    algorithm?: 'user-based' | 'item-based' | 'content-based' | 'hybrid';
    context?: string;
    useCache?: boolean;
  } = {}
): Promise<RecommendationResult[]> {
  const {
    topN = 10,
    algorithm = 'hybrid',
    context = 'general',
    useCache = true,
  } = options;

  // Try cache first
  if (useCache) {
    const cached = await getCachedRecommendations(userId, context);
    if (cached.length > 0) {
      return cached.slice(0, topN);
    }
  }

  // Generate new recommendations
  let recommendations: RecommendationResult[] = [];

  switch (algorithm) {
    case 'user-based':
      recommendations = await userBasedCollaborativeFiltering(userId, topN);
      break;
    case 'item-based':
      recommendations = await itemBasedCollaborativeFiltering(userId, topN);
      break;
    case 'content-based':
      recommendations = await contentBasedFiltering(userId, topN);
      break;
    case 'hybrid':
    default:
      recommendations = await hybridRecommendation(userId, topN);
      break;
  }

  // Store in cache
  if (recommendations.length > 0) {
    await storeRecommendations(userId, recommendations, context);
  }

  return recommendations;
}

// Export all functions
export default {
  getRecommendations,
  userBasedCollaborativeFiltering,
  itemBasedCollaborativeFiltering,
  contentBasedFiltering,
  hybridRecommendation,
  storeRecommendations,
  getCachedRecommendations,
};
