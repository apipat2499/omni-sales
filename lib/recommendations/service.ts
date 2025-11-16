import { createClient } from '@supabase/supabase-js';
import {
  RecommendationAlgorithm,
  ProductEmbedding,
  ProductRelationship,
  ProductRecommendation,
  RecommendationClick,
  RecommendationConversion,
  RecommendationRule,
  RecommendationAnalytics,
  RecommendationProductPerformance,
  PersonalizationPreferences,
  Product,
} from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================
// ALGORITHM MANAGEMENT
// ============================================

export async function createAlgorithm(
  userId: string,
  algorithm: Partial<RecommendationAlgorithm>
): Promise<RecommendationAlgorithm | null> {
  try {
    const { data, error } = await supabase
      .from('recommendation_algorithms')
      .insert({
        user_id: userId,
        algorithm_type: algorithm.algorithmType,
        algorithm_name: algorithm.algorithmName,
        description: algorithm.description,
        config: algorithm.config || {},
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as RecommendationAlgorithm;
  } catch (err) {
    console.error('Error creating algorithm:', err);
    return null;
  }
}

export async function getAlgorithms(userId: string): Promise<RecommendationAlgorithm[]> {
  try {
    const { data, error } = await supabase
      .from('recommendation_algorithms')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RecommendationAlgorithm[];
  } catch (err) {
    console.error('Error fetching algorithms:', err);
    return [];
  }
}

export async function updateAlgorithm(
  algorithmId: string,
  updates: Partial<RecommendationAlgorithm>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recommendation_algorithms')
      .update({
        algorithm_name: updates.algorithmName,
        description: updates.description,
        config: updates.config,
        is_active: updates.isActive,
        updated_at: new Date(),
      })
      .eq('id', algorithmId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating algorithm:', err);
    return false;
  }
}

// ============================================
// PRODUCT EMBEDDINGS & RELATIONSHIPS
// ============================================

export async function createProductEmbedding(
  userId: string,
  embedding: Partial<ProductEmbedding>
): Promise<ProductEmbedding | null> {
  try {
    const { data, error } = await supabase
      .from('product_embeddings')
      .upsert({
        user_id: userId,
        product_id: embedding.productId,
        embedding_model: embedding.embeddingModel,
        embedding_vector: embedding.embeddingVector,
        category_embedding: embedding.categoryEmbedding,
        quality_score: embedding.qualityScore,
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProductEmbedding;
  } catch (err) {
    console.error('Error creating product embedding:', err);
    return null;
  }
}

export async function getProductEmbedding(productId: string): Promise<ProductEmbedding | null> {
  try {
    const { data, error } = await supabase
      .from('product_embeddings')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as ProductEmbedding;
  } catch (err) {
    console.error('Error fetching product embedding:', err);
    return null;
  }
}

export async function createProductRelationship(
  userId: string,
  relationship: Partial<ProductRelationship>
): Promise<ProductRelationship | null> {
  try {
    const { data, error } = await supabase
      .from('product_relationships')
      .upsert({
        user_id: userId,
        product_id_1: relationship.productId1,
        product_id_2: relationship.productId2,
        relationship_type: relationship.relationshipType,
        strength: relationship.strength,
        frequency: relationship.frequency || 1,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProductRelationship;
  } catch (err) {
    console.error('Error creating product relationship:', err);
    return null;
  }
}

export async function getProductRelationships(
  productId: string,
  relationshipType?: string
): Promise<ProductRelationship[]> {
  try {
    let query = supabase
      .from('product_relationships')
      .select('*')
      .or(`product_id_1.eq.${productId},product_id_2.eq.${productId}`);

    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType);
    }

    const { data, error } = await query.order('strength', { ascending: false });

    if (error) throw error;
    return (data || []) as ProductRelationship[];
  } catch (err) {
    console.error('Error fetching product relationships:', err);
    return [];
  }
}

// ============================================
// PRODUCT RECOMMENDATIONS
// ============================================

export async function generateRecommendations(
  userId: string,
  customerId: string,
  context: string = 'product_page',
  maxRecommendations: number = 5
): Promise<ProductRecommendation[]> {
  try {
    // Fetch customer behavior to understand preferences
    const { data: behaviorData } = await supabase
      .from('customer_behavior_events')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch active algorithms
    const algorithms = await getAlgorithms(userId);
    if (algorithms.length === 0) return [];

    // Generate recommendations using first active algorithm
    const algorithm = algorithms[0];
    const recommendations: ProductRecommendation[] = [];

    // Get products customer has interacted with
    const viewedProductIds = new Set(
      (behaviorData || []).map((e: any) => e.product_id).filter(Boolean)
    );

    // Get similar products based on relationships or embeddings
    const similarProducts = await getSimilarProductsByBehavior(
      Array.from(viewedProductIds) as string[],
      maxRecommendations
    );

    // Create recommendation records
    for (let i = 0; i < similarProducts.length && i < maxRecommendations; i++) {
      const { data, error } = await supabase
        .from('product_recommendations')
        .insert({
          user_id: userId,
          customer_id: customerId,
          recommended_product_id: similarProducts[i].id,
          recommendation_reason: `Based on ${algorithm.algorithmName}`,
          rank_position: i + 1,
          relevance_score: 75 + Math.random() * 25, // 75-100
          algorithm_type: algorithm.algorithmType,
          recommendation_context: context,
          is_shown: false,
          created_at: new Date(),
        })
        .select()
        .single();

      if (!error && data) {
        recommendations.push(data as ProductRecommendation);
      }
    }

    return recommendations;
  } catch (err) {
    console.error('Error generating recommendations:', err);
    return [];
  }
}

export async function recordRecommendationImpression(
  recommendationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_recommendations')
      .update({
        is_shown: true,
        shown_at: new Date(),
      })
      .eq('id', recommendationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error recording recommendation impression:', err);
    return false;
  }
}

export async function getRecommendations(
  customerId: string,
  context?: string
): Promise<ProductRecommendation[]> {
  try {
    let query = supabase
      .from('product_recommendations')
      .select('*')
      .eq('customer_id', customerId)
      .order('rank_position', { ascending: true });

    if (context) {
      query = query.eq('recommendation_context', context);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as ProductRecommendation[];
  } catch (err) {
    console.error('Error fetching recommendations:', err);
    return [];
  }
}

// ============================================
// CLICK & CONVERSION TRACKING
// ============================================

export async function trackRecommendationClick(
  userId: string,
  customerId: string,
  recommendationId: string,
  productId: string,
  deviceType?: string
): Promise<boolean> {
  try {
    // Record the click
    const { error: clickError } = await supabase
      .from('recommendation_clicks')
      .insert({
        user_id: userId,
        customer_id: customerId,
        recommendation_id: recommendationId,
        product_id: productId,
        clicked_at: new Date(),
        device_type: deviceType,
      });

    // Update recommendation as clicked
    const { error: updateError } = await supabase
      .from('product_recommendations')
      .update({
        is_clicked: true,
        clicked_at: new Date(),
      })
      .eq('id', recommendationId);

    if (clickError || updateError) throw clickError || updateError;
    return true;
  } catch (err) {
    console.error('Error tracking recommendation click:', err);
    return false;
  }
}

export async function trackRecommendationConversion(
  userId: string,
  customerId: string,
  recommendationId: string,
  productId: string,
  orderId: string,
  revenue: number
): Promise<boolean> {
  try {
    // Record the conversion
    const { error: conversionError } = await supabase
      .from('recommendation_conversions')
      .insert({
        user_id: userId,
        customer_id: customerId,
        recommendation_id: recommendationId,
        product_id: productId,
        order_id: orderId,
        revenue: revenue,
        converted_at: new Date(),
      });

    // Update recommendation as purchased
    const { error: updateError } = await supabase
      .from('product_recommendations')
      .update({
        is_purchased: true,
        purchased_at: new Date(),
      })
      .eq('id', recommendationId);

    if (conversionError || updateError) throw conversionError || updateError;
    return true;
  } catch (err) {
    console.error('Error tracking recommendation conversion:', err);
    return false;
  }
}

export async function getRecommendationClicks(
  customerId: string,
  days: number = 30
): Promise<RecommendationClick[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('recommendation_clicks')
      .select('*')
      .eq('customer_id', customerId)
      .gte('clicked_at', startDate.toISOString())
      .order('clicked_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RecommendationClick[];
  } catch (err) {
    console.error('Error fetching recommendation clicks:', err);
    return [];
  }
}

export async function getRecommendationConversions(
  userId: string,
  days: number = 30
): Promise<RecommendationConversion[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('recommendation_conversions')
      .select('*')
      .eq('user_id', userId)
      .gte('converted_at', startDate.toISOString())
      .order('converted_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RecommendationConversion[];
  } catch (err) {
    console.error('Error fetching recommendation conversions:', err);
    return [];
  }
}

// ============================================
// RECOMMENDATION RULES
// ============================================

export async function createRecommendationRule(
  userId: string,
  rule: Partial<RecommendationRule>
): Promise<RecommendationRule | null> {
  try {
    const { data, error } = await supabase
      .from('recommendation_rules')
      .insert({
        user_id: userId,
        rule_name: rule.ruleName,
        rule_type: rule.ruleType,
        condition_product_id: rule.conditionProductId,
        condition_category: rule.conditionCategory,
        condition_segment_id: rule.conditionSegmentId,
        condition_price_min: rule.conditionPriceMin,
        condition_price_max: rule.conditionPriceMax,
        recommended_product_ids: rule.recommendedProductIds || [],
        is_active: true,
        priority: rule.priority || 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as RecommendationRule;
  } catch (err) {
    console.error('Error creating recommendation rule:', err);
    return null;
  }
}

export async function getRecommendationRules(userId: string): Promise<RecommendationRule[]> {
  try {
    const { data, error } = await supabase
      .from('recommendation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as RecommendationRule[];
  } catch (err) {
    console.error('Error fetching recommendation rules:', err);
    return [];
  }
}

export async function updateRecommendationRule(
  ruleId: string,
  updates: Partial<RecommendationRule>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recommendation_rules')
      .update({
        rule_name: updates.ruleName,
        condition_product_id: updates.conditionProductId,
        recommended_product_ids: updates.recommendedProductIds,
        is_active: updates.isActive,
        priority: updates.priority,
        updated_at: new Date(),
      })
      .eq('id', ruleId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating recommendation rule:', err);
    return false;
  }
}

// ============================================
// ANALYTICS
// ============================================

export async function recordRecommendationAnalytics(
  userId: string,
  analytics: Partial<RecommendationAnalytics>
): Promise<RecommendationAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('recommendation_analytics')
      .insert({
        user_id: userId,
        date: analytics.date || new Date(),
        algorithm_type: analytics.algorithmType,
        total_recommendations: analytics.totalRecommendations || 0,
        total_impressions: analytics.totalImpressions || 0,
        total_clicks: analytics.totalClicks || 0,
        total_conversions: analytics.totalConversions || 0,
        click_through_rate: analytics.clickThroughRate,
        conversion_rate: analytics.conversionRate,
        revenue_generated: analytics.revenueGenerated,
        avg_relevance_score: analytics.avgRelevanceScore,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as RecommendationAnalytics;
  } catch (err) {
    console.error('Error recording recommendation analytics:', err);
    return null;
  }
}

export async function getRecommendationAnalytics(
  userId: string,
  days: number = 30
): Promise<RecommendationAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('recommendation_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as RecommendationAnalytics[];
  } catch (err) {
    console.error('Error fetching recommendation analytics:', err);
    return [];
  }
}

export async function recordProductPerformance(
  userId: string,
  performance: Partial<RecommendationProductPerformance>
): Promise<RecommendationProductPerformance | null> {
  try {
    const { data, error } = await supabase
      .from('recommendation_product_performance')
      .insert({
        user_id: userId,
        product_id: performance.productId,
        date: performance.date || new Date(),
        times_recommended: performance.timesRecommended || 0,
        times_clicked: performance.timesClicked || 0,
        times_purchased: performance.timesPurchased || 0,
        revenue: performance.revenue,
        click_rate: performance.clickRate,
        conversion_rate: performance.conversionRate,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as RecommendationProductPerformance;
  } catch (err) {
    console.error('Error recording product performance:', err);
    return null;
  }
}

export async function getProductPerformance(
  productId: string,
  days: number = 30
): Promise<RecommendationProductPerformance[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('recommendation_product_performance')
      .select('*')
      .eq('product_id', productId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as RecommendationProductPerformance[];
  } catch (err) {
    console.error('Error fetching product performance:', err);
    return [];
  }
}

// ============================================
// PERSONALIZATION PREFERENCES
// ============================================

export async function setPersonalizationPreferences(
  userId: string,
  customerId: string,
  preferences: Partial<PersonalizationPreferences>
): Promise<PersonalizationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('personalization_preferences')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        max_recommendations: preferences.maxRecommendations,
        preferred_categories: preferences.preferredCategories,
        excluded_categories: preferences.excludedCategories,
        preferred_price_range_min: preferences.preferredPriceRangeMin,
        preferred_price_range_max: preferences.preferredPriceRangeMax,
        exclude_already_viewed: preferences.excludeAlreadyViewed,
        exclude_already_purchased: preferences.excludeAlreadyPurchased,
        enable_trending: preferences.enableTrending,
        enable_similar: preferences.enableSimilar,
        enable_seasonal: preferences.enableSeasonal,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PersonalizationPreferences;
  } catch (err) {
    console.error('Error setting personalization preferences:', err);
    return null;
  }
}

export async function getPersonalizationPreferences(
  customerId: string
): Promise<PersonalizationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('personalization_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as PersonalizationPreferences;
  } catch (err) {
    console.error('Error fetching personalization preferences:', err);
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getSimilarProductsByBehavior(
  productIds: string[],
  limit: number = 5
): Promise<Product[]> {
  try {
    if (productIds.length === 0) {
      // Get popular products if no history
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return (data || []) as Product[];
    }

    // Get related products from relationships
    const relationships = await Promise.all(
      productIds.map((id) => getProductRelationships(id))
    );

    const relatedProductIds = new Set<string>();
    relationships.forEach((rels) => {
      rels.forEach((rel) => {
        if (productIds.includes(rel.productId1)) {
          relatedProductIds.add(rel.productId2);
        } else {
          relatedProductIds.add(rel.productId1);
        }
      });
    });

    // Get products excluding already viewed
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .not('id', 'in', `(${[...productIds, ...relatedProductIds].join(',')})`)
      .limit(limit);

    if (error) throw error;
    return (data || []) as Product[];
  } catch (err) {
    console.error('Error getting similar products:', err);
    return [];
  }
}

export async function calculateRecommendationMetrics(
  userId: string,
  date: Date
): Promise<Partial<RecommendationAnalytics>> {
  try {
    // Get all recommendations shown on this date
    const { data: recommendations } = await supabase
      .from('product_recommendations')
      .select('id, is_clicked, is_purchased')
      .eq('user_id', userId)
      .gte('shown_at', new Date(date).toISOString())
      .lt('shown_at', new Date(date.getTime() + 86400000).toISOString());

    const totalRecommendations = recommendations?.length || 0;
    const totalClicks = recommendations?.filter((r: any) => r.is_clicked).length || 0;
    const totalConversions = recommendations?.filter((r: any) => r.is_purchased).length || 0;

    return {
      totalRecommendations,
      totalImpressions: totalRecommendations,
      totalClicks,
      totalConversions,
      clickThroughRate: totalRecommendations > 0 ? (totalClicks / totalRecommendations) * 100 : 0,
      conversionRate: totalRecommendations > 0 ? (totalConversions / totalRecommendations) * 100 : 0,
    };
  } catch (err) {
    console.error('Error calculating recommendation metrics:', err);
    return {};
  }
}
