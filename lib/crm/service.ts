import { createClient } from '@supabase/supabase-js';
import {
  CRMCustomerProfile,
  CRMContact,
  CRMInteraction,
  CRMOpportunity,
  CRMLead,
  CRMLeadScore,
  CRMNote,
  CRMActivityTimeline,
  CRMCustomerSegment,
  CRMDashboardData,
  CRMCustomerHealthScore,
} from '@/types';

let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('Supabase environment variables not set');
      return null;
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// ==========================================
// Customer Profile Management
// ==========================================

export async function getCustomerProfile(userId: string, customerId: string): Promise<CRMCustomerProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_customer_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .single();

  if (error) {
    console.error('Error fetching customer profile:', error);
    return null;
  }
  return data;
}

export async function createOrUpdateCustomerProfile(
  userId: string,
  customerId: string,
  profileData: Partial<CRMCustomerProfile>
): Promise<CRMCustomerProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const existing = await getCustomerProfile(userId, customerId);

  if (existing) {
    const { data, error } = await supabase
      .from('crm_customer_profiles')
      .update(profileData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer profile:', error);
      return null;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('crm_customer_profiles')
      .insert([{ user_id: userId, customer_id: customerId, ...profileData }])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer profile:', error);
      return null;
    }
    return data;
  }
}

// ==========================================
// Contact Management
// ==========================================

export async function getContacts(userId: string, customerId: string): Promise<CRMContact[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  return data || [];
}

export async function createContact(userId: string, contactData: Partial<CRMContact>): Promise<CRMContact | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert([{ user_id: userId, ...contactData }])
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    return null;
  }
  return data;
}

export async function updateContact(userId: string, contactId: string, contactData: Partial<CRMContact>): Promise<CRMContact | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_contacts')
    .update(contactData)
    .eq('id', contactId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact:', error);
    return null;
  }
  return data;
}

// ==========================================
// Interaction Tracking
// ==========================================

export async function recordInteraction(userId: string, interactionData: Partial<CRMInteraction>): Promise<CRMInteraction | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_interactions')
    .insert([{ user_id: userId, ...interactionData }])
    .select()
    .single();

  if (error) {
    console.error('Error recording interaction:', error);
    return null;
  }

  if (interactionData.customerId) {
    await recordActivityTimeline(userId, interactionData.customerId, {
      activityType: 'interaction',
      activityTitle: `${interactionData.interactionType} - ${interactionData.subject || 'Untitled'}`,
      relatedEntityType: 'interaction',
      relatedEntityId: data.id,
    });
  }

  return data;
}

export async function getInteractionHistory(
  userId: string,
  customerId: string,
  limit: number = 20
): Promise<CRMInteraction[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('crm_interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .order('interaction_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching interaction history:', error);
    return [];
  }
  return data || [];
}

// ==========================================
// Opportunity Management
// ==========================================

export async function createOpportunity(userId: string, opportunityData: Partial<CRMOpportunity>): Promise<CRMOpportunity | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_opportunities')
    .insert([{ user_id: userId, ...opportunityData }])
    .select()
    .single();

  if (error) {
    console.error('Error creating opportunity:', error);
    return null;
  }
  return data;
}

export async function updateOpportunity(userId: string, opportunityId: string, opportunityData: Partial<CRMOpportunity>): Promise<CRMOpportunity | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_opportunities')
    .update(opportunityData)
    .eq('id', opportunityId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating opportunity:', error);
    return null;
  }
  return data;
}

export async function getOpportunitiesByCustomer(userId: string, customerId: string): Promise<CRMOpportunity[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('crm_opportunities')
    .select('*')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .order('value', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    return [];
  }
  return data || [];
}

export async function getSalesPipeline(userId: string): Promise<Record<string, number>> {
  const supabase = getSupabase();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('crm_opportunities')
    .select('stage, value')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching sales pipeline:', error);
    return {};
  }

  const pipeline: Record<string, number> = {};
  (data || []).forEach((opp: any) => {
    if (!pipeline[opp.stage]) pipeline[opp.stage] = 0;
    pipeline[opp.stage] += opp.value || 0;
  });

  return pipeline;
}

// ==========================================
// Lead Management
// ==========================================

export async function createLead(userId: string, leadData: Partial<CRMLead>): Promise<CRMLead | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_leads')
    .insert([{ user_id: userId, ...leadData }])
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    return null;
  }
  return data;
}

export async function updateLead(userId: string, leadId: string, leadData: Partial<CRMLead>): Promise<CRMLead | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_leads')
    .update(leadData)
    .eq('id', leadId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    return null;
  }
  return data;
}

export async function getLeads(userId: string, status?: string): Promise<CRMLead[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase.from('crm_leads').select('*').eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
  return data || [];
}

export async function scoreLead(userId: string, leadId: string, scoreData: Partial<CRMLeadScore>): Promise<CRMLeadScore | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_lead_scores')
    .insert([{ user_id: userId, lead_id: leadId, ...scoreData }])
    .select()
    .single();

  if (error) {
    console.error('Error scoring lead:', error);
    return null;
  }
  return data;
}

// ==========================================
// Note Management
// ==========================================

export async function createNote(userId: string, noteData: Partial<CRMNote>): Promise<CRMNote | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_notes')
    .insert([{ user_id: userId, ...noteData }])
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return null;
  }
  return data;
}

export async function getNotes(userId: string, customerId: string): Promise<CRMNote[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('crm_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
  return data || [];
}

// ==========================================
// Activity Timeline
// ==========================================

export async function recordActivityTimeline(
  userId: string,
  customerId: string,
  activityData: Partial<CRMActivityTimeline>
): Promise<CRMActivityTimeline | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_activity_timeline')
    .insert([{ user_id: userId, customer_id: customerId, ...activityData }])
    .select()
    .single();

  if (error) {
    console.error('Error recording activity:', error);
    return null;
  }
  return data;
}

export async function getActivityTimeline(userId: string, customerId: string, limit: number = 50): Promise<CRMActivityTimeline[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('crm_activity_timeline')
    .select('*')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .order('activity_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity timeline:', error);
    return [];
  }
  return data || [];
}

// ==========================================
// Segmentation
// ==========================================

export async function createSegment(userId: string, segmentData: Partial<CRMCustomerSegment>): Promise<CRMCustomerSegment | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_customer_segments')
    .insert([{ user_id: userId, ...segmentData }])
    .select()
    .single();

  if (error) {
    console.error('Error creating segment:', error);
    return null;
  }
  return data;
}

export async function getSegments(userId: string): Promise<CRMCustomerSegment[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('crm_customer_segments')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching segments:', error);
    return [];
  }
  return data || [];
}

// ==========================================
// Health Score Management
// ==========================================

export async function recordHealthScore(
  userId: string,
  customerId: string,
  healthData: Partial<CRMCustomerHealthScore>
): Promise<CRMCustomerHealthScore | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_customer_health_scores')
    .insert([{ user_id: userId, customer_id: customerId, ...healthData }])
    .select()
    .single();

  if (error) {
    console.error('Error recording health score:', error);
    return null;
  }
  return data;
}

export async function getLatestHealthScore(userId: string, customerId: string): Promise<CRMCustomerHealthScore | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('crm_customer_health_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .order('score_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching health score:', error);
    return null;
  }
  return data;
}

// ==========================================
// CRM Dashboard
// ==========================================

export async function getCRMDashboardData(userId: string): Promise<CRMDashboardData> {
  try {
    const supabase = getSupabase();
    if (!supabase) return {
      totalCustomers: 0,
      totalLeads: 0,
      totalOpportunities: 0,
      pipelineValue: 0,
      conversionRate: 0,
      averageDealSize: 0,
      salesCycle: 0,
      customerRetention: 0,
      recentInteractions: [],
      topOpportunities: [],
      stagePipeline: {},
      leadsBySource: {},
      healthScoreDistribution: {},
    };

    // Get total counts
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('created_at', userId); // This is a simplified count

    const { count: totalLeads } = await supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: totalOpportunities } = await supabase
      .from('crm_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get pipeline data
    const stagePipeline = await getSalesPipeline(userId);
    const pipelineValue = Object.values(stagePipeline).reduce((a: number, b: number) => a + b, 0);

    // Get recent interactions
    const { data: recentInteractions } = await supabase
      .from('crm_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('interaction_date', { ascending: false })
      .limit(10);

    // Get top opportunities
    const { data: topOpportunities } = await supabase
      .from('crm_opportunities')
      .select('*')
      .eq('user_id', userId)
      .order('value', { ascending: false })
      .limit(10);

    // Get leads by source
    const { data: leadsData } = await supabase
      .from('crm_leads')
      .select('source')
      .eq('user_id', userId);

    const leadsBySource: Record<string, number> = {};
    (leadsData || []).forEach((lead: any) => {
      if (!leadsBySource[lead.source]) leadsBySource[lead.source] = 0;
      leadsBySource[lead.source]++;
    });

    return {
      totalCustomers: totalCustomers || 0,
      totalLeads: totalLeads || 0,
      totalOpportunities: totalOpportunities || 0,
      pipelineValue,
      conversionRate: totalLeads && totalCustomers ? (totalCustomers / totalLeads) * 100 : 0,
      averageDealSize: totalOpportunities && pipelineValue ? pipelineValue / totalOpportunities : 0,
      salesCycle: 45, // Default value, calculate based on closed opportunities
      customerRetention: 85, // Default value, calculate from data
      recentInteractions: (recentInteractions || []) as any[],
      topOpportunities: (topOpportunities || []) as any[],
      stagePipeline,
      leadsBySource,
      healthScoreDistribution: {},
    };
  } catch (error) {
    console.error('Error fetching CRM dashboard data:', error);
    return {
      totalCustomers: 0,
      totalLeads: 0,
      totalOpportunities: 0,
      pipelineValue: 0,
      conversionRate: 0,
      averageDealSize: 0,
      salesCycle: 0,
      customerRetention: 0,
      recentInteractions: [],
      topOpportunities: [],
      stagePipeline: {},
      leadsBySource: {},
      healthScoreDistribution: {},
    };
  }
}
