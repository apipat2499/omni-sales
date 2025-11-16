import { createClient } from '@supabase/supabase-js';
import {
  LoyaltyProgram,
  LoyaltyTier,
  LoyaltyMember,
  LoyaltyPointsTransaction,
  LoyaltyReward,
  LoyaltyRedemption,
  LoyaltyDashboardData,
  LoyaltyMemberActivity,
} from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Program Functions
export async function getLoyaltyPrograms(userId: string): Promise<LoyaltyProgram[]> {
  const { data, error } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Get single loyalty program
export async function getLoyaltyProgram(userId: string, programId: string): Promise<LoyaltyProgram | null> {
  const { data, error } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('user_id', userId)
    .eq('id', programId)
    .single();

  if (error) {
    console.error('Error fetching loyalty program:', error);
    return null;
  }
  return data;
}

export async function createLoyaltyProgram(
  userId: string,
  programData: Partial<LoyaltyProgram>
): Promise<LoyaltyProgram> {
  const { data, error } = await supabase
    .from('loyalty_programs')
    .insert({
      user_id: userId,
      status: 'active',
      ...programData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Tier Functions
export async function getLoyaltyTiers(programId: string): Promise<LoyaltyTier[]> {
  const { data, error } = await supabase
    .from('loyalty_tiers')
    .select('*')
    .eq('program_id', programId)
    .order('tier_level', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createLoyaltyTier(
  userId: string,
  tierData: any
): Promise<LoyaltyTier> {
  const { loyaltyProgramId: programId, ...otherData } = tierData;
  const { data, error } = await supabase
    .from('loyalty_tiers')
    .insert({
      user_id: userId,
      program_id: programId,
      ...otherData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Member Functions
export async function getLoyaltyMembers(
  programId: string,
  userId: string
): Promise<LoyaltyMember[]> {
  const { data, error } = await supabase
    .from('loyalty_members')
    .select('*')
    .eq('program_id', programId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function enrollLoyaltyMember(
  userId: string,
  programId: string,
  memberData: Partial<LoyaltyMember>
): Promise<LoyaltyMember> {
  const { data, error } = await supabase
    .from('loyalty_members')
    .insert({
      user_id: userId,
      program_id: programId,
      membership_status: 'active',
      ...memberData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLoyaltyMember(
  userId: string,
  memberId: string,
  updates: Partial<LoyaltyMember>
): Promise<LoyaltyMember> {
  const { data, error } = await supabase
    .from('loyalty_members')
    .update(updates)
    .eq('id', memberId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Points Transaction Functions
export async function addPointsTransaction(
  userId: string,
  programId: string,
  memberId: string,
  transactionData: Partial<LoyaltyPointsTransaction>
): Promise<LoyaltyPointsTransaction> {
  const { data, error } = await supabase
    .from('loyalty_points_transactions')
    .insert({
      user_id: userId,
      program_id: programId,
      member_id: memberId,
      status: 'completed',
      ...transactionData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMemberPointsHistory(
  memberId: string
): Promise<LoyaltyPointsTransaction[]> {
  const { data, error } = await supabase
    .from('loyalty_points_transactions')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Reward Functions
export async function getLoyaltyRewards(
  programId: string,
  userId: string
): Promise<LoyaltyReward[]> {
  const { data, error } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('program_id', programId)
    .eq('user_id', userId)
    .eq('active', true)
    .order('points_cost', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

// Alias for compatibility
export async function getRewards(
  programId: string,
  userId?: string
): Promise<LoyaltyReward[]> {
  if (userId) {
    return getLoyaltyRewards(programId, userId);
  }
  // If no userId provided, fetch all active rewards for the program
  const { data, error } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('program_id', programId)
    .eq('active', true)
    .order('points_cost', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createLoyaltyReward(
  userId: string,
  programId: string,
  rewardData: Partial<LoyaltyReward>
): Promise<LoyaltyReward> {
  const { data, error } = await supabase
    .from('loyalty_rewards')
    .insert({
      user_id: userId,
      program_id: programId,
      active: true,
      ...rewardData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Alias for compatibility
export async function createReward(
  userId: string,
  rewardData: any
): Promise<LoyaltyReward> {
  const { loyaltyProgramId: programId, ...otherData } = rewardData;
  return createLoyaltyReward(userId, programId, otherData as Partial<LoyaltyReward>);
}

// Redemption Functions
export async function createRedemption(
  userId: string,
  programId: string,
  memberId: string,
  rewardId: string,
  pointsRedeemed: number
): Promise<LoyaltyRedemption> {
  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .insert({
      user_id: userId,
      program_id: programId,
      member_id: memberId,
      reward_id: rewardId,
      points_redeemed: pointsRedeemed,
      fulfillment_status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMemberRedemptions(
  memberId: string
): Promise<LoyaltyRedemption[]> {
  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .select('*')
    .eq('member_id', memberId)
    .order('redemption_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Dashboard Data Function
export async function getLoyaltyDashboardData(
  userId: string
): Promise<LoyaltyDashboardData> {
  const [programs, members, rewards] = await Promise.all([
    getLoyaltyPrograms(userId),
    supabase
      .from('loyalty_members')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true),
  ]);

  const membersData = members.data || [];
  const rewardsData = rewards.data || [];
  
  const activeMembers = membersData.filter((m) => m.membership_status === 'active');
  const totalPoints = membersData.reduce((sum, m) => sum + (m.current_points || 0), 0);
  const averagePoints = membersData.length > 0 ? totalPoints / membersData.length : 0;
  const redemptionCount = membersData.reduce((sum, m) => sum + (m.redemption_count || 0), 0);
  const redemptionRate = membersData.length > 0 ? (redemptionCount / membersData.length) * 100 : 0;

  const tierDistribution: Record<string, number> = {};
  membersData.forEach((member) => {
    const tier = member.current_tier_id || 'unassigned';
    tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
  });

  const programsByStatus: Record<string, number> = {
    active: programs.filter((p) => p.status === 'active').length,
    inactive: programs.filter((p) => p.status === 'inactive').length,
  };

  return {
    totalPrograms: programs.length,
    activePrograms: programs.filter((p) => p.status === 'active').length,
    totalMembers: membersData.length,
    activeMembers: activeMembers.length,
    totalPointsOutstanding: totalPoints,
    totalPointsRedeemed: 0,
    averagePointsPerMember: averagePoints,
    redemptionRate,
    recentMembers: membersData.slice(0, 5),
    topMembers: [...membersData].sort((a, b) => (b.current_points || 0) - (a.current_points || 0)).slice(0, 5),
    upcomingRewards: rewardsData.filter((r) => !r.end_date || new Date(r.end_date) > new Date()).slice(0, 5),
    tierDistribution,
    programsByStatus,
    membershipTrendLastMonth: Array(30).fill(0),
    redemptionTrendLastMonth: Array(30).fill(0),
  };
}

// Initialize Customer Loyalty
export async function initializeCustomerLoyalty(
  userId: string,
  customerId: string,
  programId: string,
  bonusPoints?: number
): Promise<LoyaltyMember> {
  return enrollLoyaltyMember(userId, programId, {
    customer_id: customerId,
    current_points: bonusPoints || 0,
    current_tier_id: 'bronze',
    membership_status: 'active',
  } as any);
}

// Record Loyalty Analytics
export async function recordLoyaltyAnalytics(
  userId: string,
  programId: string,
  data: Record<string, any>
): Promise<any> {
  const { data: result, error } = await supabase
    .from('loyalty_analytics')
    .insert({
      user_id: userId,
      program_id: programId,
      event_data: data,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
}

// Redeem Reward
export async function redeemReward(
  userId: string,
  memberId: string,
  rewardId: string,
  programId: string
): Promise<LoyaltyRedemption> {
  // Default points redeemed - retrieve from reward
  const pointsRedeemed = 100; // Default value

  // Create redemption record
  const redemption = await createRedemption(userId, programId, memberId, rewardId, pointsRedeemed);

  // Update member points
  const member = await getMemberPointsHistory(memberId);
  const totalPoints = member.reduce((sum, t) => sum + (t.points_earned || 0) - (t.points_redeemed || 0), 0);

  await updateLoyaltyMember(userId, memberId, {
    current_points: Math.max(0, totalPoints - pointsRedeemed),
  } as any);

  return redemption;
}

// Approve Redemption
export async function approveRedemption(
  userId: string,
  redemptionId: string,
  notes?: string
): Promise<LoyaltyRedemption> {
  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .update({
      fulfillment_status: 'fulfilled',
      fulfilled_date: new Date().toISOString(),
      notes: notes || '',
    })
    .eq('id', redemptionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Create Point Rule
export async function createPointRule(
  userId: string,
  ruleData: any
): Promise<any> {
  try {
    const { loyaltyProgramId: programId, ...otherData } = ruleData;
    const { data, error } = await supabase
      .from('loyalty_point_rules')
      .insert({
        user_id: userId,
        program_id: programId,
        ...otherData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating point rule:', err);
    return null;
  }
}

// Get Customer Loyalty Account
export async function getCustomerLoyaltyAccount(
  customerId: string,
  programId: string
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('loyalty_members')
      .select('*')
      .eq('customer_id', customerId)
      .eq('program_id', programId)
      .single();

    if (error) {
      console.error('Customer not found in loyalty program:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error fetching customer loyalty account:', err);
    return null;
  }
}

// Get Loyalty Analytics
export async function getLoyaltyAnalytics(
  userId: string,
  programId?: string
): Promise<any> {
  try {
    let query = supabase.from('loyalty_analytics').select('*').eq('user_id', userId);

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching loyalty analytics:', err);
    return [];
  }
}
