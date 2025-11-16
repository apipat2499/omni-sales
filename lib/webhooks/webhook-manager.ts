import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  Webhook,
  WebhookEvent,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookStats,
  WebhookDeliverySummary,
  WebhookEventType,
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Webhook Manager
 * Handles CRUD operations for webhooks
 */
export class WebhookManager {
  /**
   * Generate a secure random secret for webhook signing
   */
  static generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new webhook
   */
  static async createWebhook(
    data: CreateWebhookRequest,
    userId?: string,
    tenantId?: string
  ): Promise<Webhook> {
    const secret = this.generateSecret();

    const webhookData = {
      name: data.name,
      description: data.description,
      url: data.url,
      secret,
      events: data.events,
      headers: data.headers || {},
      is_active: true,
      retry_enabled: data.retry_enabled !== false,
      max_retries: data.max_retries || 3,
      timeout_seconds: data.timeout_seconds || 30,
      api_key: data.api_key,
      ip_whitelist: data.ip_whitelist,
      created_by: userId,
      tenant_id: tenantId,
    };

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert(webhookData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create webhook: ${error.message}`);
    }

    return webhook as Webhook;
  }

  /**
   * Get all webhooks (optionally filtered by tenant)
   */
  static async getWebhooks(tenantId?: string): Promise<Webhook[]> {
    let query = supabase.from('webhooks').select('*').order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get webhooks: ${error.message}`);
    }

    return data as Webhook[];
  }

  /**
   * Get a single webhook by ID
   */
  static async getWebhook(id: string, tenantId?: string): Promise<Webhook | null> {
    let query = supabase.from('webhooks').select('*').eq('id', id);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get webhook: ${error.message}`);
    }

    return data as Webhook;
  }

  /**
   * Update a webhook
   */
  static async updateWebhook(
    id: string,
    data: UpdateWebhookRequest,
    tenantId?: string
  ): Promise<Webhook> {
    let query = supabase.from('webhooks').update(data).eq('id', id);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: webhook, error } = await query.select().single();

    if (error) {
      throw new Error(`Failed to update webhook: ${error.message}`);
    }

    return webhook as Webhook;
  }

  /**
   * Delete a webhook
   */
  static async deleteWebhook(id: string, tenantId?: string): Promise<void> {
    let query = supabase.from('webhooks').delete().eq('id', id);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  /**
   * Activate or deactivate a webhook
   */
  static async setWebhookActive(
    id: string,
    isActive: boolean,
    tenantId?: string
  ): Promise<Webhook> {
    return this.updateWebhook(id, { is_active: isActive }, tenantId);
  }

  /**
   * Get webhooks subscribed to a specific event
   */
  static async getWebhooksByEvent(
    eventType: WebhookEventType,
    tenantId?: string
  ): Promise<Webhook[]> {
    let query = supabase
      .from('webhooks')
      .select('*')
      .contains('events', [eventType])
      .eq('is_active', true);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get webhooks by event: ${error.message}`);
    }

    return data as Webhook[];
  }

  /**
   * Get webhook statistics
   */
  static async getWebhookStats(webhookId: string): Promise<WebhookStats> {
    const { data, error } = await supabase.rpc('get_webhook_stats', {
      webhook_uuid: webhookId,
    });

    if (error) {
      throw new Error(`Failed to get webhook stats: ${error.message}`);
    }

    return data[0] as WebhookStats;
  }

  /**
   * Get webhook delivery summary
   */
  static async getWebhookDeliverySummary(tenantId?: string): Promise<WebhookDeliverySummary[]> {
    let query = supabase.from('webhook_delivery_summary').select('*');

    if (tenantId) {
      // Note: You may need to add tenant_id to the view if using multi-tenancy
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get webhook delivery summary: ${error.message}`);
    }

    return data as WebhookDeliverySummary[];
  }

  /**
   * Get webhook events
   */
  static async getWebhookEvents(
    webhookId?: string,
    eventType?: WebhookEventType,
    limit: number = 100,
    offset: number = 0
  ): Promise<WebhookEvent[]> {
    let query = supabase
      .from('webhook_events')
      .select('*')
      .order('triggered_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get webhook events: ${error.message}`);
    }

    return data as WebhookEvent[];
  }

  /**
   * Get delivery logs for a webhook
   */
  static async getWebhookDeliveryLogs(
    webhookId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select(
        `
        *,
        webhook:webhooks(name, url),
        event:webhook_events(event_type, event_data, triggered_at)
      `
      )
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get delivery logs: ${error.message}`);
    }

    return data;
  }

  /**
   * Get failed deliveries for a webhook
   */
  static async getFailedDeliveries(webhookId: string) {
    const { data, error } = await supabase
      .from('webhook_failures')
      .select(
        `
        *,
        webhook:webhooks(name, url),
        event:webhook_events(event_type, event_data, triggered_at),
        delivery:webhook_deliveries(status, error_message, attempt_number)
      `
      )
      .eq('webhook_id', webhookId)
      .eq('can_replay', true)
      .is('replayed_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get failed deliveries: ${error.message}`);
    }

    return data;
  }

  /**
   * Clean up old webhook events (retention policy)
   */
  static async cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_old_webhook_events', {
      days_to_keep: daysToKeep,
    });

    if (error) {
      throw new Error(`Failed to cleanup old events: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Update webhook last triggered timestamp
   */
  static async updateLastTriggered(webhookId: string): Promise<void> {
    const { error } = await supabase
      .from('webhooks')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', webhookId);

    if (error) {
      throw new Error(`Failed to update last triggered: ${error.message}`);
    }
  }
}

export default WebhookManager;
