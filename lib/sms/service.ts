import { createClient } from '@supabase/supabase-js';
import { SMSTemplate, SMSLog, SMSCampaign, SMSAnalytics } from '@/types';

let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn("Supabase environment variables not set");
      return null;
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// ============================================
// SMS TEMPLATE MANAGEMENT
// ============================================

export async function createSMSTemplate(
  userId: string,
  template: {
    name: string;
    templateType: string;
    content: string;
    variables?: string[];
  }
): Promise<SMSTemplate | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const characterCount = template.content.length;
    const smsCount = Math.ceil(characterCount / 160);

    const { data, error } = await supabase
      .from('sms_templates')
      .insert([
        {
          user_id: userId,
          name: template.name,
          template_type: template.templateType,
          content: template.content,
          variables: template.variables || [],
          character_count: characterCount,
          sms_count: smsCount,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating SMS template:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createSMSTemplate:', error);
    return null;
  }
}

export async function getSMSTemplates(userId: string): Promise<SMSTemplate[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching SMS templates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSMSTemplates:', error);
    return [];
  }
}

// ============================================
// SMS SENDING & QUEUING
// ============================================

export async function queueSMS(
  userId: string,
  sms: {
    recipientPhone: string;
    recipientName?: string;
    content: string;
    templateId?: string;
    variables?: Record<string, unknown>;
    scheduledFor?: Date;
    relatedOrderId?: string;
  }
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('sms_queue')
      .insert([
        {
          user_id: userId,
          recipient_phone: sms.recipientPhone,
          recipient_name: sms.recipientName,
          template_id: sms.templateId,
          content: sms.content,
          variables: sms.variables || {},
          status: 'pending',
          scheduled_for: sms.scheduledFor?.toISOString(),
          related_order_id: sms.relatedOrderId,
        },
      ]);

    if (error) {
      console.error('Error queueing SMS:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in queueSMS:', error);
    return false;
  }
}

export async function logSMS(
  userId: string,
  log: {
    recipientPhone: string;
    recipientName?: string;
    templateType?: string;
    content: string;
    status: string;
    provider?: string;
    providerMessageId?: string;
    segmentsUsed: number;
    cost?: number;
    relatedOrderId?: string;
    relatedCustomerId?: string;
  }
): Promise<SMSLog | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sms_logs')
      .insert([
        {
          user_id: userId,
          recipient_phone: log.recipientPhone,
          recipient_name: log.recipientName,
          template_type: log.templateType,
          content: log.content,
          status: log.status,
          provider: log.provider,
          provider_message_id: log.providerMessageId,
          segments_used: log.segmentsUsed,
          cost: log.cost,
          related_order_id: log.relatedOrderId,
          related_customer_id: log.relatedCustomerId,
          sent_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error logging SMS:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in logSMS:', error);
    return null;
  }
}

// ============================================
// SMS PREFERENCES
// ============================================

export async function getSMSPreferences(customerId: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sms_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error) {
      console.error('Error fetching SMS preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSMSPreferences:', error);
    return null;
  }
}

export async function updateSMSPreferences(
  userId: string,
  customerId: string,
  preferences: {
    orderNotifications?: boolean;
    shippingUpdates?: boolean;
    paymentReminders?: boolean;
    promotionalOffers?: boolean;
    isOptedIn?: boolean;
  }
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('sms_preferences')
      .update({
        order_notifications: preferences.orderNotifications,
        shipping_updates: preferences.shippingUpdates,
        payment_reminders: preferences.paymentReminders,
        promotional_offers: preferences.promotionalOffers,
        is_opted_in: preferences.isOptedIn,
      })
      .eq('customer_id', customerId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating SMS preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSMSPreferences:', error);
    return false;
  }
}

// ============================================
// SMS CAMPAIGNS
// ============================================

export async function createSMSCampaign(
  userId: string,
  campaign: {
    campaignName: string;
    campaignType: string;
    templateId?: string;
    content?: string;
    targetAudience: string;
    recipientCount: number;
    scheduledFor?: Date;
    budgetLimit?: number;
  }
): Promise<SMSCampaign | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sms_campaigns')
      .insert([
        {
          user_id: userId,
          campaign_name: campaign.campaignName,
          campaign_type: campaign.campaignType,
          template_id: campaign.templateId,
          content: campaign.content,
          target_audience: campaign.targetAudience,
          recipient_count: campaign.recipientCount,
          scheduled_for: campaign.scheduledFor?.toISOString(),
          budget_limit: campaign.budgetLimit,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating SMS campaign:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createSMSCampaign:', error);
    return null;
  }
}

export async function getSMSCampaigns(
  userId: string,
  status?: string
): Promise<SMSCampaign[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    let query = supabase
      .from('sms_campaigns')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching SMS campaigns:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSMSCampaigns:', error);
    return [];
  }
}

// ============================================
// SMS ANALYTICS
// ============================================

export async function recordSMSAnalytics(
  userId: string,
  analytics: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalBounced: number;
    totalCost: number;
    segmentsUsed: number;
    deliveryRate: number;
    failureRate: number;
    bounceRate: number;
    avgSegmentsPerMessage: number;
    uniqueRecipients: number;
    campaignId?: string;
  }
): Promise<SMSAnalytics | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sms_analytics')
      .insert([
        {
          user_id: userId,
          date: new Date().toISOString(),
          total_sent: analytics.totalSent,
          total_delivered: analytics.totalDelivered,
          total_failed: analytics.totalFailed,
          total_bounced: analytics.totalBounced,
          total_cost: analytics.totalCost,
          segments_used: analytics.segmentsUsed,
          delivery_rate: analytics.deliveryRate,
          failure_rate: analytics.failureRate,
          bounce_rate: analytics.bounceRate,
          avg_segments_per_message: analytics.avgSegmentsPerMessage,
          unique_recipients: analytics.uniqueRecipients,
          campaign_id: analytics.campaignId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error recording SMS analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in recordSMSAnalytics:', error);
    return null;
  }
}

export async function getSMSAnalytics(
  userId: string,
  days: number = 30
): Promise<SMSAnalytics[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('sms_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching SMS analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSMSAnalytics:', error);
    return [];
  }
}

// ============================================
// SMS LOGS
// ============================================

export async function getSMSLogs(
  userId: string,
  status?: string,
  limit: number = 50
): Promise<SMSLog[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    let query = supabase
      .from('sms_logs')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching SMS logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSMSLogs:', error);
    return [];
  }
}

export async function updateSMSLogStatus(
  logId: string,
  status: string,
  deliveredAt?: Date
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('sms_logs')
      .update({
        status,
        delivered_at: deliveredAt?.toISOString(),
      })
      .eq('id', logId);

    if (error) {
      console.error('Error updating SMS log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSMSLogStatus:', error);
    return false;
  }
}

// ============================================
// SMS BOUNCE MANAGEMENT
// ============================================

export async function recordBounce(
  userId: string,
  phoneNumber: string,
  bounceType: string,
  bounceReason?: string
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('sms_bounces')
      .upsert(
        [
          {
            user_id: userId,
            phone_number: phoneNumber,
            bounce_type: bounceType,
            bounce_reason: bounceReason,
            is_permanent: bounceType === 'permanent',
            last_bounce_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id, phone_number' }
      );

    if (error) {
      console.error('Error recording bounce:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordBounce:', error);
    return false;
  }
}

// ============================================
// SMS COMPLIANCE
// ============================================

export async function recordConsentForSMS(
  userId: string,
  customerId: string,
  phoneNumber: string,
  consentStatus: string,
  consentMethod: string,
  regulatoryFramework?: string
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('sms_compliance')
      .insert([
        {
          user_id: userId,
          customer_id: customerId,
          phone_number: phoneNumber,
          consent_type: 'marketing',
          consent_status: consentStatus,
          consent_method: consentMethod,
          consent_date: new Date().toISOString(),
          regulatory_framework: regulatoryFramework,
        },
      ]);

    if (error) {
      console.error('Error recording consent:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordConsentForSMS:', error);
    return false;
  }
}
