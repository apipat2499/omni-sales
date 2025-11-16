import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import {
  Webhook,
  WebhookEvent,
  WebhookDelivery,
  WebhookPayload,
  WebhookEventType,
  DeliveryStatus,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  WebhookErrorCode,
} from './types';
import { WebhookManager } from './webhook-manager';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Webhook Delivery Service
 * Handles event triggering, delivery, and retry logic
 */
export class WebhookDeliveryService {
  private retryConfig: RetryConfig;

  constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig;
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Create webhook payload with standardized format
   */
  private createPayload(event: WebhookEvent): WebhookPayload {
    return {
      id: event.id,
      event: event.event_type,
      created_at: event.triggered_at.toISOString(),
      data: event.event_data,
    };
  }

  /**
   * Calculate next retry time using exponential backoff
   */
  private calculateNextRetry(attemptNumber: number): Date {
    const delay = Math.min(
      this.retryConfig.initial_delay_ms * Math.pow(this.retryConfig.backoff_multiplier, attemptNumber - 1),
      this.retryConfig.max_delay_ms
    );

    return new Date(Date.now() + delay);
  }

  /**
   * Determine error code from response
   */
  private getErrorCode(error: any, httpStatus?: number): WebhookErrorCode {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return WebhookErrorCode.TIMEOUT;
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return WebhookErrorCode.CONNECTION_ERROR;
    }

    if (httpStatus) {
      if (httpStatus === 401 || httpStatus === 403) {
        return WebhookErrorCode.AUTHENTICATION_ERROR;
      }
      if (httpStatus === 429) {
        return WebhookErrorCode.RATE_LIMITED;
      }
      if (httpStatus >= 400 && httpStatus < 500) {
        return WebhookErrorCode.CLIENT_ERROR;
      }
      if (httpStatus >= 500) {
        return WebhookErrorCode.SERVER_ERROR;
      }
    }

    return WebhookErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhookRequest(
    webhook: Webhook,
    payload: WebhookPayload
  ): Promise<{
    status: DeliveryStatus;
    httpStatus?: number;
    responseBody?: string;
    responseHeaders?: Record<string, any>;
    error?: string;
    duration: number;
  }> {
    const startTime = Date.now();
    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(payloadString, webhook.secret);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp.toString(),
        'X-Webhook-ID': webhook.id,
        'User-Agent': 'OmniSales-Webhook/1.0',
        ...webhook.headers,
      };

      if (webhook.api_key) {
        headers['Authorization'] = `Bearer ${webhook.api_key}`;
      }

      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: webhook.timeout_seconds * 1000,
        validateStatus: () => true, // Don't throw on any status
      });

      const duration = Date.now() - startTime;
      const isSuccess = response.status >= 200 && response.status < 300;

      return {
        status: isSuccess ? 'success' : 'failed',
        httpStatus: response.status,
        responseBody: JSON.stringify(response.data),
        responseHeaders: response.headers as Record<string, any>,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError;

      let status: DeliveryStatus = 'failed';
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        status = 'timeout';
      }

      return {
        status,
        httpStatus: axiosError.response?.status,
        responseBody: axiosError.response?.data ? JSON.stringify(axiosError.response.data) : undefined,
        responseHeaders: axiosError.response?.headers as Record<string, any>,
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Record delivery attempt in database
   */
  private async recordDelivery(
    webhookId: string,
    eventId: string,
    attemptNumber: number,
    result: {
      status: DeliveryStatus;
      httpStatus?: number;
      responseBody?: string;
      responseHeaders?: Record<string, any>;
      error?: string;
      duration: number;
    }
  ): Promise<WebhookDelivery> {
    const shouldRetry =
      result.status !== 'success' && attemptNumber < this.retryConfig.max_attempts;

    const deliveryData = {
      webhook_id: webhookId,
      event_id: eventId,
      attempt_number: attemptNumber,
      status: result.status,
      http_status_code: result.httpStatus,
      response_body: result.responseBody,
      response_headers: result.responseHeaders,
      error_message: result.error,
      duration_ms: result.duration,
      next_retry_at: shouldRetry ? this.calculateNextRetry(attemptNumber).toISOString() : null,
      delivered_at: result.status === 'success' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('webhook_deliveries')
      .insert(deliveryData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record delivery: ${error.message}`);
    }

    return data as WebhookDelivery;
  }

  /**
   * Record permanent failure in dead letter queue
   */
  private async recordFailure(
    webhookId: string,
    eventId: string,
    deliveryId: string,
    attemptCount: number,
    reason: string
  ): Promise<void> {
    const failureData = {
      webhook_id: webhookId,
      event_id: eventId,
      delivery_id: deliveryId,
      failure_reason: reason,
      attempts_count: attemptCount,
      last_attempt_at: new Date().toISOString(),
      can_replay: true,
    };

    const { error } = await supabase.from('webhook_failures').insert(failureData);

    if (error) {
      console.error('Failed to record failure:', error);
    }
  }

  /**
   * Deliver webhook to a single endpoint
   */
  async deliverWebhook(webhook: Webhook, event: WebhookEvent, attemptNumber: number = 1): Promise<WebhookDelivery> {
    const payload = this.createPayload(event);
    const result = await this.sendWebhookRequest(webhook, payload);
    const delivery = await this.recordDelivery(webhook.id, event.id, attemptNumber, result);

    // If this was the last attempt and it failed, record in failures table
    if (result.status !== 'success' && attemptNumber >= this.retryConfig.max_attempts) {
      const errorCode = this.getErrorCode(result.error, result.httpStatus);
      await this.recordFailure(
        webhook.id,
        event.id,
        delivery.id,
        attemptNumber,
        `${errorCode}: ${result.error || 'HTTP ' + result.httpStatus}`
      );
    }

    // Update webhook last triggered timestamp
    await WebhookManager.updateLastTriggered(webhook.id);

    return delivery;
  }

  /**
   * Trigger an event and deliver to all subscribed webhooks
   */
  async triggerEvent(
    eventType: WebhookEventType,
    eventData: any,
    resourceId?: string,
    resourceType?: string,
    tenantId?: string
  ): Promise<{ event: WebhookEvent; deliveries: WebhookDelivery[] }> {
    // Create the event record
    const eventRecord = {
      event_type: eventType,
      event_data: eventData,
      resource_id: resourceId,
      resource_type: resourceType,
      tenant_id: tenantId,
      triggered_at: new Date().toISOString(),
    };

    const { data: event, error: eventError } = await supabase
      .from('webhook_events')
      .insert(eventRecord)
      .select()
      .single();

    if (eventError) {
      throw new Error(`Failed to create event: ${eventError.message}`);
    }

    // Get all webhooks subscribed to this event
    const webhooks = await WebhookManager.getWebhooksByEvent(eventType, tenantId);

    // Deliver to all webhooks
    const deliveries: WebhookDelivery[] = [];
    for (const webhook of webhooks) {
      try {
        const delivery = await this.deliverWebhook(webhook, event as WebhookEvent);
        deliveries.push(delivery);
      } catch (error) {
        console.error(`Failed to deliver webhook ${webhook.id}:`, error);
      }
    }

    return {
      event: event as WebhookEvent,
      deliveries,
    };
  }

  /**
   * Process retry queue - find and retry failed deliveries
   */
  async processRetryQueue(): Promise<number> {
    const now = new Date().toISOString();

    // Find deliveries that need to be retried
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select(
        `
        *,
        webhook:webhooks(*),
        event:webhook_events(*)
      `
      )
      .eq('status', 'failed')
      .not('next_retry_at', 'is', null)
      .lte('next_retry_at', now)
      .limit(100);

    if (error) {
      throw new Error(`Failed to get retry queue: ${error.message}`);
    }

    let processedCount = 0;

    for (const delivery of deliveries || []) {
      try {
        const webhook = delivery.webhook as unknown as Webhook;
        const event = delivery.event as unknown as WebhookEvent;

        if (!webhook.is_active || !webhook.retry_enabled) {
          continue;
        }

        const nextAttempt = delivery.attempt_number + 1;
        await this.deliverWebhook(webhook, event, nextAttempt);
        processedCount++;
      } catch (error) {
        console.error(`Failed to retry delivery ${delivery.id}:`, error);
      }
    }

    return processedCount;
  }

  /**
   * Replay a failed event
   */
  async replayFailedEvent(failureId: string): Promise<WebhookDelivery> {
    // Get the failure record
    const { data: failure, error: failureError } = await supabase
      .from('webhook_failures')
      .select(
        `
        *,
        webhook:webhooks(*),
        event:webhook_events(*)
      `
      )
      .eq('id', failureId)
      .single();

    if (failureError) {
      throw new Error(`Failed to get failure record: ${failureError.message}`);
    }

    const webhook = failure.webhook as unknown as Webhook;
    const event = failure.event as unknown as WebhookEvent;

    // Deliver the webhook
    const delivery = await this.deliverWebhook(webhook, event, 1);

    // Mark the failure as replayed
    await supabase
      .from('webhook_failures')
      .update({ replayed_at: new Date().toISOString() })
      .eq('id', failureId);

    return delivery;
  }

  /**
   * Send a test webhook event
   */
  async sendTestEvent(webhookId: string): Promise<WebhookDelivery> {
    const webhook = await WebhookManager.getWebhook(webhookId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testEvent: WebhookEvent = {
      id: crypto.randomUUID(),
      event_type: 'order.created',
      event_data: {
        test: true,
        message: 'This is a test webhook event',
        timestamp: new Date().toISOString(),
      },
      triggered_at: new Date(),
      created_at: new Date(),
    };

    return this.deliverWebhook(webhook, testEvent, 1);
  }
}

export default WebhookDeliveryService;
