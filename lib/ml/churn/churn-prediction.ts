import { supabase } from '@/lib/supabase/client';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface RFMScore {
  customerId: string;
  recency: number; // Days since last purchase
  frequency: number; // Number of purchases
  monetary: number; // Total amount spent
  recencyScore: number; // 1-5 score
  frequencyScore: number; // 1-5 score
  monetaryScore: number; // 1-5 score
  rfmScore: string; // Combined score (e.g., "555")
  segment: CustomerSegment;
}

export type CustomerSegment =
  | 'Champions'
  | 'Loyal Customers'
  | 'Potential Loyalists'
  | 'Recent Customers'
  | 'Promising'
  | 'Need Attention'
  | 'About to Sleep'
  | 'At Risk'
  | 'Cannot Lose Them'
  | 'Hibernating'
  | 'Lost';

export interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  rfmScore: RFMScore;
  factors: ChurnFactor[];
  recommendedActions: string[];
  daysUntilChurn?: number;
}

export interface ChurnFactor {
  factor: string;
  impact: number; // -1 to 1 (negative = increases churn risk)
  description: string;
}

export interface CustomerBehavior {
  customerId: string;
  avgOrderValue: number;
  avgDaysBetweenOrders: number;
  orderTrend: 'increasing' | 'stable' | 'decreasing';
  lastOrderDate: Date;
  totalOrders: number;
  totalSpent: number;
  productDiversity: number; // Number of unique products purchased
  returnRate: number; // Percentage of orders returned
  complaintsCount: number;
  engagementScore: number; // Based on email opens, clicks, etc.
}

// ============================================
// RFM ANALYSIS
// ============================================

/**
 * Calculate RFM metrics for a customer
 */
export async function calculateCustomerRFM(customerId: string): Promise<RFMScore | null> {
  try {
    const today = new Date();

    // Fetch customer orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, created_at, total, status')
      .eq('customer_id', customerId)
      .in('status', ['completed', 'delivered', 'paid'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return null;
    }

    // Calculate Recency (days since last purchase)
    const lastOrderDate = new Date(orders[0].created_at);
    const recency = Math.floor((today.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate Frequency (number of purchases)
    const frequency = orders.length;

    // Calculate Monetary (total amount spent)
    const monetary = orders.reduce((sum, order) => sum + order.total, 0);

    // Calculate scores (1-5 scale)
    const recencyScore = scoreRecency(recency);
    const frequencyScore = scoreFrequency(frequency);
    const monetaryScore = scoreMonetary(monetary);

    const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;
    const segment = determineSegment(recencyScore, frequencyScore, monetaryScore);

    return {
      customerId,
      recency,
      frequency,
      monetary,
      recencyScore,
      frequencyScore,
      monetaryScore,
      rfmScore,
      segment,
    };
  } catch (error) {
    console.error('Error calculating RFM for customer:', error);
    return null;
  }
}

/**
 * Calculate RFM for all customers
 */
export async function calculateAllCustomersRFM(): Promise<RFMScore[]> {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id');

    if (error) throw error;

    const rfmScores: RFMScore[] = [];

    for (const customer of customers || []) {
      const rfm = await calculateCustomerRFM(customer.id);
      if (rfm) {
        rfmScores.push(rfm);
      }
    }

    return rfmScores;
  } catch (error) {
    console.error('Error calculating RFM for all customers:', error);
    return [];
  }
}

/**
 * Score recency (1-5, where 5 is most recent)
 */
function scoreRecency(recency: number): number {
  if (recency <= 7) return 5;
  if (recency <= 30) return 4;
  if (recency <= 90) return 3;
  if (recency <= 180) return 2;
  return 1;
}

/**
 * Score frequency (1-5, where 5 is most frequent)
 */
function scoreFrequency(frequency: number): number {
  if (frequency >= 20) return 5;
  if (frequency >= 10) return 4;
  if (frequency >= 5) return 3;
  if (frequency >= 2) return 2;
  return 1;
}

/**
 * Score monetary value (1-5, where 5 is highest value)
 */
function scoreMonetary(monetary: number): number {
  if (monetary >= 10000) return 5;
  if (monetary >= 5000) return 4;
  if (monetary >= 1000) return 3;
  if (monetary >= 100) return 2;
  return 1;
}

/**
 * Determine customer segment based on RFM scores
 */
function determineSegment(r: number, f: number, m: number): CustomerSegment {
  // Champions: Bought recently, buy often, spend the most
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';

  // Loyal Customers: Buy on a regular basis, responsive to promotions
  if (r >= 3 && f >= 4 && m >= 3) return 'Loyal Customers';

  // Potential Loyalists: Recent customers, spent a good amount, bought more than once
  if (r >= 4 && f >= 2 && m >= 2) return 'Potential Loyalists';

  // Recent Customers: Bought recently, but not often
  if (r >= 4 && f <= 2 && m <= 3) return 'Recent Customers';

  // Promising: Recent shoppers, but haven't spent much
  if (r >= 3 && f <= 2 && m <= 2) return 'Promising';

  // Need Attention: Above average recency, frequency, and monetary values
  if (r >= 3 && f >= 3 && m >= 3) return 'Need Attention';

  // About to Sleep: Below average recency, frequency, and monetary values
  if (r >= 2 && r <= 3 && f <= 3 && m <= 3) return 'About to Sleep';

  // At Risk: Spent big money and purchased often, but long time ago
  if (r <= 2 && f >= 3 && m >= 3) return 'At Risk';

  // Cannot Lose Them: Made biggest purchases, but haven't returned for a long time
  if (r <= 2 && f >= 4 && m >= 4) return 'Cannot Lose Them';

  // Hibernating: Last purchase was long ago, low spenders and low number of orders
  if (r <= 2 && f <= 2 && m <= 2) return 'Hibernating';

  // Lost: Lowest recency, frequency, and monetary scores
  if (r === 1) return 'Lost';

  return 'Need Attention';
}

// ============================================
// CUSTOMER BEHAVIOR ANALYSIS
// ============================================

/**
 * Analyze customer behavior patterns
 */
export async function analyzeCustomerBehavior(customerId: string): Promise<CustomerBehavior | null> {
  try {
    // Fetch customer orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, total, status')
      .eq('customer_id', customerId)
      .in('status', ['completed', 'delivered', 'paid'])
      .order('created_at', { ascending: true });

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return null;
    }

    // Calculate average order value
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalSpent / orders.length;

    // Calculate average days between orders
    let totalDaysBetween = 0;
    for (let i = 1; i < orders.length; i++) {
      const daysDiff =
        (new Date(orders[i].created_at).getTime() - new Date(orders[i - 1].created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      totalDaysBetween += daysDiff;
    }
    const avgDaysBetweenOrders = orders.length > 1 ? totalDaysBetween / (orders.length - 1) : 0;

    // Determine order trend
    let orderTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (orders.length >= 4) {
      const firstHalfAvg =
        orders
          .slice(0, Math.floor(orders.length / 2))
          .reduce((sum, o) => sum + o.total, 0) / Math.floor(orders.length / 2);
      const secondHalfAvg =
        orders
          .slice(Math.floor(orders.length / 2))
          .reduce((sum, o) => sum + o.total, 0) /
        (orders.length - Math.floor(orders.length / 2));

      const diff = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      if (diff > 10) orderTrend = 'increasing';
      else if (diff < -10) orderTrend = 'decreasing';
    }

    // Fetch unique products purchased
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id')
      .in(
        'order_id',
        orders.map(o => o.id)
      );

    if (itemsError) throw itemsError;

    const uniqueProducts = new Set(orderItems?.map(item => item.product_id) || []);
    const productDiversity = uniqueProducts.size;

    // Fetch returns
    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .select('id')
      .in(
        'order_id',
        orders.map(o => o.id)
      );

    const returnRate = returns && orders.length > 0 ? (returns.length / orders.length) * 100 : 0;

    // Fetch complaints
    const { data: complaints, error: complaintsError } = await supabase
      .from('complaints')
      .select('id')
      .eq('customer_id', customerId);

    const complaintsCount = complaints?.length || 0;

    // Calculate engagement score (simplified)
    // In a real system, this would include email opens, clicks, website visits, etc.
    const daysSinceLastOrder =
      (new Date().getTime() - new Date(orders[orders.length - 1].created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    const engagementScore = Math.max(0, 100 - daysSinceLastOrder);

    return {
      customerId,
      avgOrderValue,
      avgDaysBetweenOrders,
      orderTrend,
      lastOrderDate: new Date(orders[orders.length - 1].created_at),
      totalOrders: orders.length,
      totalSpent,
      productDiversity,
      returnRate,
      complaintsCount,
      engagementScore,
    };
  } catch (error) {
    console.error('Error analyzing customer behavior:', error);
    return null;
  }
}

// ============================================
// CHURN PREDICTION
// ============================================

/**
 * Calculate churn probability for a customer
 */
export function calculateChurnProbability(
  rfm: RFMScore,
  behavior: CustomerBehavior
): number {
  let churnScore = 0;

  // RFM factors (0-0.4)
  churnScore += (5 - rfm.recencyScore) * 0.1; // 0-0.4
  churnScore += (5 - rfm.frequencyScore) * 0.05; // 0-0.2
  churnScore += (5 - rfm.monetaryScore) * 0.05; // 0-0.2

  // Behavioral factors (0-0.6)
  const daysSinceLastOrder =
    (new Date().getTime() - behavior.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastOrder > 180) churnScore += 0.2;
  else if (daysSinceLastOrder > 90) churnScore += 0.1;
  else if (daysSinceLastOrder > 60) churnScore += 0.05;

  if (behavior.orderTrend === 'decreasing') churnScore += 0.15;
  else if (behavior.orderTrend === 'stable') churnScore += 0.05;

  if (behavior.returnRate > 20) churnScore += 0.1;
  else if (behavior.returnRate > 10) churnScore += 0.05;

  if (behavior.complaintsCount > 3) churnScore += 0.1;
  else if (behavior.complaintsCount > 0) churnScore += 0.05;

  if (behavior.engagementScore < 30) churnScore += 0.1;
  else if (behavior.engagementScore < 60) churnScore += 0.05;

  // Normalize to 0-1
  return Math.min(1, Math.max(0, churnScore));
}

/**
 * Identify churn factors
 */
export function identifyChurnFactors(
  rfm: RFMScore,
  behavior: CustomerBehavior
): ChurnFactor[] {
  const factors: ChurnFactor[] = [];

  // Recency factor
  if (rfm.recencyScore <= 2) {
    factors.push({
      factor: 'Low Recency',
      impact: -0.3,
      description: `Last purchase was ${rfm.recency} days ago`,
    });
  }

  // Frequency factor
  if (rfm.frequencyScore <= 2) {
    factors.push({
      factor: 'Low Purchase Frequency',
      impact: -0.2,
      description: `Only ${rfm.frequency} total purchases`,
    });
  }

  // Monetary factor
  if (rfm.monetaryScore <= 2) {
    factors.push({
      factor: 'Low Monetary Value',
      impact: -0.15,
      description: `Total spent: $${rfm.monetary.toFixed(2)}`,
    });
  }

  // Order trend
  if (behavior.orderTrend === 'decreasing') {
    factors.push({
      factor: 'Decreasing Order Value',
      impact: -0.25,
      description: 'Recent orders are smaller than previous ones',
    });
  }

  // Return rate
  if (behavior.returnRate > 10) {
    factors.push({
      factor: 'High Return Rate',
      impact: -0.2,
      description: `${behavior.returnRate.toFixed(1)}% of orders returned`,
    });
  }

  // Complaints
  if (behavior.complaintsCount > 0) {
    factors.push({
      factor: 'Customer Complaints',
      impact: -0.15 * Math.min(behavior.complaintsCount, 3),
      description: `${behavior.complaintsCount} complaint(s) filed`,
    });
  }

  // Engagement
  if (behavior.engagementScore < 50) {
    factors.push({
      factor: 'Low Engagement',
      impact: -0.15,
      description: 'Low interaction with marketing communications',
    });
  }

  // Product diversity
  if (behavior.productDiversity < 3) {
    factors.push({
      factor: 'Limited Product Interest',
      impact: -0.1,
      description: `Only purchased ${behavior.productDiversity} different products`,
    });
  }

  return factors.sort((a, b) => a.impact - b.impact);
}

/**
 * Recommend retention actions based on churn risk
 */
export function recommendRetentionActions(
  churnProbability: number,
  rfm: RFMScore,
  factors: ChurnFactor[]
): string[] {
  const actions: string[] = [];

  // High-value customers
  if (rfm.monetaryScore >= 4) {
    actions.push('Assign dedicated account manager');
    actions.push('Offer VIP loyalty program enrollment');
  }

  // Based on segment
  switch (rfm.segment) {
    case 'At Risk':
    case 'Cannot Lose Them':
      actions.push('Send personalized win-back campaign with special discount');
      actions.push('Call customer to understand concerns');
      actions.push('Offer exclusive early access to new products');
      break;

    case 'About to Sleep':
      actions.push('Send re-engagement email with product recommendations');
      actions.push('Offer limited-time discount (15-20%)');
      actions.push('Request feedback on recent experience');
      break;

    case 'Hibernating':
      actions.push('Send win-back campaign with strong incentive');
      actions.push('Highlight new products or features');
      break;

    case 'Need Attention':
      actions.push('Send personalized product recommendations');
      actions.push('Offer loyalty points or rewards');
      break;

    case 'Promising':
    case 'Potential Loyalists':
      actions.push('Encourage repeat purchase with small discount');
      actions.push('Send onboarding content and best practices');
      actions.push('Invite to join loyalty program');
      break;
  }

  // Based on specific factors
  factors.forEach(factor => {
    if (factor.factor === 'High Return Rate') {
      actions.push('Follow up on product quality concerns');
      actions.push('Offer personalized product consultation');
    }

    if (factor.factor === 'Customer Complaints') {
      actions.push('Address complaints with priority customer service');
      actions.push('Offer compensation or goodwill gesture');
    }

    if (factor.factor === 'Low Engagement') {
      actions.push('Update email preferences to match interests');
      actions.push('Send engaging content (tips, guides, success stories)');
    }
  });

  // Remove duplicates
  return Array.from(new Set(actions));
}

/**
 * Predict churn for a customer
 */
export async function predictCustomerChurn(customerId: string): Promise<ChurnPrediction | null> {
  try {
    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Calculate RFM
    const rfm = await calculateCustomerRFM(customerId);
    if (!rfm) return null;

    // Analyze behavior
    const behavior = await analyzeCustomerBehavior(customerId);
    if (!behavior) return null;

    // Calculate churn probability
    const churnProbability = calculateChurnProbability(rfm, behavior);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (churnProbability >= 0.75) riskLevel = 'critical';
    else if (churnProbability >= 0.5) riskLevel = 'high';
    else if (churnProbability >= 0.25) riskLevel = 'medium';

    // Identify factors
    const factors = identifyChurnFactors(rfm, behavior);

    // Recommend actions
    const recommendedActions = recommendRetentionActions(churnProbability, rfm, factors);

    // Estimate days until churn (based on average days between orders and recency)
    let daysUntilChurn: number | undefined;
    if (behavior.avgDaysBetweenOrders > 0) {
      const daysSinceLastOrder =
        (new Date().getTime() - behavior.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      daysUntilChurn = Math.max(
        0,
        Math.round(behavior.avgDaysBetweenOrders * 1.5 - daysSinceLastOrder)
      );
    }

    return {
      customerId,
      customerName: customer.name,
      churnProbability,
      riskLevel,
      rfmScore: rfm,
      factors,
      recommendedActions,
      daysUntilChurn,
    };
  } catch (error) {
    console.error('Error predicting customer churn:', error);
    return null;
  }
}

/**
 * Get all at-risk customers
 */
export async function getAtRiskCustomers(
  minRiskLevel: 'medium' | 'high' | 'critical' = 'medium'
): Promise<ChurnPrediction[]> {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1000); // Process top 1000 customers

    if (error) throw error;

    const atRiskCustomers: ChurnPrediction[] = [];
    const minProbability =
      minRiskLevel === 'critical' ? 0.75 : minRiskLevel === 'high' ? 0.5 : 0.25;

    for (const customer of customers || []) {
      const prediction = await predictCustomerChurn(customer.id);

      if (prediction && prediction.churnProbability >= minProbability) {
        atRiskCustomers.push(prediction);
      }
    }

    // Sort by churn probability descending
    return atRiskCustomers.sort((a, b) => b.churnProbability - a.churnProbability);
  } catch (error) {
    console.error('Error getting at-risk customers:', error);
    return [];
  }
}

/**
 * Store churn prediction in database
 */
export async function storeChurnPrediction(prediction: ChurnPrediction): Promise<boolean> {
  try {
    const record = {
      customer_id: prediction.customerId,
      churn_probability: prediction.churnProbability,
      risk_level: prediction.riskLevel,
      rfm_score: prediction.rfmScore.rfmScore,
      segment: prediction.rfmScore.segment,
      factors: JSON.stringify(prediction.factors),
      recommended_actions: prediction.recommendedActions,
      days_until_churn: prediction.daysUntilChurn,
      predicted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    // Upsert (update if exists, insert if not)
    const { error } = await supabase
      .from('ml_churn_predictions')
      .upsert(record, { onConflict: 'customer_id' });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error storing churn prediction:', error);
    return false;
  }
}

// Export all functions
export default {
  calculateCustomerRFM,
  calculateAllCustomersRFM,
  analyzeCustomerBehavior,
  predictCustomerChurn,
  getAtRiskCustomers,
  storeChurnPrediction,
  calculateChurnProbability,
  identifyChurnFactors,
  recommendRetentionActions,
};
