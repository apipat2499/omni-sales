/**
 * Workflow Analytics Tracker
 * Track and analyze workflow performance metrics
 */

import { createClient } from '@/lib/supabase/server';

export interface WorkflowMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_execution_time: string;
  emails_sent: number;
  email_open_rate: number;
  email_click_rate: number;
  conversion_rate: number;
  total_revenue: number;
}

export interface AnalyticsEvent {
  workflow_id: string;
  execution_id?: string;
  event_type: 'email_sent' | 'email_delivered' | 'email_opened' | 'email_clicked' |
                'email_bounced' | 'email_complained' | 'sms_sent' | 'sms_delivered' |
                'sms_failed' | 'conversion' | 'revenue';
  email_id?: string;
  recipient_email?: string;
  order_id?: string;
  revenue_amount?: number;
  currency?: string;
  metadata?: any;
}

/**
 * Workflow Analytics Class
 */
export class WorkflowAnalytics {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await this.supabase.from('workflow_analytics').insert({
        workflow_id: event.workflow_id,
        execution_id: event.execution_id,
        event_type: event.event_type,
        event_timestamp: new Date().toISOString(),
        email_id: event.email_id,
        recipient_email: event.recipient_email,
        order_id: event.order_id,
        revenue_amount: event.revenue_amount,
        currency: event.currency || 'THB',
        metadata: event.metadata || {},
      });

      if (error) {
        console.error('Failed to track analytics event:', error);
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(
    workflowId: string,
    days: number = 30
  ): Promise<WorkflowMetrics | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_workflow_metrics', {
        p_workflow_id: workflowId,
        p_days: days,
      });

      if (error) {
        console.error('Failed to get workflow metrics:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting workflow metrics:', error);
      return null;
    }
  }

  /**
   * Get workflow performance over time
   */
  async getWorkflowPerformance(
    workflowId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<any[]> {
    try {
      const groupByFormat =
        groupBy === 'day'
          ? 'YYYY-MM-DD'
          : groupBy === 'week'
          ? 'YYYY-WW'
          : 'YYYY-MM';

      const { data, error } = await this.supabase
        .from('workflow_executions')
        .select(
          `
          id,
          status,
          started_at,
          completed_at,
          emails_sent,
          sms_sent
        `
        )
        .eq('workflow_id', workflowId)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())
        .order('started_at', { ascending: true });

      if (error) {
        console.error('Failed to get workflow performance:', error);
        return [];
      }

      // Group by date
      const grouped: any = {};
      data?.forEach((execution: any) => {
        const date = new Date(execution.started_at);
        let key: string;

        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!grouped[key]) {
          grouped[key] = {
            date: key,
            total: 0,
            completed: 0,
            failed: 0,
            emails_sent: 0,
            sms_sent: 0,
          };
        }

        grouped[key].total++;
        if (execution.status === 'completed') grouped[key].completed++;
        if (execution.status === 'failed') grouped[key].failed++;
        grouped[key].emails_sent += execution.emails_sent || 0;
        grouped[key].sms_sent += execution.sms_sent || 0;
      });

      return Object.values(grouped);
    } catch (error) {
      console.error('Error getting workflow performance:', error);
      return [];
    }
  }

  /**
   * Get email engagement metrics
   */
  async getEmailEngagement(
    workflowId: string,
    days: number = 30
  ): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('workflow_analytics')
        .select('event_type')
        .eq('workflow_id', workflowId)
        .gte('event_timestamp', startDate.toISOString())
        .in('event_type', [
          'email_sent',
          'email_delivered',
          'email_opened',
          'email_clicked',
          'email_bounced',
          'email_complained',
        ]);

      if (error) {
        console.error('Failed to get email engagement:', error);
        return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
      }

      const counts = {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
      };

      data?.forEach((event: any) => {
        switch (event.event_type) {
          case 'email_sent':
            counts.sent++;
            break;
          case 'email_delivered':
            counts.delivered++;
            break;
          case 'email_opened':
            counts.opened++;
            break;
          case 'email_clicked':
            counts.clicked++;
            break;
          case 'email_bounced':
            counts.bounced++;
            break;
          case 'email_complained':
            counts.complained++;
            break;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting email engagement:', error);
      return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
    }
  }

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(
    workflowId: string,
    days: number = 30
  ): Promise<{
    triggered: number;
    email_sent: number;
    email_opened: number;
    email_clicked: number;
    converted: number;
    revenue: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get execution count
      const { data: executions } = await this.supabase
        .from('workflow_executions')
        .select('id', { count: 'exact' })
        .eq('workflow_id', workflowId)
        .gte('started_at', startDate.toISOString());

      // Get analytics events
      const { data: analytics } = await this.supabase
        .from('workflow_analytics')
        .select('event_type, revenue_amount')
        .eq('workflow_id', workflowId)
        .gte('event_timestamp', startDate.toISOString());

      const funnel = {
        triggered: executions?.length || 0,
        email_sent: 0,
        email_opened: 0,
        email_clicked: 0,
        converted: 0,
        revenue: 0,
      };

      analytics?.forEach((event: any) => {
        switch (event.event_type) {
          case 'email_sent':
            funnel.email_sent++;
            break;
          case 'email_opened':
            funnel.email_opened++;
            break;
          case 'email_clicked':
            funnel.email_clicked++;
            break;
          case 'conversion':
            funnel.converted++;
            break;
          case 'revenue':
            funnel.revenue += event.revenue_amount || 0;
            break;
        }
      });

      return funnel;
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      return {
        triggered: 0,
        email_sent: 0,
        email_opened: 0,
        email_clicked: 0,
        converted: 0,
        revenue: 0,
      };
    }
  }

  /**
   * Get top performing workflows
   */
  async getTopPerformingWorkflows(
    limit: number = 10,
    days: number = 30
  ): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('email_workflows')
        .select(
          `
          id,
          name,
          status,
          total_executions,
          successful_executions,
          failed_executions
        `
        )
        .eq('status', 'active')
        .order('successful_executions', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get top performing workflows:', error);
        return [];
      }

      // Enrich with analytics
      const enriched = await Promise.all(
        (data || []).map(async (workflow: any) => {
          const metrics = await this.getWorkflowMetrics(workflow.id, days);
          return {
            ...workflow,
            metrics,
          };
        })
      );

      return enriched;
    } catch (error) {
      console.error('Error getting top performing workflows:', error);
      return [];
    }
  }

  /**
   * Get workflow execution history
   */
  async getExecutionHistory(
    workflowId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    executions: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await this.supabase
        .from('workflow_executions')
        .select(
          `
          *,
          workflow_triggers(trigger_type),
          workflow_step_executions(count)
        `,
          { count: 'exact' }
        )
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get execution history:', error);
        return { executions: [], total: 0, page, totalPages: 0 };
      }

      return {
        executions: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error getting execution history:', error);
      return { executions: [], total: 0, page, totalPages: 0 };
    }
  }

  /**
   * Calculate A/B test results
   */
  async compareWorkflows(
    workflowIdA: string,
    workflowIdB: string,
    days: number = 30
  ): Promise<{
    workflowA: any;
    workflowB: any;
    winner?: 'A' | 'B';
    improvement?: number;
  }> {
    try {
      const [metricsA, metricsB] = await Promise.all([
        this.getWorkflowMetrics(workflowIdA, days),
        this.getWorkflowMetrics(workflowIdB, days),
      ]);

      if (!metricsA || !metricsB) {
        return { workflowA: metricsA, workflowB: metricsB };
      }

      // Compare conversion rates
      const conversionA = metricsA.conversion_rate;
      const conversionB = metricsB.conversion_rate;

      let winner: 'A' | 'B' | undefined;
      let improvement: number | undefined;

      if (conversionA > conversionB) {
        winner = 'A';
        improvement = ((conversionA - conversionB) / conversionB) * 100;
      } else if (conversionB > conversionA) {
        winner = 'B';
        improvement = ((conversionB - conversionA) / conversionA) * 100;
      }

      return {
        workflowA: metricsA,
        workflowB: metricsB,
        winner,
        improvement,
      };
    } catch (error) {
      console.error('Error comparing workflows:', error);
      return { workflowA: null, workflowB: null };
    }
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}

/**
 * Helper functions for tracking common events
 */

export async function trackEmailSent(
  workflowId: string,
  executionId: string,
  emailId: string,
  recipientEmail: string
): Promise<void> {
  const analytics = new WorkflowAnalytics();
  await analytics.trackEvent({
    workflow_id: workflowId,
    execution_id: executionId,
    event_type: 'email_sent',
    email_id: emailId,
    recipient_email: recipientEmail,
  });
}

export async function trackEmailOpened(
  workflowId: string,
  executionId: string,
  emailId: string
): Promise<void> {
  const analytics = new WorkflowAnalytics();
  await analytics.trackEvent({
    workflow_id: workflowId,
    execution_id: executionId,
    event_type: 'email_opened',
    email_id: emailId,
  });
}

export async function trackEmailClicked(
  workflowId: string,
  executionId: string,
  emailId: string
): Promise<void> {
  const analytics = new WorkflowAnalytics();
  await analytics.trackEvent({
    workflow_id: workflowId,
    execution_id: executionId,
    event_type: 'email_clicked',
    email_id: emailId,
  });
}

export async function trackConversion(
  workflowId: string,
  executionId: string,
  orderId: string,
  revenueAmount: number,
  currency: string = 'THB'
): Promise<void> {
  const analytics = new WorkflowAnalytics();

  // Track conversion event
  await analytics.trackEvent({
    workflow_id: workflowId,
    execution_id: executionId,
    event_type: 'conversion',
    order_id: orderId,
  });

  // Track revenue event
  await analytics.trackEvent({
    workflow_id: workflowId,
    execution_id: executionId,
    event_type: 'revenue',
    order_id: orderId,
    revenue_amount: revenueAmount,
    currency,
  });
}

export async function trackSMSSent(
  workflowId: string,
  executionId: string,
  recipientPhone: string
): Promise<void> {
  const analytics = new WorkflowAnalytics();
  await analytics.trackEvent({
    workflow_id: workflowId,
    execution_id: executionId,
    event_type: 'sms_sent',
    metadata: { recipient_phone: recipientPhone },
  });
}
