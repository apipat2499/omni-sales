import { createClient } from '@supabase/supabase-js';
import {
  LoyaltyProgram,
  LoyaltyTier,
  LoyaltyPointRule,
  LoyaltyReward,
  CustomerRewardRedemption,
  LoyaltyPointTransaction,
  LoyaltyReferralReward,
  LoyaltyAnalytics,
} from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================
// LOYALTY PROGRAM MANAGEMENT
// ============================================

export async function createLoyaltyProgram(
  userId: string,
  program: {
    name: string;
    description?: string;
    programType: string;
    pointMultiplier: number;
    minPurchaseForPoints: number;
    pointExpiryDays?: number;
  }
): Promise<LoyaltyProgram | null> {
  try {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .insert([
        {
          user_id: userId,
          name: program.name,
          description: program.description,
          program_type: program.programType,
          point_multiplier: program.pointMultiplier,
          min_purchase_for_points: program.minPurchaseForPoints,
          point_expiry_days: program.pointExpiryDays,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating loyalty program:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createLoyaltyProgram:', error);
    return null;
  }
}

export async function getLoyaltyProgram(
  programId: string
): Promise<LoyaltyProgram | null> {
  try {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (error) {
      console.error('Error fetching loyalty program:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLoyaltyProgram:', error);
    return null;
  }
}

// ============================================
// LOYALTY TIERS MANAGEMENT
// ============================================

export async function createLoyaltyTier(
  userId: string,
  tier: {
    loyaltyProgramId: string;
    tierName: string;
    tierLevel: number;
    minPoints: number;
    maxPoints?: number;
    minAnnualSpending: number;
    pointsMultiplier: number;
    bonusPointsOnJoin?: number;
    exclusiveBenefits?: string[];
    isVip?: boolean;
  }
): Promise<LoyaltyTier | null> {
  try {
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .insert([
        {
          user_id: userId,
          loyalty_program_id: tier.loyaltyProgramId,
          tier_name: tier.tierName,
          tier_level: tier.tierLevel,
          min_points: tier.minPoints,
          max_points: tier.maxPoints,
          min_annual_spending: tier.minAnnualSpending,
          points_multiplier: tier.pointsMultiplier,
          bonus_points_on_join: tier.bonusPointsOnJoin || 0,
          exclusive_benefits: tier.exclusiveBenefits || [],
          is_vip: tier.isVip || false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating loyalty tier:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createLoyaltyTier:', error);
    return null;
  }
}

export async function getLoyaltyTiers(
  programId: string
): Promise<LoyaltyTier[]> {
  try {
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .eq('loyalty_program_id', programId)
      .order('tier_level', { ascending: true });

    if (error) {
      console.error('Error fetching loyalty tiers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getLoyaltyTiers:', error);
    return [];
  }
}

// ============================================
// POINT RULES MANAGEMENT
// ============================================

export async function createPointRule(
  userId: string,
  rule: {
    loyaltyProgramId: string;
    ruleName: string;
    ruleType: string;
    triggerEvent: string;
    pointsEarned: number;
    pointsCalculationType?: string;
    percentageValue?: number;
    minTransactionAmount?: number;
    maxPointsPerTransaction?: number;
  }
): Promise<LoyaltyPointRule | null> {
  try {
    const { data, error } = await supabase
      .from('loyalty_point_rules')
      .insert([
        {
          user_id: userId,
          loyalty_program_id: rule.loyaltyProgramId,
          rule_name: rule.ruleName,
          rule_type: rule.ruleType,
          trigger_event: rule.triggerEvent,
          points_earned: rule.pointsEarned,
          points_calculation_type: rule.pointsCalculationType,
          percentage_value: rule.percentageValue,
          min_transaction_amount: rule.minTransactionAmount,
          max_points_per_transaction: rule.maxPointsPerTransaction,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating point rule:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createPointRule:', error);
    return null;
  }
}

// ============================================
// REWARDS MANAGEMENT
// ============================================

export async function createReward(
  userId: string,
  reward: {
    loyaltyProgramId: string;
    rewardName: string;
    rewardType: string;
    rewardValue: number;
    rewardUnit: string;
    pointsRequired: number;
    totalAvailableQuantity?: number;
    description?: string;
  }
): Promise<LoyaltyReward | null> {
  try {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .insert([
        {
          user_id: userId,
          loyalty_program_id: reward.loyaltyProgramId,
          reward_name: reward.rewardName,
          reward_type: reward.rewardType,
          reward_value: reward.rewardValue,
          reward_unit: reward.rewardUnit,
          points_required: reward.pointsRequired,
          total_available_quantity: reward.totalAvailableQuantity,
          description: reward.description,
          is_active: true,
          claimed_quantity: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createReward:', error);
    return null;
  }
}

export async function getRewards(
  programId: string
): Promise<LoyaltyReward[]> {
  try {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('loyalty_program_id', programId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRewards:', error);
    return [];
  }
}

// ============================================
// POINT TRANSACTIONS & EARNING
// ============================================

export async function addPointsToCustomer(
  userId: string,
  customerId: string,
  loyaltyProgramId: string,
  points: number,
  transactionType: string,
  relatedOrderId?: string,
  relatedRuleId?: string
): Promise<LoyaltyPointTransaction | null> {
  try {
    // Get current points
    const { data: currentAccount } = await supabase
      .from('customer_loyalty_points')
      .select('total_points, available_points')
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId)
      .single();

    const pointsBefore = currentAccount?.total_points || 0;
    const pointsAfter = pointsBefore + points;

    // Record transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('loyalty_point_transactions')
      .insert([
        {
          user_id: userId,
          customer_id: customerId,
          loyalty_program_id: loyaltyProgramId,
          transaction_type: transactionType,
          points_amount: points,
          points_before: pointsBefore,
          points_after: pointsAfter,
          related_order_id: relatedOrderId,
          related_rule_id: relatedRuleId,
        },
      ])
      .select()
      .single();

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      return null;
    }

    // Update customer loyalty points
    const { error: updateError } = await supabase
      .from('customer_loyalty_points')
      .update({
        total_points: pointsAfter,
        available_points: (currentAccount?.available_points || 0) + points,
        last_activity_date: new Date().toISOString(),
      })
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId);

    if (updateError) {
      console.error('Error updating loyalty points:', updateError);
      return null;
    }

    return transaction;
  } catch (error) {
    console.error('Error in addPointsToCustomer:', error);
    return null;
  }
}

// ============================================
// REWARD REDEMPTION
// ============================================

export async function redeemReward(
  userId: string,
  customerId: string,
  rewardId: string,
  loyaltyProgramId?: string
): Promise<CustomerRewardRedemption | null> {
  try {
    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (rewardError || !reward) {
      console.error('Error fetching reward:', rewardError);
      return null;
    }

    // Check customer has enough points
    const { data: customerPoints } = await supabase
      .from('customer_loyalty_points')
      .select('available_points')
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId)
      .single();

    if (!customerPoints || customerPoints.available_points < reward.points_required) {
      console.error('Customer does not have enough points');
      return null;
    }

    // Generate redemption code
    const redemptionCode = `REDEEM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('customer_reward_redemptions')
      .insert([
        {
          user_id: userId,
          customer_id: customerId,
          loyalty_program_id: loyaltyProgramId,
          reward_id: rewardId,
          points_spent: reward.points_required,
          redemption_code: redemptionCode,
          redemption_status: 'pending',
        },
      ])
      .select()
      .single();

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError);
      return null;
    }

    // Deduct points from customer
    await supabase
      .from('customer_loyalty_points')
      .update({
        available_points: customerPoints.available_points - reward.points_required,
        redeemed_points: (customerPoints.available_points || 0) + reward.points_required,
      })
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId);

    // Increment claimed quantity
    await supabase
      .from('loyalty_rewards')
      .update({
        claimed_quantity: (reward.claimed_quantity || 0) + 1,
      })
      .eq('id', rewardId);

    return redemption;
  } catch (error) {
    console.error('Error in redeemReward:', error);
    return null;
  }
}

export async function approveRedemption(
  redemptionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_reward_redemptions')
      .update({
        redemption_status: 'approved',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', redemptionId);

    if (error) {
      console.error('Error approving redemption:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in approveRedemption:', error);
    return false;
  }
}

// ============================================
// TIER MANAGEMENT
// ============================================

export async function updateCustomerTier(
  userId: string,
  customerId: string,
  loyaltyProgramId: string,
  newTierId: string,
  promotionReason?: string
): Promise<boolean> {
  try {
    // Get previous tier
    const { data: previousTierData } = await supabase
      .from('customer_loyalty_points')
      .select('tier_level')
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId)
      .single();

    // Record tier history
    const { error: historyError } = await supabase
      .from('loyalty_tier_history')
      .insert([
        {
          user_id: userId,
          customer_id: customerId,
          loyalty_program_id: loyaltyProgramId,
          new_tier_id: newTierId,
          promotion_reason: promotionReason,
          effective_date: new Date().toISOString(),
        },
      ]);

    if (historyError) {
      console.error('Error recording tier history:', historyError);
      return false;
    }

    // Update customer tier
    const { error: updateError } = await supabase
      .from('customer_loyalty_points')
      .update({
        tier_level: newTierId,
        tier_since: new Date().toISOString(),
      })
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId);

    if (updateError) {
      console.error('Error updating tier:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateCustomerTier:', error);
    return false;
  }
}

// ============================================
// REFERRAL REWARDS
// ============================================

export async function createReferralReward(
  userId: string,
  referrerCustomerId: string,
  loyaltyProgramId: string,
  referrerPoints: number,
  referredCustomerDiscount: number,
  referredCustomerPoints: number
): Promise<LoyaltyReferralReward | null> {
  try {
    const referralCode = `REF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const { data, error } = await supabase
      .from('loyalty_referral_rewards')
      .insert([
        {
          user_id: userId,
          loyalty_program_id: loyaltyProgramId,
          referrer_customer_id: referrerCustomerId,
          referral_code: referralCode,
          referrer_points: referrerPoints,
          referred_customer_discount: referredCustomerDiscount,
          referred_customer_points: referredCustomerPoints,
          referral_status: 'pending',
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating referral reward:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createReferralReward:', error);
    return null;
  }
}

export async function completeReferral(
  referralId: string,
  referredCustomerId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('loyalty_referral_rewards')
      .update({
        referred_customer_id: referredCustomerId,
        referral_status: 'completed',
        claimed_at: new Date().toISOString(),
      })
      .eq('id', referralId);

    if (error) {
      console.error('Error completing referral:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeReferral:', error);
    return false;
  }
}

// ============================================
// ANALYTICS
// ============================================

export async function recordLoyaltyAnalytics(
  userId: string,
  loyaltyProgramId: string,
  analytics: {
    totalActiveMembers: number;
    newMembers: number;
    pointsIssued: number;
    pointsRedeemed: number;
    pointsExpired: number;
    rewardsClaimed: number;
    rewardsUsed: number;
    engagementRate: number;
    repeatPurchaseRate: number;
    revenueFromLoyaltyPurchases: number;
  }
): Promise<LoyaltyAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('loyalty_analytics')
      .insert([
        {
          user_id: userId,
          loyalty_program_id: loyaltyProgramId,
          date: new Date().toISOString(),
          total_active_members: analytics.totalActiveMembers,
          new_members: analytics.newMembers,
          points_issued: analytics.pointsIssued,
          points_redeemed: analytics.pointsRedeemed,
          points_expired: analytics.pointsExpired,
          rewards_claimed: analytics.rewardsClaimed,
          rewards_used: analytics.rewardsUsed,
          engagement_rate: analytics.engagementRate,
          repeat_purchase_rate: analytics.repeatPurchaseRate,
          revenue_from_loyalty_purchases: analytics.revenueFromLoyaltyPurchases,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error recording analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in recordLoyaltyAnalytics:', error);
    return null;
  }
}

export async function getLoyaltyAnalytics(
  programId: string,
  days: number = 30
): Promise<LoyaltyAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('loyalty_analytics')
      .select('*')
      .eq('loyalty_program_id', programId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getLoyaltyAnalytics:', error);
    return [];
  }
}

// ============================================
// CUSTOMER LOYALTY ACCOUNT
// ============================================

export async function getCustomerLoyaltyAccount(
  customerId: string,
  loyaltyProgramId: string
) {
  try {
    const { data, error } = await supabase
      .from('customer_loyalty_points')
      .select('*')
      .eq('customer_id', customerId)
      .eq('loyalty_program_id', loyaltyProgramId)
      .single();

    if (error) {
      console.error('Error fetching loyalty account:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCustomerLoyaltyAccount:', error);
    return null;
  }
}

export async function initializeCustomerLoyalty(
  userId: string,
  customerId: string,
  loyaltyProgramId: string,
  bonusPointsOnJoin: number = 0
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_loyalty_points')
      .insert([
        {
          user_id: userId,
          customer_id: customerId,
          loyalty_program_id: loyaltyProgramId,
          total_points: bonusPointsOnJoin,
          available_points: bonusPointsOnJoin,
          redeemed_points: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error initializing loyalty:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in initializeCustomerLoyalty:', error);
    return false;
  }
}
