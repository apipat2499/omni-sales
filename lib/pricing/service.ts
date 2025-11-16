import { createClient } from '@supabase/supabase-js';
import {
  PricingStrategy,
  PricingRule,
  CompetitorPrice,
  ProductPricingHistory,
  DemandIndicator,
  PriceElasticity,
  DynamicPricingAnalytics,
  PriceTest,
} from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================
// PRICING STRATEGY MANAGEMENT
// ============================================

export async function createPricingStrategy(
  userId: string,
  strategy: Partial<PricingStrategy>
): Promise<PricingStrategy | null> {
  try {
    const { data, error } = await supabase
      .from('pricing_strategies')
      .insert({
        user_id: userId,
        strategy_name: strategy.strategyName,
        strategy_type: strategy.strategyType,
        description: strategy.description,
        is_active: true,
        priority: strategy.priority || 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PricingStrategy;
  } catch (err) {
    console.error('Error creating pricing strategy:', err);
    return null;
  }
}

export async function getPricingStrategies(userId: string): Promise<PricingStrategy[]> {
  try {
    const { data, error } = await supabase
      .from('pricing_strategies')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as PricingStrategy[];
  } catch (err) {
    console.error('Error fetching pricing strategies:', err);
    return [];
  }
}

export async function updatePricingStrategy(
  strategyId: string,
  updates: Partial<PricingStrategy>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pricing_strategies')
      .update({
        strategy_name: updates.strategyName,
        description: updates.description,
        is_active: updates.isActive,
        priority: updates.priority,
        updated_at: new Date(),
      })
      .eq('id', strategyId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating pricing strategy:', err);
    return false;
  }
}

// ============================================
// PRICING RULES
// ============================================

export async function createPricingRule(
  userId: string,
  rule: Partial<PricingRule>
): Promise<PricingRule | null> {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({
        user_id: userId,
        strategy_id: rule.strategyId,
        rule_name: rule.ruleName,
        rule_type: rule.ruleType,
        condition_field: rule.conditionField,
        condition_operator: rule.conditionOperator,
        condition_value: rule.conditionValue,
        price_adjustment_type: rule.priceAdjustmentType,
        price_adjustment_value: rule.priceAdjustmentValue,
        min_price: rule.minPrice,
        max_price: rule.maxPrice,
        is_active: true,
        priority: rule.priority || 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PricingRule;
  } catch (err) {
    console.error('Error creating pricing rule:', err);
    return null;
  }
}

export async function getPricingRules(strategyId: string): Promise<PricingRule[]> {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as PricingRule[];
  } catch (err) {
    console.error('Error fetching pricing rules:', err);
    return [];
  }
}

export async function updatePricingRule(
  ruleId: string,
  updates: Partial<PricingRule>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pricing_rules')
      .update({
        rule_name: updates.ruleName,
        price_adjustment_value: updates.priceAdjustmentValue,
        min_price: updates.minPrice,
        max_price: updates.maxPrice,
        is_active: updates.isActive,
        priority: updates.priority,
        updated_at: new Date(),
      })
      .eq('id', ruleId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating pricing rule:', err);
    return false;
  }
}

// ============================================
// DYNAMIC PRICE CALCULATION
// ============================================

export async function calculateDynamicPrice(
  userId: string,
  productId: string,
  basePrice: number
): Promise<number> {
  try {
    // Get all active strategies
    const strategies = await getPricingStrategies(userId);
    let finalPrice = basePrice;

    for (const strategy of strategies.sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
      // Get rules for this strategy
      const rules = await getPricingRules(strategy.id);

      // Apply rules
      for (const rule of rules) {
        finalPrice = applyPricingRule(finalPrice, rule);
      }
    }

    // Ensure price is within bounds
    finalPrice = Math.max(finalPrice, basePrice * 0.5); // Min 50% of base
    finalPrice = Math.min(finalPrice, basePrice * 2.0); // Max 200% of base

    return Math.round(finalPrice * 100) / 100;
  } catch (err) {
    console.error('Error calculating dynamic price:', err);
    return basePrice;
  }
}

function applyPricingRule(price: number, rule: PricingRule): number {
  if (!rule.priceAdjustmentValue || !rule.priceAdjustmentType) return price;

  let adjustedPrice = price;

  switch (rule.priceAdjustmentType) {
    case 'percentage':
      adjustedPrice = price * (1 + rule.priceAdjustmentValue / 100);
      break;
    case 'fixed_amount':
      adjustedPrice = price + rule.priceAdjustmentValue;
      break;
    case 'absolute':
      adjustedPrice = rule.priceAdjustmentValue;
      break;
  }

  // Apply min/max bounds
  if (rule.minPrice) adjustedPrice = Math.max(adjustedPrice, rule.minPrice);
  if (rule.maxPrice) adjustedPrice = Math.min(adjustedPrice, rule.maxPrice);

  return adjustedPrice;
}

export async function updateProductPrice(
  userId: string,
  productId: string,
  newPrice: number,
  changeReason: string,
  strategyId?: string,
  ruleId?: string
): Promise<boolean> {
  try {
    // Get current price
    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', productId)
      .single();

    if (!product) return false;

    const oldPrice = product.price;
    const priceChangePercentage = ((newPrice - oldPrice) / oldPrice) * 100;

    // Record price change
    const { error } = await supabase
      .from('product_pricing_history')
      .insert({
        user_id: userId,
        product_id: productId,
        old_price: oldPrice,
        new_price: newPrice,
        price_change_percentage: priceChangePercentage,
        change_reason: changeReason,
        strategy_id: strategyId,
        rule_id: ruleId,
        changed_at: new Date(),
        created_at: new Date(),
      });

    if (error) throw error;

    // Update product price
    const { error: updateError } = await supabase
      .from('products')
      .update({ price: newPrice, updated_at: new Date() })
      .eq('id', productId);

    if (updateError) throw updateError;
    return true;
  } catch (err) {
    console.error('Error updating product price:', err);
    return false;
  }
}

// ============================================
// COMPETITOR PRICING
// ============================================

export async function recordCompetitorPrice(
  userId: string,
  productId: string,
  competitorName: string,
  competitorPrice: number,
  ourPrice: number,
  competitorSku?: string
): Promise<CompetitorPrice | null> {
  try {
    const priceDifference = ourPrice - competitorPrice;

    const { data, error } = await supabase
      .from('competitor_prices')
      .upsert({
        user_id: userId,
        product_id: productId,
        competitor_name: competitorName,
        competitor_sku: competitorSku,
        competitor_price: competitorPrice,
        our_price: ourPrice,
        price_difference: priceDifference,
        last_checked_at: new Date(),
        is_available: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as CompetitorPrice;
  } catch (err) {
    console.error('Error recording competitor price:', err);
    return null;
  }
}

export async function getCompetitorPrices(productId: string): Promise<CompetitorPrice[]> {
  try {
    const { data, error } = await supabase
      .from('competitor_prices')
      .select('*')
      .eq('product_id', productId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CompetitorPrice[];
  } catch (err) {
    console.error('Error fetching competitor prices:', err);
    return [];
  }
}

// ============================================
// DEMAND INDICATORS
// ============================================

export async function recordDemandIndicator(
  userId: string,
  productId: string,
  indicator: Partial<DemandIndicator>
): Promise<DemandIndicator | null> {
  try {
    // Determine demand level
    const demandLevel = calculateDemandLevel(indicator);

    const { data, error } = await supabase
      .from('demand_indicators')
      .insert({
        user_id: userId,
        product_id: productId,
        date: indicator.date || new Date(),
        demand_level: demandLevel,
        stock_level: indicator.stockLevel,
        conversion_rate: indicator.conversionRate,
        views_count: indicator.viewsCount,
        add_to_cart_count: indicator.addToCartCount,
        purchase_count: indicator.purchaseCount,
        average_rating: indicator.averageRating,
        review_count: indicator.reviewCount,
        days_in_stock: indicator.daysInStock,
        seasonality_index: indicator.seasonalityIndex,
        trend_score: indicator.trendScore,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as DemandIndicator;
  } catch (err) {
    console.error('Error recording demand indicator:', err);
    return null;
  }
}

function calculateDemandLevel(
  indicator: Partial<DemandIndicator>
): string {
  const conversionRate = indicator.conversionRate || 0;
  const purchaseCount = indicator.purchaseCount || 0;
  const viewsCount = indicator.viewsCount || 1;

  const demandScore = (purchaseCount / viewsCount) * 100 + conversionRate;

  if (demandScore > 15) return 'very_high';
  if (demandScore > 10) return 'high';
  if (demandScore > 5) return 'medium';
  if (demandScore > 2) return 'low';
  return 'very_low';
}

export async function getDemandIndicators(
  productId: string,
  days: number = 30
): Promise<DemandIndicator[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('demand_indicators')
      .select('*')
      .eq('product_id', productId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as DemandIndicator[];
  } catch (err) {
    console.error('Error fetching demand indicators:', err);
    return [];
  }
}

// ============================================
// PRICE ELASTICITY
// ============================================

export async function calculatePriceElasticity(
  userId: string,
  productId: string,
  historicalData: { price: number; quantity: number }[]
): Promise<PriceElasticity | null> {
  try {
    // Simple elasticity calculation
    let elasticity = -1.0; // Default inelastic

    if (historicalData.length >= 2) {
      const p1 = historicalData[0].price;
      const p2 = historicalData[historicalData.length - 1].price;
      const q1 = historicalData[0].quantity;
      const q2 = historicalData[historicalData.length - 1].quantity;

      const priceChange = (p2 - p1) / p1;
      const quantityChange = (q2 - q1) / q1;

      elasticity = quantityChange / priceChange;
    }

    // Calculate optimal price (profit-maximizing)
    const avgPrice = historicalData.reduce((sum, d) => sum + d.price, 0) / historicalData.length;
    const optimalPrice = avgPrice * (1 + 0.1 * elasticity);

    const { data, error } = await supabase
      .from('price_elasticity')
      .upsert({
        user_id: userId,
        product_id: productId,
        elasticity_coefficient: elasticity,
        price_range_min: Math.min(...historicalData.map((d) => d.price)),
        price_range_max: Math.max(...historicalData.map((d) => d.price)),
        optimal_price: optimalPrice,
        confidence_score: Math.min(100, historicalData.length * 10),
        calculated_at: new Date(),
        is_current: true,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PriceElasticity;
  } catch (err) {
    console.error('Error calculating price elasticity:', err);
    return null;
  }
}

export async function getPriceElasticity(productId: string): Promise<PriceElasticity | null> {
  try {
    const { data, error } = await supabase
      .from('price_elasticity')
      .select('*')
      .eq('product_id', productId)
      .eq('is_current', true)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as PriceElasticity;
  } catch (err) {
    console.error('Error fetching price elasticity:', err);
    return null;
  }
}

// ============================================
// PRICE TESTING
// ============================================

export async function createPriceTest(
  userId: string,
  test: Partial<PriceTest>
): Promise<PriceTest | null> {
  try {
    const { data, error } = await supabase
      .from('price_tests')
      .insert({
        user_id: userId,
        product_id: test.productId,
        test_name: test.testName,
        test_type: test.testType,
        control_price: test.controlPrice,
        test_price: test.testPrice,
        test_percentage: test.testPercentage || 10,
        start_date: test.startDate,
        end_date: test.endDate,
        status: 'planning',
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PriceTest;
  } catch (err) {
    console.error('Error creating price test:', err);
    return null;
  }
}

export async function getPriceTests(userId: string, status?: string): Promise<PriceTest[]> {
  try {
    let query = supabase
      .from('price_tests')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('start_date', { ascending: false });

    if (error) throw error;
    return (data || []) as PriceTest[];
  } catch (err) {
    console.error('Error fetching price tests:', err);
    return [];
  }
}

export async function updatePriceTest(
  testId: string,
  updates: Partial<PriceTest>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('price_tests')
      .update({
        status: updates.status,
        revenue_control: updates.revenueControl,
        revenue_test: updates.revenueTest,
        conversion_control: updates.conversionControl,
        conversion_test: updates.conversionTest,
        winner_price: updates.winnerPrice,
      })
      .eq('id', testId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating price test:', err);
    return false;
  }
}

// ============================================
// ANALYTICS
// ============================================

export async function recordPricingAnalytics(
  userId: string,
  analytics: Partial<DynamicPricingAnalytics>
): Promise<DynamicPricingAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('dynamic_pricing_analytics')
      .insert({
        user_id: userId,
        date: analytics.date || new Date(),
        strategy_id: analytics.strategyId,
        total_products_affected: analytics.totalProductsAffected || 0,
        total_price_changes: analytics.totalPriceChanges || 0,
        average_price_change: analytics.averagePriceChange,
        revenue_impact: analytics.revenueImpact,
        margin_impact: analytics.marginImpact,
        demand_response: analytics.demandResponse,
        conversion_rate_change: analytics.conversionRateChange,
        customer_satisfaction_impact: analytics.customerSatisfactionImpact,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as DynamicPricingAnalytics;
  } catch (err) {
    console.error('Error recording pricing analytics:', err);
    return null;
  }
}

export async function getPricingAnalytics(
  userId: string,
  days: number = 30
): Promise<DynamicPricingAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('dynamic_pricing_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as DynamicPricingAnalytics[];
  } catch (err) {
    console.error('Error fetching pricing analytics:', err);
    return [];
  }
}

export async function getPricingHistory(
  productId: string,
  days: number = 30
): Promise<ProductPricingHistory[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('product_pricing_history')
      .select('*')
      .eq('product_id', productId)
      .gte('changed_at', startDate.toISOString())
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProductPricingHistory[];
  } catch (err) {
    console.error('Error fetching pricing history:', err);
    return [];
  }
}
