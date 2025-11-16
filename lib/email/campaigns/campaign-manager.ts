import { createClient } from '@supabase/supabase-js';
import { getEmailProviderManager } from '../providers/provider-manager';
import { getEmailTemplateManager } from '../templates/template-manager';
import type { SendEmailParams } from '../providers/sendgrid-client';

export interface EmailCampaign {
  id?: string;
  user_id: string;
  name: string;
  template_id?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  segment_id?: string;
  segment_filters?: any; // RFM, tags, custom filters
  scheduled_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  ab_test?: ABTestConfig;
  send_from: string;
  total_recipients?: number;
  sent_count?: number;
  failed_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ABTestConfig {
  enabled: boolean;
  variant_a: {
    subject?: string;
    content?: string;
  };
  variant_b: {
    subject?: string;
    content?: string;
  };
  split_percentage: number; // 50 = 50/50 split
  winner_metric: 'open_rate' | 'click_rate' | 'conversion_rate';
}

export interface RecipientSegment {
  id: string;
  name: string;
  filters: {
    rfm_segment?: string[]; // ['champions', 'loyal_customers']
    tags?: string[];
    min_order_count?: number;
    max_order_count?: number;
    min_total_spent?: number;
    max_total_spent?: number;
    last_order_days_ago?: number;
    custom_query?: any;
  };
}

export class EmailCampaignManager {
  private supabase: any;
  private providerManager = getEmailProviderManager();
  private templateManager = getEmailTemplateManager();

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(campaign: EmailCampaign): Promise<EmailCampaign | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('email_campaigns')
        .insert([
          {
            ...campaign,
            status: campaign.status || 'draft',
            sent_count: 0,
            failed_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(id: string): Promise<EmailCampaign | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting campaign:', error);
      return null;
    }
  }

  /**
   * List campaigns for a user
   */
  async listCampaigns(userId: string, status?: string): Promise<EmailCampaign[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing campaigns:', error);
      return [];
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    id: string,
    userId: string,
    updates: Partial<EmailCampaign>
  ): Promise<EmailCampaign | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('email_campaigns')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      return null;
    }
  }

  /**
   * Schedule a campaign
   */
  async scheduleCampaign(
    id: string,
    userId: string,
    scheduledAt: string
  ): Promise<boolean> {
    const result = await this.updateCampaign(id, userId, {
      scheduled_at: scheduledAt,
      status: 'scheduled',
    });
    return result !== null;
  }

  /**
   * Get recipients for a campaign based on segment filters
   */
  async getRecipients(campaign: EmailCampaign): Promise<any[]> {
    if (!this.supabase) return [];

    try {
      // If segment_id is provided, fetch segment filters
      let filters = campaign.segment_filters;

      if (campaign.segment_id) {
        const { data: segment } = await this.supabase
          .from('email_segments')
          .select('filters')
          .eq('id', campaign.segment_id)
          .single();

        if (segment) {
          filters = segment.filters;
        }
      }

      // Build query based on filters
      let query = this.supabase.from('customers').select('id, email, name');

      if (filters) {
        // Apply RFM segment filter
        if (filters.rfm_segment && filters.rfm_segment.length > 0) {
          query = query.in('rfm_segment', filters.rfm_segment);
        }

        // Apply tags filter
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags);
        }

        // Apply order count filters
        if (filters.min_order_count !== undefined) {
          query = query.gte('order_count', filters.min_order_count);
        }
        if (filters.max_order_count !== undefined) {
          query = query.lte('order_count', filters.max_order_count);
        }

        // Apply total spent filters
        if (filters.min_total_spent !== undefined) {
          query = query.gte('total_spent', filters.min_total_spent);
        }
        if (filters.max_total_spent !== undefined) {
          query = query.lte('total_spent', filters.max_total_spent);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recipients:', error);
      return [];
    }
  }

  /**
   * Send campaign immediately
   */
  async sendCampaign(campaignId: string, userId: string): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign || campaign.user_id !== userId) {
        throw new Error('Campaign not found or unauthorized');
      }

      // Update status to sending
      await this.updateCampaign(campaignId, userId, { status: 'sending' });

      // Get recipients
      const recipients = await this.getRecipients(campaign);

      if (recipients.length === 0) {
        throw new Error('No recipients found for this campaign');
      }

      // Update total recipients
      await this.updateCampaign(campaignId, userId, {
        total_recipients: recipients.length,
      });

      // Prepare email content
      let emailContent: any;

      if (campaign.template_id) {
        // Use template
        emailContent = await this.templateManager.renderTemplate({
          templateId: campaign.template_id,
          variables: {}, // Default variables, should be customized per recipient
        });
      } else {
        // Use campaign content directly
        emailContent = {
          subject: campaign.subject,
          html: campaign.html_content,
          text: campaign.text_content,
        };
      }

      if (!emailContent) {
        throw new Error('Failed to prepare email content');
      }

      // Handle A/B testing
      if (campaign.ab_test?.enabled) {
        await this.sendABTestCampaign(campaign, recipients, emailContent);
      } else {
        await this.sendRegularCampaign(campaign, recipients, emailContent);
      }

      // Update status to sent
      await this.updateCampaign(campaignId, userId, { status: 'sent' });

      return true;
    } catch (error) {
      console.error('Error sending campaign:', error);
      await this.updateCampaign(campaignId, userId, { status: 'draft' });
      return false;
    }
  }

  /**
   * Send regular campaign (no A/B test)
   */
  private async sendRegularCampaign(
    campaign: EmailCampaign,
    recipients: any[],
    emailContent: any
  ): Promise<void> {
    let sentCount = 0;
    let failedCount = 0;

    // Send in batches to avoid overwhelming the provider
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (recipient) => {
          const params: SendEmailParams = {
            to: recipient.email,
            from: campaign.send_from,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            metadata: {
              campaign_id: campaign.id,
              recipient_id: recipient.id,
            },
          };

          const result = await this.providerManager.send(params);

          if (result.success) {
            // Log email sent
            await this.logEmail(campaign.id!, recipient.id, result);
            sentCount++;
          } else {
            failedCount++;
          }

          return result;
        })
      );

      // Update progress
      if (campaign.id) {
        await this.updateCampaign(campaign.id, campaign.user_id, {
          sent_count: sentCount,
          failed_count: failedCount,
        });
      }

      // Rate limiting - wait between batches
      if (i + batchSize < recipients.length) {
        await this.sleep(1000); // 1 second between batches
      }
    }
  }

  /**
   * Send A/B test campaign
   */
  private async sendABTestCampaign(
    campaign: EmailCampaign,
    recipients: any[],
    baseContent: any
  ): Promise<void> {
    if (!campaign.ab_test) return;

    const splitPercentage = campaign.ab_test.split_percentage;
    const splitIndex = Math.floor((recipients.length * splitPercentage) / 100);

    const variantARecipients = recipients.slice(0, splitIndex);
    const variantBRecipients = recipients.slice(splitIndex);

    // Send variant A
    await this.sendRegularCampaign(
      campaign,
      variantARecipients,
      {
        subject: campaign.ab_test.variant_a.subject || baseContent.subject,
        html: campaign.ab_test.variant_a.content || baseContent.html,
        text: baseContent.text,
      }
    );

    // Send variant B
    await this.sendRegularCampaign(
      campaign,
      variantBRecipients,
      {
        subject: campaign.ab_test.variant_b.subject || baseContent.subject,
        html: campaign.ab_test.variant_b.content || baseContent.html,
        text: baseContent.text,
      }
    );
  }

  /**
   * Log email sent
   */
  private async logEmail(
    campaignId: string,
    recipientId: string,
    result: any
  ): Promise<void> {
    if (!this.supabase) return;

    try {
      await this.supabase.from('email_logs').insert([
        {
          campaign_id: campaignId,
          recipient_id: recipientId,
          message_id: result.messageId,
          provider: result.provider,
          status: result.success ? 'sent' : 'failed',
          error: result.error,
          sent_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Handle bounce notification
   */
  async handleBounce(messageId: string, bounceType: 'hard' | 'soft'): Promise<void> {
    if (!this.supabase) return;

    try {
      // Update email log
      await this.supabase
        .from('email_logs')
        .update({
          status: 'bounced',
          bounce_type: bounceType,
          bounced_at: new Date().toISOString(),
        })
        .eq('message_id', messageId);

      // If hard bounce, update recipient status
      if (bounceType === 'hard') {
        const { data: log } = await this.supabase
          .from('email_logs')
          .select('recipient_id')
          .eq('message_id', messageId)
          .single();

        if (log) {
          await this.supabase
            .from('customers')
            .update({ email_status: 'bounced' })
            .eq('id', log.recipient_id);
        }
      }
    } catch (error) {
      console.error('Error handling bounce:', error);
    }
  }

  /**
   * Handle unsubscribe
   */
  async handleUnsubscribe(recipientId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      await this.supabase
        .from('customers')
        .update({
          email_subscribed: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('id', recipientId);
    } catch (error) {
      console.error('Error handling unsubscribe:', error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let campaignManagerInstance: EmailCampaignManager | null = null;

export function getEmailCampaignManager(): EmailCampaignManager {
  if (!campaignManagerInstance) {
    campaignManagerInstance = new EmailCampaignManager();
  }
  return campaignManagerInstance;
}
