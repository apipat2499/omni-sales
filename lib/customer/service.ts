import { supabase } from '@/lib/supabase/client';
import {
  CustomerProfile,
  CustomerAnalytics,
  CustomerRFMScore,
  LoyaltyProgram,
} from '@/types';

/**
 * Customer Management Service
 * Handles customer profiles, RFM analysis, segmentation, and analytics
 */

/**
 * Get or create customer profile
 */
export async function getOrCreateCustomerProfile(
  userId: string,
  customerId: string,
  customerData?: any
): Promise<CustomerProfile | null> {
  try {
    // Try to get existing profile
    const { data: existing } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .single();

    if (existing) {
      return existing;
    }

    // Create new profile
    const { data: newProfile, error } = await supabase
      .from('customer_profiles')
      .insert({
        user_id: userId,
        customer_id: customerId,
        email: customerData?.email || '',
        status: 'active',
        lifetime_value: 0,
        total_orders: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer profile:', error);
      return null;
    }

    return newProfile;
  } catch (error) {
    console.error('Error in getOrCreateCustomerProfile:', error);
    return null;
  }
}

/**
 * Calculate RFM Score for a customer
 * R = Recency (days since last purchase), F = Frequency (number of purchases), M = Monetary (total spent)
 */
export async function calculateRFMScore(
  userId: string,
  customerId: string,
  days: number = 365
): Promise<CustomerRFMScore | null> {
  try {
    // Get customer orders
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total')
      .eq('customer_id', customerId)
      .gte(
        'created_at',
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      );

    if (!orders || orders.length === 0) {
      return null;
    }

    // Calculate metrics
    const now = new Date();
    const lastOrderDate = new Date(orders[0].created_at);
    const recencyDays = Math.floor(
      (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const frequency = orders.length;
    const monetary = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Score each metric 1-5
    const recencyScore = scoreRecency(recencyDays);
    const frequencyScore = scoreFrequency(frequency);
    const monetaryScore = scoreMonetary(monetary);

    // Calculate overall score
    const overallScore =
      (recencyScore + frequencyScore + monetaryScore) / 3;
    const rfmSegment = segmentRFM(
      recencyScore,
      frequencyScore,
      monetaryScore
    );

    // Save RFM score
    const { data: rfmScore, error } = await supabase
      .from('customer_rfm_scores')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        recency_score: recencyScore,
        frequency_score: frequencyScore,
        monetary_score: monetaryScore,
        overall_rfm_score: overallScore,
        rfm_segment: rfmSegment,
        last_calculated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving RFM score:', error);
      return null;
    }

    return rfmScore;
  } catch (error) {
    console.error('Error calculating RFM score:', error);
    return null;
  }
}

/**
 * Score recency (1-5 scale, lower days = higher score)
 */
function scoreRecency(days: number): number {
  if (days <= 30) return 5;
  if (days <= 60) return 4;
  if (days <= 90) return 3;
  if (days <= 180) return 2;
  return 1;
}

/**
 * Score frequency (1-5 scale)
 */
function scoreFrequency(count: number): number {
  if (count >= 10) return 5;
  if (count >= 7) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  return 1;
}

/**
 * Score monetary (1-5 scale)
 */
function scoreMonetary(amount: number): number {
  if (amount >= 5000) return 5;
  if (amount >= 2500) return 4;
  if (amount >= 1000) return 3;
  if (amount >= 500) return 2;
  return 1;
}

/**
 * Segment customer based on RFM scores
 */
function segmentRFM(
  recency: number,
  frequency: number,
  monetary: number
): string {
  const avg = (recency + frequency + monetary) / 3;

  if (recency >= 4 && frequency >= 4 && monetary >= 4) {
    return 'Champions';
  }
  if (recency >= 4 && frequency >= 3 && monetary >= 3) {
    return 'Loyal Customers';
  }
  if (recency >= 3 && frequency >= 3) {
    return 'Potential Loyalist';
  }
  if (frequency >= 4 && recency <= 2) {
    return 'At Risk';
  }
  if (recency <= 2 && frequency <= 2) {
    return 'Lost';
  }
  if (avg >= 4) {
    return 'VIP';
  }
  if (recency >= 4 && frequency <= 2) {
    return 'New Customers';
  }

  return 'Regular';
}

/**
 * Calculate customer churn risk (0-1 scale)
 */
export async function calculateChurnRisk(
  customerId: string,
  days: number = 365
): Promise<number> {
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at')
      .eq('customer_id', customerId)
      .gte(
        'created_at',
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      )
      .order('created_at', { ascending: false });

    if (!orders || orders.length === 0) {
      return 1; // High churn risk if no orders
    }

    const now = new Date();
    const lastOrderDate = new Date(orders[0].created_at);
    const daysSinceLastOrder = Math.floor(
      (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Factors for churn calculation
    const frequencyFactor = Math.min(orders.length / 10, 1); // Frequency reduces churn risk
    const recencyFactor = Math.min(daysSinceLastOrder / 180, 1); // Recency increases churn risk

    // Calculate churn risk: high if infrequent and long time since purchase
    const churnRisk = (recencyFactor * 0.7 - frequencyFactor * 0.3) * 0.5 + 0.25;

    return Math.max(0, Math.min(churnRisk, 1)); // Keep between 0 and 1
  } catch (error) {
    console.error('Error calculating churn risk:', error);
    return 0.5; // Default medium risk
  }
}

/**
 * Update customer analytics
 */
export async function updateCustomerAnalytics(
  userId: string,
  customerId: string
): Promise<CustomerAnalytics | null> {
  try {
    // Get all customer orders
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total, order_items(category)')
      .eq('customer_id', customerId);

    if (!orders) {
      return null;
    }

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Calculate repeat purchase rate
    const repeatOrders = totalOrders > 1 ? 1 : 0;
    const repeatPurchaseRate = repeatOrders;

    // Get purchase frequency (days between orders)
    let purchaseFrequencyDays = 0;
    if (orders.length > 1) {
      const firstOrder = new Date(orders[orders.length - 1].created_at);
      const lastOrder = new Date(orders[0].created_at);
      const daysDiff = Math.floor(
        (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24)
      );
      purchaseFrequencyDays = Math.floor(daysDiff / (totalOrders - 1));
    }

    // Calculate churn risk
    const churnRisk = await calculateChurnRisk(customerId);

    // Estimate lifetime value (simple model)
    const lifetimeValuePredicted =
      averageOrderValue * Math.max(12 - churnRisk * 12, 1);

    // Calculate engagement score based on interactions
    const { data: interactions } = await supabase
      .from('customer_interactions')
      .select('*')
      .eq('customer_id', customerId)
      .gte(
        'created_at',
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      );

    const engagementScore = interactions ? Math.min((interactions.length / 50) * 100, 100) : 0;

    // Save analytics
    const { data: analytics, error } = await supabase
      .from('customer_analytics')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        total_orders: totalOrders,
        total_spent: totalSpent,
        average_order_value: averageOrderValue,
        repeat_purchase_rate: repeatPurchaseRate,
        purchase_frequency_days: purchaseFrequencyDays,
        churn_risk_score: churnRisk,
        lifetime_value_predicted: lifetimeValuePredicted,
        engagement_score: engagementScore,
        last_calculated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating customer analytics:', error);
      return null;
    }

    return analytics;
  } catch (error) {
    console.error('Error in updateCustomerAnalytics:', error);
    return null;
  }
}

/**
 * Add customer to segment
 */
export async function addCustomerToSegment(
  customerId: string,
  segmentId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_segment_members')
      .insert({
        segment_id: segmentId,
        customer_id: customerId,
        user_id: userId,
      });

    if (error) {
      console.error('Error adding customer to segment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addCustomerToSegment:', error);
    return false;
  }
}

/**
 * Get loyalty points balance
 */
export async function getCustomerLoyaltyPoints(
  customerId: string,
  loyaltyProgramId?: string
): Promise<number> {
  try {
    let query = supabase
      .from('customer_loyalty_points')
      .select('available_points')
      .eq('customer_id', customerId);

    if (loyaltyProgramId) {
      query = query.eq('loyalty_program_id', loyaltyProgramId);
    }

    const { data: points } = await query.single();

    return points?.available_points || 0;
  } catch (error) {
    console.error('Error getting loyalty points:', error);
    return 0;
  }
}

/**
 * Add loyalty points to customer
 */
export async function addLoyaltyPoints(
  customerId: string,
  points: number,
  loyaltyProgramId: string,
  userId: string
): Promise<boolean> {
  try {
    // Get current points
    const { data: current } = await supabase
      .from('customer_loyalty_points')
      .select('available_points, total_points')
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId)
      .single();

    const newAvailable = (current?.available_points || 0) + points;
    const newTotal = (current?.total_points || 0) + points;

    const { error } = await supabase
      .from('customer_loyalty_points')
      .upsert({
        customer_id: customerId,
        loyalty_program_id: loyaltyProgramId,
        user_id: userId,
        available_points: newAvailable,
        total_points: newTotal,
        last_activity_date: new Date(),
      });

    if (error) {
      console.error('Error adding loyalty points:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addLoyaltyPoints:', error);
    return false;
  }
}

/**
 * Redeem loyalty points
 */
export async function redeemLoyaltyPoints(
  customerId: string,
  loyaltyProgramId: string,
  points: number
): Promise<boolean> {
  try {
    // Get current points
    const { data: current } = await supabase
      .from('customer_loyalty_points')
      .select('available_points, redeemed_points')
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId)
      .single();

    if (!current || current.available_points < points) {
      return false; // Insufficient points
    }

    const { error } = await supabase
      .from('customer_loyalty_points')
      .update({
        available_points: current.available_points - points,
        redeemed_points: (current.redeemed_points || 0) + points,
        last_activity_date: new Date(),
      })
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId);

    if (error) {
      console.error('Error redeeming loyalty points:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in redeemLoyaltyPoints:', error);
    return false;
  }
}

/**
 * Log customer communication
 */
export async function logCommunication(
  userId: string,
  customerId: string,
  communication: {
    communicationType: string;
    subject?: string;
    message: string;
    direction: string;
    channel: string;
    status?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase.from('customer_communications').insert({
      user_id: userId,
      customer_id: customerId,
      communication_type: communication.communicationType,
      subject: communication.subject,
      message: communication.message,
      direction: communication.direction,
      channel: communication.channel,
      status: communication.status || 'sent',
      sent_at: new Date(),
    });

    if (error) {
      console.error('Error logging communication:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logCommunication:', error);
    return false;
  }
}

/**
 * Add note to customer
 */
export async function addCustomerNote(
  userId: string,
  customerId: string,
  note: {
    title?: string;
    content: string;
    noteType?: string;
    priority?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase.from('customer_notes').insert({
      user_id: userId,
      customer_id: customerId,
      title: note.title,
      content: note.content,
      note_type: note.noteType,
      priority: note.priority,
      is_pinned: false,
    });

    if (error) {
      console.error('Error adding customer note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addCustomerNote:', error);
    return false;
  }
}

/**
 * Get customer communication history
 */
export async function getCustomerCommunications(
  customerId: string,
  limit: number = 50
) {
  try {
    const { data: communications, error } = await supabase
      .from('customer_communications')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching communications:', error);
      return [];
    }

    return communications || [];
  } catch (error) {
    console.error('Error in getCustomerCommunications:', error);
    return [];
  }
}
