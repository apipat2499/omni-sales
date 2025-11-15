import { createClient } from '@supabase/supabase-js';
import {
  EmailTemplate,
  EmailLog,
  EmailCampaign,
  EmailAnalytics,
  EmailPreferences,
  EmailProvider,
  EmailTrigger,
  EmailQueue,
  EmailBounce,
  EmailCompliance,
} from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================
// TEMPLATE MANAGEMENT
// ============================================

export async function createEmailTemplate(
  userId: string,
  template: Partial<EmailTemplate>
): Promise<EmailTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        user_id: userId,
        name: template.name,
        template_type: template.templateType,
        subject_line: template.subjectLine,
        preheader_text: template.preheaderText,
        html_content: template.htmlContent,
        plain_text_content: template.plainTextContent,
        variables: template.variables || [],
        is_active: true,
        is_responsive: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  } catch (err) {
    console.error('Error creating email template:', err);
    return null;
  }
}

export async function getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EmailTemplate[];
  } catch (err) {
    console.error('Error fetching email templates:', err);
    return [];
  }
}

export async function updateEmailTemplate(
  templateId: string,
  updates: Partial<EmailTemplate>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_templates')
      .update({
        name: updates.name,
        subject_line: updates.subjectLine,
        preheader_text: updates.preheaderText,
        html_content: updates.htmlContent,
        plain_text_content: updates.plainTextContent,
        updated_at: new Date(),
      })
      .eq('id', templateId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating email template:', err);
    return false;
  }
}

// ============================================
// EMAIL SENDING & QUEUING
// ============================================

export async function queueEmail(
  userId: string,
  email: Partial<EmailQueue>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .insert({
        user_id: userId,
        recipient_email: email.recipientEmail,
        recipient_name: email.recipientName,
        template_id: email.templateId,
        subject_line: email.subjectLine,
        html_content: email.htmlContent,
        plain_text_content: email.plainTextContent,
        variables: email.variables || {},
        status: 'pending',
        retry_count: 0,
        max_retries: 5,
        scheduled_for: email.scheduledFor,
        related_order_id: email.relatedOrderId,
        created_at: new Date(),
        updated_at: new Date(),
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error queuing email:', err);
    return false;
  }
}

export async function logEmail(
  userId: string,
  log: Partial<EmailLog>
): Promise<EmailLog | null> {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        recipient_email: log.recipientEmail,
        recipient_name: log.recipientName,
        template_type: log.templateType,
        subject_line: log.subjectLine,
        email_body: log.emailBody,
        status: log.status || 'queued',
        provider: log.provider,
        provider_message_id: log.providerMessageId,
        click_count: 0,
        open_count: 0,
        related_order_id: log.relatedOrderId,
        related_customer_id: log.relatedCustomerId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailLog;
  } catch (err) {
    console.error('Error logging email:', err);
    return null;
  }
}

export async function updateEmailLogStatus(
  logId: string,
  status: string,
  deliveredAt?: Date,
  openedAt?: Date,
  clickedAt?: Date
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      updated_at: new Date(),
    };

    if (deliveredAt) updates.delivered_at = deliveredAt;
    if (openedAt) updates.opened_at = openedAt;
    if (clickedAt) updates.clicked_at = clickedAt;

    const { error } = await supabase
      .from('email_logs')
      .update(updates)
      .eq('id', logId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating email log status:', err);
    return false;
  }
}

// ============================================
// EMAIL PREFERENCES
// ============================================

export async function getEmailPreferences(customerId: string): Promise<EmailPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as EmailPreferences;
  } catch (err) {
    console.error('Error fetching email preferences:', err);
    return null;
  }
}

export async function updateEmailPreferences(
  userId: string,
  customerId: string,
  preferences: Partial<EmailPreferences>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_preferences')
      .update({
        ...preferences,
        updated_at: new Date(),
      })
      .eq('user_id', userId)
      .eq('customer_id', customerId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating email preferences:', err);
    return false;
  }
}

// ============================================
// EMAIL CAMPAIGNS
// ============================================

export async function createEmailCampaign(
  userId: string,
  campaign: Partial<EmailCampaign>
): Promise<EmailCampaign | null> {
  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        user_id: userId,
        campaign_name: campaign.campaignName,
        description: campaign.description,
        campaign_type: campaign.campaignType,
        status: 'draft',
        template_id: campaign.templateId,
        subject_line: campaign.subjectLine,
        preheader_text: campaign.preheaderText,
        html_content: campaign.htmlContent,
        plain_text_content: campaign.plainTextContent,
        target_audience: campaign.targetAudience || 'all',
        target_segment_id: campaign.targetSegmentId,
        recipient_count: campaign.recipientCount || 0,
        budget_limit: campaign.budgetLimit,
        total_cost: 0,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        complained_count: 0,
        unsubscribed_count: 0,
        conversion_count: 0,
        revenue_generated: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailCampaign;
  } catch (err) {
    console.error('Error creating email campaign:', err);
    return null;
  }
}

export async function getEmailCampaigns(
  userId: string,
  status?: string
): Promise<EmailCampaign[]> {
  try {
    let query = supabase
      .from('email_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as EmailCampaign[];
  } catch (err) {
    console.error('Error fetching email campaigns:', err);
    return [];
  }
}

export async function updateEmailCampaignStatus(
  campaignId: string,
  status: string
): Promise<boolean> {
  try {
    const updates: any = {
      status,
      updated_at: new Date(),
    };

    if (status === 'active') {
      updates.started_at = new Date();
    } else if (status === 'completed') {
      updates.completed_at = new Date();
    }

    const { error } = await supabase
      .from('email_campaigns')
      .update(updates)
      .eq('id', campaignId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating email campaign status:', err);
    return false;
  }
}

// ============================================
// EMAIL ANALYTICS
// ============================================

export async function recordEmailAnalytics(
  userId: string,
  analytics: Partial<EmailAnalytics>
): Promise<EmailAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('email_analytics')
      .insert({
        user_id: userId,
        date: analytics.date || new Date(),
        total_sent: analytics.totalSent || 0,
        total_delivered: analytics.totalDelivered || 0,
        total_bounced: analytics.totalBounced || 0,
        total_complained: analytics.totalComplained || 0,
        total_unsubscribed: analytics.totalUnsubscribed || 0,
        total_opened: analytics.totalOpened || 0,
        total_clicked: analytics.totalClicked || 0,
        total_revenue: analytics.totalRevenue || 0,
        total_conversions: analytics.totalConversions || 0,
        unique_opens: analytics.uniqueOpens || 0,
        unique_clicks: analytics.uniqueClicks || 0,
        delivery_rate: analytics.deliveryRate,
        bounce_rate: analytics.bounceRate,
        complaint_rate: analytics.complaintRate,
        open_rate: analytics.openRate,
        click_rate: analytics.clickRate,
        conversion_rate: analytics.conversionRate,
        unique_recipients: analytics.uniqueRecipients || 0,
        campaign_id: analytics.campaignId,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailAnalytics;
  } catch (err) {
    console.error('Error recording email analytics:', err);
    return null;
  }
}

export async function getEmailAnalytics(
  userId: string,
  days: number = 30
): Promise<EmailAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('email_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as EmailAnalytics[];
  } catch (err) {
    console.error('Error fetching email analytics:', err);
    return [];
  }
}

// ============================================
// EMAIL LOGS
// ============================================

export async function getEmailLogs(
  userId: string,
  status?: string,
  limit: number = 50
): Promise<EmailLog[]> {
  try {
    let query = supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as EmailLog[];
  } catch (err) {
    console.error('Error fetching email logs:', err);
    return [];
  }
}

// ============================================
// BOUNCE MANAGEMENT
// ============================================

export async function recordBounce(
  userId: string,
  emailAddress: string,
  bounceType: string,
  bounceReason?: string
): Promise<boolean> {
  try {
    const isPermanent = bounceType === 'hard_bounce' || bounceType === 'complaint';

    const { data: existing } = await supabase
      .from('email_bounces')
      .select('*')
      .eq('user_id', userId)
      .eq('email_address', emailAddress)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('email_bounces')
        .update({
          bounce_count: existing.bounce_count + 1,
          last_bounce_at: new Date(),
          is_permanent: isPermanent,
          updated_at: new Date(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('email_bounces')
        .insert({
          user_id: userId,
          email_address: emailAddress,
          bounce_type: bounceType,
          bounce_reason: bounceReason,
          is_permanent: isPermanent,
          first_bounce_at: new Date(),
          last_bounce_at: new Date(),
          bounce_count: 1,
          created_at: new Date(),
          updated_at: new Date(),
        });

      if (error) throw error;
    }

    return true;
  } catch (err) {
    console.error('Error recording bounce:', err);
    return false;
  }
}

// ============================================
// COMPLIANCE
// ============================================

export async function recordConsentForEmail(
  userId: string,
  customerId: string,
  emailAddress: string,
  consentStatus: string,
  consentMethod: string,
  regulatoryFramework?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_compliance')
      .insert({
        user_id: userId,
        customer_id: customerId,
        email_address: emailAddress,
        consent_type: 'marketing',
        consent_status: consentStatus,
        consent_date: new Date(),
        consent_method: consentMethod,
        regulatory_framework: regulatoryFramework,
        created_at: new Date(),
        updated_at: new Date(),
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error recording email consent:', err);
    return false;
  }
}

// ============================================
// PROVIDER MANAGEMENT
// ============================================

export async function getEmailProviders(userId: string): Promise<EmailProvider[]> {
  try {
    const { data, error } = await supabase
      .from('email_providers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EmailProvider[];
  } catch (err) {
    console.error('Error fetching email providers:', err);
    return [];
  }
}

export async function getActiveEmailProvider(userId: string): Promise<EmailProvider | null> {
  try {
    const { data, error } = await supabase
      .from('email_providers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as EmailProvider;
  } catch (err) {
    console.error('Error fetching active email provider:', err);
    return null;
  }
}
