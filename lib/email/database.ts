/**
 * Email Database Service
 * Handles all database operations for email queue and logging
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EmailQueueEntry {
  id?: string;
  user_id: string;
  recipient_email: string;
  recipient_name?: string;
  template_id?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  variables?: Record<string, any>;
  campaign_id?: string;
  status?: 'pending' | 'sent' | 'failed';
  retry_count?: number;
  max_retries?: number;
  scheduled_for?: Date | string;
  sent_at?: Date | string;
  error_message?: string;
  related_order_id?: string;
  related_customer_id?: string;
  metadata?: Record<string, any>;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface EmailLogEntry {
  id?: string;
  user_id: string;
  recipient_email: string;
  recipient_name?: string;
  subject?: string;
  template_type?: string;
  template_id?: string;
  campaign_id?: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  provider?: string;
  provider_id?: string;
  opened?: boolean;
  clicked?: boolean;
  opened_at?: Date | string;
  clicked_at?: Date | string;
  bounced?: boolean;
  bounced_reason?: string;
  error_message?: string;
  related_order_id?: string;
  related_customer_id?: string;
  metadata?: Record<string, any>;
  html_content?: string;
  text_content?: string;
  sent_at?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface EmailStats {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_failed: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

export class EmailDatabaseService {
  private supabase: SupabaseClient | null;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  /**
   * Create email queue entry
   */
  async createEmailQueue(entry: EmailQueueEntry): Promise<string | null> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot create email queue');
      return null;
    }

    try {
      const { data, error } = await this.supabase.rpc('create_email_queue', {
        p_user_id: entry.user_id,
        p_recipient_email: entry.recipient_email,
        p_recipient_name: entry.recipient_name || null,
        p_template_id: entry.template_id || null,
        p_subject: entry.subject || null,
        p_html_content: entry.html_content || null,
        p_text_content: entry.text_content || null,
        p_variables: entry.variables || {},
        p_campaign_id: entry.campaign_id || null,
        p_scheduled_for: entry.scheduled_for || null,
        p_related_order_id: entry.related_order_id || null,
        p_related_customer_id: entry.related_customer_id || null,
        p_metadata: entry.metadata || {},
      });

      if (error) {
        console.error('Error creating email queue:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.error('Exception creating email queue:', error);
      return null;
    }
  }

  /**
   * Update email queue status
   */
  async updateEmailQueueStatus(
    queueId: string,
    status: 'pending' | 'sent' | 'failed',
    errorMessage?: string,
    providerId?: string
  ): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot update email queue');
      return false;
    }

    try {
      const { data, error } = await this.supabase.rpc('update_email_queue_status', {
        p_queue_id: queueId,
        p_status: status,
        p_error_message: errorMessage || null,
        p_provider_id: providerId || null,
      });

      if (error) {
        console.error('Error updating email queue status:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Exception updating email queue status:', error);
      return false;
    }
  }

  /**
   * Create email log entry
   */
  async createEmailLog(entry: EmailLogEntry): Promise<string | null> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot create email log');
      return null;
    }

    try {
      const { data, error } = await this.supabase.rpc('create_email_log', {
        p_user_id: entry.user_id,
        p_recipient_email: entry.recipient_email,
        p_recipient_name: entry.recipient_name || null,
        p_subject: entry.subject || null,
        p_template_type: entry.template_type || null,
        p_template_id: entry.template_id || null,
        p_campaign_id: entry.campaign_id || null,
        p_status: entry.status,
        p_provider: entry.provider || null,
        p_provider_id: entry.provider_id || null,
        p_related_order_id: entry.related_order_id || null,
        p_related_customer_id: entry.related_customer_id || null,
        p_metadata: entry.metadata || {},
        p_html_content: entry.html_content || null,
        p_text_content: entry.text_content || null,
      });

      if (error) {
        console.error('Error creating email log:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.error('Exception creating email log:', error);
      return null;
    }
  }

  /**
   * Update email log status
   */
  async updateEmailLogStatus(
    logId: string,
    status: 'pending' | 'sent' | 'failed' | 'bounced',
    errorMessage?: string,
    bouncedReason?: string
  ): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot update email log');
      return false;
    }

    try {
      const { data, error } = await this.supabase.rpc('update_email_log_status', {
        p_log_id: logId,
        p_status: status,
        p_error_message: errorMessage || null,
        p_bounced_reason: bouncedReason || null,
      });

      if (error) {
        console.error('Error updating email log status:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Exception updating email log status:', error);
      return false;
    }
  }

  /**
   * Track email open
   */
  async trackEmailOpen(logId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot track email open');
      return false;
    }

    try {
      const { data, error } = await this.supabase.rpc('track_email_open', {
        p_log_id: logId,
      });

      if (error) {
        console.error('Error tracking email open:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Exception tracking email open:', error);
      return false;
    }
  }

  /**
   * Track email click
   */
  async trackEmailClick(logId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot track email click');
      return false;
    }

    try {
      const { data, error } = await this.supabase.rpc('track_email_click', {
        p_log_id: logId,
      });

      if (error) {
        console.error('Error tracking email click:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Exception tracking email click:', error);
      return false;
    }
  }

  /**
   * Get pending emails from queue
   */
  async getPendingEmails(limit: number = 100, maxRetries: number = 3): Promise<EmailQueueEntry[]> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot get pending emails');
      return [];
    }

    try {
      const { data, error } = await this.supabase.rpc('get_pending_emails', {
        p_limit: limit,
        p_max_retries: maxRetries,
      });

      if (error) {
        console.error('Error getting pending emails:', error);
        return [];
      }

      return (data || []) as EmailQueueEntry[];
    } catch (error) {
      console.error('Exception getting pending emails:', error);
      return [];
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<EmailStats | null> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot get email stats');
      return null;
    }

    try {
      const { data, error } = await this.supabase.rpc('get_email_stats', {
        p_user_id: userId,
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      });

      if (error) {
        console.error('Error getting email stats:', error);
        return null;
      }

      const stats = data?.[0];
      if (!stats) return null;

      return {
        total_sent: parseInt(stats.total_sent) || 0,
        total_opened: parseInt(stats.total_opened) || 0,
        total_clicked: parseInt(stats.total_clicked) || 0,
        total_bounced: parseInt(stats.total_bounced) || 0,
        total_failed: parseInt(stats.total_failed) || 0,
        open_rate: parseFloat(stats.open_rate) || 0,
        click_rate: parseFloat(stats.click_rate) || 0,
        bounce_rate: parseFloat(stats.bounce_rate) || 0,
      };
    } catch (error) {
      console.error('Exception getting email stats:', error);
      return null;
    }
  }

  /**
   * Get email log by ID
   */
  async getEmailLog(logId: string): Promise<EmailLogEntry | null> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot get email log');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('email_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (error) {
        console.error('Error getting email log:', error);
        return null;
      }

      return data as EmailLogEntry;
    } catch (error) {
      console.error('Exception getting email log:', error);
      return null;
    }
  }

  /**
   * Get email queue by ID
   */
  async getEmailQueue(queueId: string): Promise<EmailQueueEntry | null> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot get email queue');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('id', queueId)
        .single();

      if (error) {
        console.error('Error getting email queue:', error);
        return null;
      }

      return data as EmailQueueEntry;
    } catch (error) {
      console.error('Exception getting email queue:', error);
      return null;
    }
  }

  /**
   * Link queue entry to log entry
   */
  async linkQueueToLog(queueId: string, logId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Supabase not available, cannot link queue to log');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('email_queue')
        .update({ log_id: logId })
        .eq('id', queueId);

      if (error) {
        console.error('Error linking queue to log:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception linking queue to log:', error);
      return false;
    }
  }
}

// Singleton instance
let emailDatabaseServiceInstance: EmailDatabaseService | null = null;

export function getEmailDatabaseService(): EmailDatabaseService {
  if (!emailDatabaseServiceInstance) {
    emailDatabaseServiceInstance = new EmailDatabaseService();
  }
  return emailDatabaseServiceInstance;
}
