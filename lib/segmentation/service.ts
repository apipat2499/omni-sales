import { createClient } from '@supabase/supabase-js';
import {
  CustomerSegmentV2,
  SegmentMember,
  CustomerBehaviorEvent,
  CustomerBehaviorSummary,
  Cohort,
  CohortMember,
  CustomerJourneyStage,
  CustomerLTVPrediction,
  BehavioralAnalytics,
  SegmentPerformance,
} from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================
// SEGMENT MANAGEMENT
// ============================================

export async function createSegment(
  userId: string,
  segment: Partial<CustomerSegmentV2>
): Promise<CustomerSegmentV2 | null> {
  try {
    const { data, error } = await supabase
      .from('customer_segments_v2')
      .insert({
        user_id: userId,
        name: segment.name,
        description: segment.description,
        segment_type: segment.segmentType,
        criteria: segment.criteria || {},
        is_active: true,
        member_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as CustomerSegmentV2;
  } catch (err) {
    console.error('Error creating segment:', err);
    return null;
  }
}

export async function getSegments(userId: string): Promise<CustomerSegmentV2[]> {
  try {
    const { data, error } = await supabase
      .from('customer_segments_v2')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CustomerSegmentV2[];
  } catch (err) {
    console.error('Error fetching segments:', err);
    return [];
  }
}

export async function updateSegment(
  segmentId: string,
  updates: Partial<CustomerSegmentV2>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_segments_v2')
      .update({
        name: updates.name,
        description: updates.description,
        criteria: updates.criteria,
        updated_at: new Date(),
      })
      .eq('id', segmentId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating segment:', err);
    return false;
  }
}

// ============================================
// BEHAVIOR TRACKING
// ============================================

export async function recordBehaviorEvent(
  userId: string,
  event: Partial<CustomerBehaviorEvent>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_behavior_events')
      .insert({
        user_id: userId,
        customer_id: event.customerId,
        event_type: event.eventType,
        event_category: event.eventCategory,
        product_id: event.productId,
        product_name: event.productName,
        product_category: event.productCategory,
        event_value: event.eventValue,
        event_properties: event.eventProperties || {},
        page_url: event.pageUrl,
        referrer_url: event.referrerUrl,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        device_type: event.deviceType,
        browser: event.browser,
        os: event.os,
        location: event.location,
        session_id: event.sessionId,
        created_at: new Date(),
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error recording behavior event:', err);
    return false;
  }
}

export async function getBehaviorSummary(customerId: string): Promise<CustomerBehaviorSummary | null> {
  try {
    const { data, error } = await supabase
      .from('customer_behavior_summary')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as CustomerBehaviorSummary;
  } catch (err) {
    console.error('Error fetching behavior summary:', err);
    return null;
  }
}

export async function updateBehaviorSummary(
  userId: string,
  customerId: string,
  updates: Partial<CustomerBehaviorSummary>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_behavior_summary')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('user_id', userId)
      .eq('customer_id', customerId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating behavior summary:', err);
    return false;
  }
}

// ============================================
// COHORT MANAGEMENT
// ============================================

export async function createCohort(
  userId: string,
  cohort: Partial<Cohort>
): Promise<Cohort | null> {
  try {
    const { data, error } = await supabase
      .from('cohorts')
      .insert({
        user_id: userId,
        cohort_name: cohort.cohortName,
        cohort_type: cohort.cohortType,
        acquisition_start_date: cohort.acquisitionStartDate,
        acquisition_end_date: cohort.acquisitionEndDate,
        description: cohort.description,
        member_count: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Cohort;
  } catch (err) {
    console.error('Error creating cohort:', err);
    return null;
  }
}

export async function getCohorts(userId: string): Promise<Cohort[]> {
  try {
    const { data, error } = await supabase
      .from('cohorts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Cohort[];
  } catch (err) {
    console.error('Error fetching cohorts:', err);
    return [];
  }
}

// ============================================
// CUSTOMER JOURNEY
// ============================================

export async function updateCustomerJourneyStage(
  userId: string,
  customerId: string,
  stage: string
): Promise<boolean> {
  try {
    const now = new Date();
    const { error } = await supabase
      .from('customer_journey_stages')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        current_stage: stage,
        stage_entered_at: now,
        days_in_stage: 0,
        created_at: now,
        updated_at: now,
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating journey stage:', err);
    return false;
  }
}

export async function getCustomerJourneyStage(customerId: string): Promise<CustomerJourneyStage | null> {
  try {
    const { data, error } = await supabase
      .from('customer_journey_stages')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as CustomerJourneyStage;
  } catch (err) {
    console.error('Error fetching journey stage:', err);
    return null;
  }
}

// ============================================
// LTV PREDICTIONS
// ============================================

export async function recordLTVPrediction(
  userId: string,
  prediction: Partial<CustomerLTVPrediction>
): Promise<CustomerLTVPrediction | null> {
  try {
    const { data, error } = await supabase
      .from('customer_ltv_predictions')
      .upsert({
        user_id: userId,
        customer_id: prediction.customerId,
        current_ltv: prediction.currentLtv,
        predicted_ltv_1year: prediction.predictedLtv1Year,
        predicted_ltv_3year: prediction.predictedLtv3Year,
        predicted_ltv_5year: prediction.predictedLtv5Year,
        churn_probability: prediction.churnProbability,
        growth_potential: prediction.growthPotential,
        confidence_score: prediction.confidenceScore,
        prediction_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as CustomerLTVPrediction;
  } catch (err) {
    console.error('Error recording LTV prediction:', err);
    return null;
  }
}

export async function getLTVPredictions(userId: string): Promise<CustomerLTVPrediction[]> {
  try {
    const { data, error } = await supabase
      .from('customer_ltv_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('churn_probability', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []) as CustomerLTVPrediction[];
  } catch (err) {
    console.error('Error fetching LTV predictions:', err);
    return [];
  }
}

// ============================================
// ANALYTICS
// ============================================

export async function recordBehavioralAnalytics(
  userId: string,
  analytics: Partial<BehavioralAnalytics>
): Promise<BehavioralAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('behavioral_analytics')
      .insert({
        user_id: userId,
        date: analytics.date || new Date(),
        segment_id: analytics.segmentId,
        total_customers: analytics.totalCustomers || 0,
        new_customers: analytics.newCustomers || 0,
        active_customers: analytics.activeCustomers || 0,
        at_risk_customers: analytics.atRiskCustomers || 0,
        churned_customers: analytics.churnedCustomers || 0,
        total_page_views: analytics.totalPageViews || 0,
        total_product_views: analytics.totalProductViews || 0,
        total_add_to_cart: analytics.totalAddToCart || 0,
        total_purchases: analytics.totalPurchases || 0,
        conversion_rate: analytics.conversionRate,
        avg_session_duration_minutes: analytics.avgSessionDurationMinutes,
        bounce_rate: analytics.bounceRate,
        repeat_purchase_rate: analytics.repeatPurchaseRate,
        avg_order_value: analytics.avgOrderValue,
        revenue: analytics.revenue,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as BehavioralAnalytics;
  } catch (err) {
    console.error('Error recording behavioral analytics:', err);
    return null;
  }
}

export async function getBehavioralAnalytics(
  userId: string,
  days: number = 30
): Promise<BehavioralAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('behavioral_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as BehavioralAnalytics[];
  } catch (err) {
    console.error('Error fetching behavioral analytics:', err);
    return [];
  }
}

export async function recordSegmentPerformance(
  userId: string,
  performance: Partial<SegmentPerformance>
): Promise<SegmentPerformance | null> {
  try {
    const { data, error } = await supabase
      .from('segment_performance')
      .insert({
        user_id: userId,
        segment_id: performance.segmentId,
        date: performance.date || new Date(),
        member_count: performance.memberCount || 0,
        active_members: performance.activeMembers || 0,
        churn_rate: performance.churnRate,
        lifetime_value: performance.lifetimeValue,
        avg_order_value: performance.avgOrderValue,
        purchase_frequency: performance.purchaseFrequency,
        conversion_rate: performance.conversionRate,
        email_open_rate: performance.emailOpenRate,
        email_click_rate: performance.emailClickRate,
        sms_open_rate: performance.smsOpenRate,
        engagement_score: performance.engagementScore,
        revenue_generated: performance.revenueGenerated,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as SegmentPerformance;
  } catch (err) {
    console.error('Error recording segment performance:', err);
    return null;
  }
}

export async function getSegmentPerformance(
  segmentId: string,
  days: number = 30
): Promise<SegmentPerformance[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('segment_performance')
      .select('*')
      .eq('segment_id', segmentId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as SegmentPerformance[];
  } catch (err) {
    console.error('Error fetching segment performance:', err);
    return [];
  }
}

// ============================================
// SEGMENT MEMBERSHIP
// ============================================

export async function addSegmentMember(
  userId: string,
  segmentId: string,
  customerId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('segment_members')
      .insert({
        user_id: userId,
        segment_id: segmentId,
        customer_id: customerId,
        joined_at: new Date(),
      });

    if (error && error.code !== 'UNIQUE violation') throw error;
    return true;
  } catch (err) {
    console.error('Error adding segment member:', err);
    return false;
  }
}

export async function getSegmentMembers(segmentId: string): Promise<SegmentMember[]> {
  try {
    const { data, error } = await supabase
      .from('segment_members')
      .select('*')
      .eq('segment_id', segmentId)
      .is('left_at', null);

    if (error) throw error;
    return (data || []) as SegmentMember[];
  } catch (err) {
    console.error('Error fetching segment members:', err);
    return [];
  }
}

export async function removeSegmentMember(
  segmentId: string,
  customerId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('segment_members')
      .update({
        left_at: new Date(),
      })
      .eq('segment_id', segmentId)
      .eq('customer_id', customerId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error removing segment member:', err);
    return false;
  }
}
