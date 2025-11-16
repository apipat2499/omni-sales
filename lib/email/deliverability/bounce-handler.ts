import { createClient } from '@supabase/supabase-js';

export type BounceType = 'hard' | 'soft' | 'complaint';

export interface BounceEvent {
  messageId: string;
  email: string;
  bounceType: BounceType;
  bounceReason?: string;
  timestamp: string;
}

export class BounceHandler {
  private supabase: any;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  /**
   * Handle bounce notification
   */
  async handleBounce(event: BounceEvent): Promise<void> {
    if (!this.supabase) return;

    try {
      console.log(`Handling ${event.bounceType} bounce for ${event.email}`);

      // Update email log
      await this.supabase
        .from('email_logs')
        .update({
          status: 'bounced',
          bounce_type: event.bounceType,
          bounce_reason: event.bounceReason,
          bounced_at: event.timestamp,
        })
        .eq('message_id', event.messageId);

      // Handle based on bounce type
      if (event.bounceType === 'hard') {
        await this.handleHardBounce(event.email);
      } else if (event.bounceType === 'soft') {
        await this.handleSoftBounce(event.email);
      } else if (event.bounceType === 'complaint') {
        await this.handleComplaint(event.email);
      }

      // Record bounce in analytics
      await this.recordBounceAnalytics(event);
    } catch (error) {
      console.error('Error handling bounce:', error);
    }
  }

  /**
   * Handle hard bounce - permanently invalid email
   */
  private async handleHardBounce(email: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Mark email as bounced
      await this.supabase
        .from('customers')
        .update({
          email_status: 'bounced',
          email_subscribed: false,
          bounced_at: new Date().toISOString(),
        })
        .eq('email', email);

      console.log(`Hard bounce processed for ${email} - email marked as bounced`);
    } catch (error) {
      console.error('Error handling hard bounce:', error);
    }
  }

  /**
   * Handle soft bounce - temporary issue
   */
  private async handleSoftBounce(email: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Get current bounce count
      const { data: customer } = await this.supabase
        .from('customers')
        .select('soft_bounce_count')
        .eq('email', email)
        .single();

      const bounceCount = (customer?.soft_bounce_count || 0) + 1;

      // If soft bounces exceed threshold, treat as hard bounce
      if (bounceCount >= 5) {
        await this.handleHardBounce(email);
        console.log(
          `Soft bounce threshold exceeded for ${email} - converting to hard bounce`
        );
      } else {
        // Increment soft bounce count
        await this.supabase
          .from('customers')
          .update({
            soft_bounce_count: bounceCount,
            last_soft_bounce_at: new Date().toISOString(),
          })
          .eq('email', email);

        console.log(`Soft bounce ${bounceCount}/5 recorded for ${email}`);
      }
    } catch (error) {
      console.error('Error handling soft bounce:', error);
    }
  }

  /**
   * Handle complaint (spam report)
   */
  private async handleComplaint(email: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Unsubscribe and mark as complained
      await this.supabase
        .from('customers')
        .update({
          email_status: 'complained',
          email_subscribed: false,
          complained_at: new Date().toISOString(),
        })
        .eq('email', email);

      console.log(`Complaint processed for ${email} - unsubscribed and marked`);
    } catch (error) {
      console.error('Error handling complaint:', error);
    }
  }

  /**
   * Record bounce in analytics
   */
  private async recordBounceAnalytics(event: BounceEvent): Promise<void> {
    if (!this.supabase) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get or create analytics record for today
      const { data: existing } = await this.supabase
        .from('email_analytics')
        .select('*')
        .eq('analytics_date', today)
        .single();

      if (existing) {
        // Update existing record
        const bounceCount = (existing.bounce_count || 0) + 1;
        const hardBounceCount =
          event.bounceType === 'hard'
            ? (existing.hard_bounce_count || 0) + 1
            : existing.hard_bounce_count || 0;
        const softBounceCount =
          event.bounceType === 'soft'
            ? (existing.soft_bounce_count || 0) + 1
            : existing.soft_bounce_count || 0;
        const complaintCount =
          event.bounceType === 'complaint'
            ? (existing.complaint_count || 0) + 1
            : existing.complaint_count || 0;

        await this.supabase
          .from('email_analytics')
          .update({
            bounce_count: bounceCount,
            hard_bounce_count: hardBounceCount,
            soft_bounce_count: softBounceCount,
            complaint_count: complaintCount,
          })
          .eq('id', existing.id);
      } else {
        // Create new record
        await this.supabase.from('email_analytics').insert([
          {
            analytics_date: today,
            bounce_count: 1,
            hard_bounce_count: event.bounceType === 'hard' ? 1 : 0,
            soft_bounce_count: event.bounceType === 'soft' ? 1 : 0,
            complaint_count: event.bounceType === 'complaint' ? 1 : 0,
          },
        ]);
      }
    } catch (error) {
      console.error('Error recording bounce analytics:', error);
    }
  }

  /**
   * Get bounce rate for an email address
   */
  async getBounceRate(email: string): Promise<number> {
    if (!this.supabase) return 0;

    try {
      const { count: totalSent } = await this.supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_email', email);

      const { count: bounced } = await this.supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_email', email)
        .eq('status', 'bounced');

      if (!totalSent || totalSent === 0) return 0;

      return ((bounced || 0) / totalSent) * 100;
    } catch (error) {
      console.error('Error getting bounce rate:', error);
      return 0;
    }
  }

  /**
   * Check if email is safe to send to
   */
  async isSafeToSend(email: string): Promise<boolean> {
    if (!this.supabase) return true;

    try {
      const { data: customer } = await this.supabase
        .from('customers')
        .select('email_status, email_subscribed')
        .eq('email', email)
        .single();

      if (!customer) return true;

      // Don't send to bounced, complained, or unsubscribed emails
      if (!customer.email_subscribed) return false;
      if (customer.email_status === 'bounced') return false;
      if (customer.email_status === 'complained') return false;

      return true;
    } catch (error) {
      console.error('Error checking email safety:', error);
      return true; // Fail open
    }
  }
}

// Singleton instance
let bounceHandlerInstance: BounceHandler | null = null;

export function getBounceHandler(): BounceHandler {
  if (!bounceHandlerInstance) {
    bounceHandlerInstance = new BounceHandler();
  }
  return bounceHandlerInstance;
}
