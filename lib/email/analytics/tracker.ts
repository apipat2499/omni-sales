import { createClient } from '@supabase/supabase-js';

export interface EmailAnalytics {
  id?: string;
  campaign_id?: string;
  user_id?: string;
  analytics_date: string;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  emails_complained: number;
  emails_unsubscribed: number;
  unique_opens: number;
  unique_clicks: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  conversion_count?: number;
  conversion_rate?: number;
  revenue_generated?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TrackingEvent {
  messageId: string;
  email: string;
  event: 'open' | 'click' | 'bounce' | 'complaint' | 'unsubscribe' | 'delivered';
  url?: string; // for click events
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

export class EmailAnalyticsTracker {
  private supabase: any;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  /**
   * Track email event (open, click, etc.)
   */
  async trackEvent(event: TrackingEvent): Promise<void> {
    if (!this.supabase) return;

    try {
      // Get email log
      const { data: emailLog } = await this.supabase
        .from('email_logs')
        .select('*')
        .eq('message_id', event.messageId)
        .single();

      if (!emailLog) {
        console.warn(`Email log not found for message ID: ${event.messageId}`);
        return;
      }

      // Record tracking event
      await this.supabase.from('email_tracking_events').insert([
        {
          email_log_id: emailLog.id,
          campaign_id: emailLog.campaign_id,
          recipient_id: emailLog.recipient_id,
          event_type: event.event,
          url: event.url,
          user_agent: event.userAgent,
          ip_address: event.ipAddress,
          event_timestamp: event.timestamp,
        },
      ]);

      // Update email log
      const updates: any = {};
      if (event.event === 'open') {
        updates.opened_at = event.timestamp;
        updates.open_count = (emailLog.open_count || 0) + 1;
      } else if (event.event === 'click') {
        updates.clicked_at = event.timestamp;
        updates.click_count = (emailLog.click_count || 0) + 1;
      } else if (event.event === 'delivered') {
        updates.delivered_at = event.timestamp;
        updates.status = 'delivered';
      }

      if (Object.keys(updates).length > 0) {
        await this.supabase
          .from('email_logs')
          .update(updates)
          .eq('id', emailLog.id);
      }

      // Update daily analytics
      await this.updateDailyAnalytics(emailLog.campaign_id, event);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Update daily analytics
   */
  private async updateDailyAnalytics(
    campaignId: string,
    event: TrackingEvent
  ): Promise<void> {
    if (!this.supabase) return;

    try {
      const today = new Date(event.timestamp).toISOString().split('T')[0];

      // Get or create analytics record
      const { data: existing } = await this.supabase
        .from('email_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('analytics_date', today)
        .single();

      if (existing) {
        // Update existing record
        const updates: any = {};

        if (event.event === 'open') {
          updates.emails_opened = (existing.emails_opened || 0) + 1;
        } else if (event.event === 'click') {
          updates.emails_clicked = (existing.emails_clicked || 0) + 1;
        } else if (event.event === 'delivered') {
          updates.emails_delivered = (existing.emails_delivered || 0) + 1;
        } else if (event.event === 'bounce') {
          updates.emails_bounced = (existing.emails_bounced || 0) + 1;
        } else if (event.event === 'complaint') {
          updates.emails_complained = (existing.emails_complained || 0) + 1;
        } else if (event.event === 'unsubscribe') {
          updates.emails_unsubscribed = (existing.emails_unsubscribed || 0) + 1;
        }

        await this.supabase
          .from('email_analytics')
          .update(updates)
          .eq('id', existing.id);

        // Recalculate rates
        await this.recalculateRates(existing.id);
      } else {
        // Create new record
        const newRecord: any = {
          campaign_id: campaignId,
          analytics_date: today,
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          emails_bounced: 0,
          emails_complained: 0,
          emails_unsubscribed: 0,
          unique_opens: 0,
          unique_clicks: 0,
          open_rate: 0,
          click_rate: 0,
          bounce_rate: 0,
          unsubscribe_rate: 0,
        };

        if (event.event === 'open') newRecord.emails_opened = 1;
        if (event.event === 'click') newRecord.emails_clicked = 1;
        if (event.event === 'delivered') newRecord.emails_delivered = 1;
        if (event.event === 'bounce') newRecord.emails_bounced = 1;
        if (event.event === 'complaint') newRecord.emails_complained = 1;
        if (event.event === 'unsubscribe') newRecord.emails_unsubscribed = 1;

        const { data } = await this.supabase
          .from('email_analytics')
          .insert([newRecord])
          .select()
          .single();

        if (data) {
          await this.recalculateRates(data.id);
        }
      }
    } catch (error) {
      console.error('Error updating daily analytics:', error);
    }
  }

  /**
   * Recalculate rates for analytics record
   */
  private async recalculateRates(analyticsId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data: analytics } = await this.supabase
        .from('email_analytics')
        .select('*')
        .eq('id', analyticsId)
        .single();

      if (!analytics) return;

      const sent = analytics.emails_sent || 0;
      const delivered = analytics.emails_delivered || 0;

      const rates: any = {};

      if (delivered > 0) {
        rates.open_rate = ((analytics.emails_opened || 0) / delivered) * 100;
        rates.click_rate = ((analytics.emails_clicked || 0) / delivered) * 100;
      }

      if (sent > 0) {
        rates.bounce_rate = ((analytics.emails_bounced || 0) / sent) * 100;
        rates.unsubscribe_rate = ((analytics.emails_unsubscribed || 0) / sent) * 100;
      }

      if (analytics.conversion_count && delivered > 0) {
        rates.conversion_rate = (analytics.conversion_count / delivered) * 100;
      }

      await this.supabase
        .from('email_analytics')
        .update(rates)
        .eq('id', analyticsId);
    } catch (error) {
      console.error('Error recalculating rates:', error);
    }
  }

  /**
   * Get analytics for a campaign
   */
  async getCampaignAnalytics(campaignId: string): Promise<EmailAnalytics | null> {
    if (!this.supabase) return null;

    try {
      // Aggregate all analytics for the campaign
      const { data: analytics } = await this.supabase
        .from('email_analytics')
        .select('*')
        .eq('campaign_id', campaignId);

      if (!analytics || analytics.length === 0) return null;

      // Sum up all metrics
      const totals = analytics.reduce(
        (acc, curr) => ({
          emails_sent: acc.emails_sent + (curr.emails_sent || 0),
          emails_delivered: acc.emails_delivered + (curr.emails_delivered || 0),
          emails_opened: acc.emails_opened + (curr.emails_opened || 0),
          emails_clicked: acc.emails_clicked + (curr.emails_clicked || 0),
          emails_bounced: acc.emails_bounced + (curr.emails_bounced || 0),
          emails_complained: acc.emails_complained + (curr.emails_complained || 0),
          emails_unsubscribed: acc.emails_unsubscribed + (curr.emails_unsubscribed || 0),
          conversion_count: acc.conversion_count + (curr.conversion_count || 0),
          revenue_generated: acc.revenue_generated + (curr.revenue_generated || 0),
        }),
        {
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          emails_bounced: 0,
          emails_complained: 0,
          emails_unsubscribed: 0,
          conversion_count: 0,
          revenue_generated: 0,
        }
      );

      // Calculate rates
      const delivered = totals.emails_delivered || 0;
      const sent = totals.emails_sent || 0;

      return {
        campaign_id: campaignId,
        analytics_date: new Date().toISOString().split('T')[0],
        ...totals,
        unique_opens: 0, // Would need separate calculation
        unique_clicks: 0, // Would need separate calculation
        open_rate: delivered > 0 ? (totals.emails_opened / delivered) * 100 : 0,
        click_rate: delivered > 0 ? (totals.emails_clicked / delivered) * 100 : 0,
        bounce_rate: sent > 0 ? (totals.emails_bounced / sent) * 100 : 0,
        unsubscribe_rate: sent > 0 ? (totals.emails_unsubscribed / sent) * 100 : 0,
        conversion_rate:
          delivered > 0 ? (totals.conversion_count / delivered) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      return null;
    }
  }

  /**
   * Get analytics for a date range
   */
  async getAnalyticsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<EmailAnalytics[]> {
    if (!this.supabase) return [];

    try {
      const { data } = await this.supabase
        .from('email_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('analytics_date', startDate)
        .lte('analytics_date', endDate)
        .order('analytics_date', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Error getting analytics by date range:', error);
      return [];
    }
  }

  /**
   * Generate tracking pixel URL for email opens
   */
  generateTrackingPixel(messageId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/email/track/open?mid=${messageId}`;
  }

  /**
   * Generate tracked link URL for email clicks
   */
  generateTrackedLink(messageId: string, originalUrl: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${baseUrl}/api/email/track/click?mid=${messageId}&url=${encodedUrl}`;
  }
}

// Singleton instance
let trackerInstance: EmailAnalyticsTracker | null = null;

export function getEmailAnalyticsTracker(): EmailAnalyticsTracker {
  if (!trackerInstance) {
    trackerInstance = new EmailAnalyticsTracker();
  }
  return trackerInstance;
}
