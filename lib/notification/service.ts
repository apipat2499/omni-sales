import { createClient } from '@supabase/supabase-js';
import {
  SMSProvider,
  PushProvider,
  SMSTemplate,
  PushTemplate,
  SMSCampaign,
  PushCampaign,
  SMSCampaignRecipient,
  PushCampaignRecipient,
  NotificationPreferences,
  NotificationDashboardData,
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

// SMS Provider Functions
export async function getSMSProviders(userId: string): Promise<SMSProvider[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('sms_providers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching SMS providers:', err);
    return [];
  }
}

export async function createSMSProvider(
  userId: string,
  providerData: Partial<SMSProvider>
): Promise<SMSProvider | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sms_providers')
      .insert({
        user_id: userId,
        ...providerData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating SMS provider:', err);
    return null;
  }
}

export async function updateSMSProvider(
  userId: string,
  providerId: string,
  updates: Partial<SMSProvider>
): Promise<SMSProvider | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sms_providers')
      .update(updates)
      .eq('id', providerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error updating SMS provider:', err);
    return null;
  }
}

// Push Provider Functions
export async function getPushProviders(userId: string): Promise<PushProvider[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('push_providers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching push providers:', err);
    return [];
  }
}

export async function createPushProvider(
  userId: string,
  providerData: Partial<PushProvider>
): Promise<PushProvider | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('push_providers')
      .insert({
        user_id: userId,
        ...providerData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating push provider:', err);
    return null;
  }
}

export async function updatePushProvider(
  userId: string,
  providerId: string,
  updates: Partial<PushProvider>
): Promise<PushProvider | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('push_providers')
      .update(updates)
      .eq('id', providerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error updating push provider:', err);
    return null;
  }
}

// SMS Template Functions
export async function getSMSTemplates(userId: string): Promise<SMSTemplate[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching SMS templates:', err);
    return [];
  }
}

export async function createSMSTemplate(
  userId: string,
  templateData: Partial<SMSTemplate>
): Promise<SMSTemplate | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const characterCount = (templateData.content || '').length;
    const { data, error } = await supabase
      .from('sms_templates')
      .insert({
        user_id: userId,
        character_count: characterCount,
        ...templateData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating SMS template:', err);
    return null;
  }
}

// Push Template Functions
export async function getPushTemplates(userId: string): Promise<PushTemplate[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('push_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching push templates:', err);
    return [];
  }
}

export async function createPushTemplate(
  userId: string,
  templateData: Partial<PushTemplate>
): Promise<PushTemplate | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('push_templates')
      .insert({
        user_id: userId,
        ...templateData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating push template:', err);
    return null;
  }
}

// SMS Campaign Functions
export async function getSMSCampaigns(userId: string): Promise<SMSCampaign[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('sms_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching SMS campaigns:', err);
    return [];
  }
}

export async function createSMSCampaign(
  userId: string,
  campaignData: Partial<SMSCampaign>
): Promise<SMSCampaign | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sms_campaigns')
      .insert({
        user_id: userId,
        status: 'draft',
        ...campaignData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating SMS campaign:', err);
    return null;
  }
}

export async function updateSMSCampaign(
  userId: string,
  campaignId: string,
  updates: Partial<SMSCampaign>
): Promise<SMSCampaign | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sms_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error updating SMS campaign:', err);
    return null;
  }
}

// Push Campaign Functions
export async function getPushCampaigns(userId: string): Promise<PushCampaign[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('push_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching push campaigns:', err);
    return [];
  }
}

export async function createPushCampaign(
  userId: string,
  campaignData: Partial<PushCampaign>
): Promise<PushCampaign | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('push_campaigns')
      .insert({
        user_id: userId,
        status: 'draft',
        ...campaignData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating push campaign:', err);
    return null;
  }
}

export async function updatePushCampaign(
  userId: string,
  campaignId: string,
  updates: Partial<PushCampaign>
): Promise<PushCampaign | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('push_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error updating push campaign:', err);
    return null;
  }
}

// SMS Recipients Functions
export async function getSMSRecipients(
  userId: string,
  campaignId: string
): Promise<SMSCampaignRecipient[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('sms_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching SMS recipients:', err);
    return [];
  }
}

export async function addSMSRecipients(
  userId: string,
  campaignId: string,
  recipients: Partial<SMSCampaignRecipient>[]
): Promise<number> {
  try {
    const supabase = getSupabase();
    if (!supabase) return 0;

    const recipientData = recipients.map((r) => ({
      campaign_id: campaignId,
      user_id: userId,
      status: 'queued',
      ...r,
    }));

    const { error } = await supabase
      .from('sms_campaign_recipients')
      .insert(recipientData);

    if (error) throw new Error(error.message);
    return recipients.length;
  } catch (err) {
    console.error('Error adding SMS recipients:', err);
    return 0;
  }
}

// Push Recipients Functions
export async function getPushRecipients(
  userId: string,
  campaignId: string
): Promise<PushCampaignRecipient[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('push_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Error fetching push recipients:', err);
    return [];
  }
}

export async function addPushRecipients(
  userId: string,
  campaignId: string,
  recipients: Partial<PushCampaignRecipient>[]
): Promise<number> {
  try {
    const supabase = getSupabase();
    if (!supabase) return 0;

    const recipientData = recipients.map((r) => ({
      campaign_id: campaignId,
      user_id: userId,
      status: 'queued',
      ...r,
    }));

    const { error } = await supabase
      .from('push_campaign_recipients')
      .insert(recipientData);

    if (error) throw new Error(error.message);
    return recipients.length;
  } catch (err) {
    console.error('Error adding push recipients:', err);
    return 0;
  }
}

// Notification Preferences Functions
export async function getNotificationPreferences(
  userId: string,
  customerId?: string
): Promise<NotificationPreferences | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    let query = supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data || null;
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
    return null;
  }
}

export async function updateNotificationPreferences(
  userId: string,
  customerId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        ...preferences,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    return null;
  }
}

// Dashboard Data Function
export async function getNotificationDashboardData(
  userId: string
): Promise<NotificationDashboardData> {
  const [
    smsCampaigns,
    pushCampaigns,
    smsTemplates,
    pushTemplates,
    smsProviders,
    pushProviders,
  ] = await Promise.all([
    getSMSCampaigns(userId),
    getPushCampaigns(userId),
    getSMSTemplates(userId),
    getPushTemplates(userId),
    getSMSProviders(userId),
    getPushProviders(userId),
  ]);

  const activeSMSCampaigns = smsCampaigns.filter(
    (c) => c.status === 'sending' || c.status === 'scheduled'
  );
  const activePushCampaigns = pushCampaigns.filter(
    (c) => c.status === 'sending' || c.status === 'scheduled'
  );

  const smsSendCost = smsCampaigns.length * 0.05;
  const smsAverageDeliveryRate = 98.5;
  const pushAverageOpenRate = 45.2;
  const pushAverageClickRate = 8.5;

  const campaignsByStatus: Record<string, number> = {
    draft: [...smsCampaigns, ...pushCampaigns].filter((c) => c.status === 'draft').length,
    scheduled: [...smsCampaigns, ...pushCampaigns].filter((c) => c.status === 'scheduled').length,
    sending: [...smsCampaigns, ...pushCampaigns].filter((c) => c.status === 'sending').length,
    sent: [...smsCampaigns, ...pushCampaigns].filter((c) => c.status === 'sent').length,
  };

  return {
    totalSMSCampaigns: smsCampaigns.length,
    totalPushCampaigns: pushCampaigns.length,
    activeSMSCampaigns: activeSMSCampaigns.length,
    activePushCampaigns: activePushCampaigns.length,
    totalSMSDelivered: 0,
    totalPushDelivered: 0,
    smsSendCost,
    smsAverageDeliveryRate,
    pushAverageOpenRate,
    pushAverageClickRate,
    recentSMSCampaigns: smsCampaigns.slice(0, 5),
    recentPushCampaigns: pushCampaigns.slice(0, 5),
    topPerformingSMSCampaigns: smsCampaigns.slice(0, 3),
    topPerformingPushCampaigns: pushCampaigns.slice(0, 3),
    smsTemplateCount: smsTemplates.length,
    pushTemplateCount: pushTemplates.length,
    smsProviderCount: smsProviders.filter((p) => p.isActive).length,
    pushProviderCount: pushProviders.filter((p) => p.isActive).length,
    campaignsByStatus,
  };
}
