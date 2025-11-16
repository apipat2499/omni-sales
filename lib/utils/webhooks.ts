/**
 * Webhook integration system utilities
 */

import crypto from 'crypto';

export type WebhookEventType =
  | 'onCreate'
  | 'onUpdate'
  | 'onDelete'
  | 'onBulkOperation'
  | 'onStatusChange'
  | 'onPayment'
  | 'onInventoryChange';

export type WebhookStatus = 'pending' | 'success' | 'failed' | 'retrying';
export type WebhookMethod = 'POST' | 'PUT' | 'PATCH';

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: WebhookMethod;
  events: WebhookEventType[];
  headers?: Record<string, string>;
  secret?: string;
  enabled: boolean;
  retryConfig: {
    maxRetries: number;
    retryDelay: number; // milliseconds
    backoffMultiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook delivery log
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhookName: string;
  eventType: WebhookEventType;
  url: string;
  method: WebhookMethod;
  payload: any;
  status: WebhookStatus;
  statusCode?: number;
  response?: string;
  error?: string;
  attempts: number;
  nextRetryAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Webhook event payload
 */
export interface WebhookEventPayload<T = any> {
  event: WebhookEventType;
  timestamp: string;
  data: T;
  metadata?: Record<string, any>;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
};

/**
 * Generate webhook ID
 */
function generateWebhookId(): string {
  return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate delivery ID
 */
function generateDeliveryId(): string {
  return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all webhooks
 */
export function getAllWebhooks(): WebhookConfig[] {
  try {
    const stored = localStorage.getItem('webhooks');
    if (!stored) return [];

    const webhooks = JSON.parse(stored) as WebhookConfig[];
    return webhooks.map((w) => ({
      ...w,
      createdAt: new Date(w.createdAt),
      updatedAt: new Date(w.updatedAt),
    }));
  } catch (err) {
    console.error('Failed to load webhooks:', err);
    return [];
  }
}

/**
 * Get webhook by ID
 */
export function getWebhookById(id: string): WebhookConfig | null {
  const webhooks = getAllWebhooks();
  return webhooks.find((w) => w.id === id) || null;
}

/**
 * Get enabled webhooks
 */
export function getEnabledWebhooks(): WebhookConfig[] {
  return getAllWebhooks().filter((w) => w.enabled);
}

/**
 * Get webhooks by event type
 */
export function getWebhooksByEvent(eventType: WebhookEventType): WebhookConfig[] {
  return getEnabledWebhooks().filter((w) => w.events.includes(eventType));
}

/**
 * Create webhook
 */
export function createWebhook(
  config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>
): WebhookConfig {
  const webhook: WebhookConfig = {
    ...config,
    id: generateWebhookId(),
    retryConfig: config.retryConfig || DEFAULT_RETRY_CONFIG,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const webhooks = getAllWebhooks();
  webhooks.push(webhook);
  localStorage.setItem('webhooks', JSON.stringify(webhooks));

  return webhook;
}

/**
 * Update webhook
 */
export function updateWebhook(
  id: string,
  updates: Partial<Omit<WebhookConfig, 'id' | 'createdAt'>>
): WebhookConfig | null {
  const webhooks = getAllWebhooks();
  const index = webhooks.findIndex((w) => w.id === id);

  if (index === -1) return null;

  const updated: WebhookConfig = {
    ...webhooks[index],
    ...updates,
    updatedAt: new Date(),
  };

  webhooks[index] = updated;
  localStorage.setItem('webhooks', JSON.stringify(webhooks));

  return updated;
}

/**
 * Delete webhook
 */
export function deleteWebhook(id: string): boolean {
  const webhooks = getAllWebhooks();
  const filtered = webhooks.filter((w) => w.id !== id);

  if (filtered.length === webhooks.length) return false;

  localStorage.setItem('webhooks', JSON.stringify(filtered));

  // Also clean up related deliveries
  const deliveries = getAllDeliveries();
  const filteredDeliveries = deliveries.filter((d) => d.webhookId !== id);
  localStorage.setItem('webhook_deliveries', JSON.stringify(filteredDeliveries));

  return true;
}

/**
 * Toggle webhook enabled state
 */
export function toggleWebhook(id: string): WebhookConfig | null {
  const webhook = getWebhookById(id);
  if (!webhook) return null;

  return updateWebhook(id, { enabled: !webhook.enabled });
}

/**
 * Get all webhook deliveries
 */
export function getAllDeliveries(): WebhookDelivery[] {
  try {
    const stored = localStorage.getItem('webhook_deliveries');
    if (!stored) return [];

    const deliveries = JSON.parse(stored) as WebhookDelivery[];
    return deliveries.map((d) => ({
      ...d,
      createdAt: new Date(d.createdAt),
      completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
      nextRetryAt: d.nextRetryAt ? new Date(d.nextRetryAt) : undefined,
    }));
  } catch (err) {
    console.error('Failed to load deliveries:', err);
    return [];
  }
}

/**
 * Get deliveries by webhook ID
 */
export function getDeliveriesByWebhook(webhookId: string): WebhookDelivery[] {
  return getAllDeliveries()
    .filter((d) => d.webhookId === webhookId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get recent deliveries
 */
export function getRecentDeliveries(limit: number = 50): WebhookDelivery[] {
  return getAllDeliveries()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Get failed deliveries
 */
export function getFailedDeliveries(): WebhookDelivery[] {
  return getAllDeliveries().filter((d) => d.status === 'failed');
}

/**
 * Get pending retries
 */
export function getPendingRetries(): WebhookDelivery[] {
  const now = new Date();
  return getAllDeliveries().filter(
    (d) => d.status === 'retrying' && d.nextRetryAt && d.nextRetryAt <= now
  );
}

/**
 * Save delivery
 */
function saveDelivery(delivery: WebhookDelivery): void {
  const deliveries = getAllDeliveries();
  const index = deliveries.findIndex((d) => d.id === delivery.id);

  if (index >= 0) {
    deliveries[index] = delivery;
  } else {
    deliveries.push(delivery);
  }

  // Keep last 1000 deliveries
  if (deliveries.length > 1000) {
    deliveries.shift();
  }

  localStorage.setItem('webhook_deliveries', JSON.stringify(deliveries));
}

/**
 * Clear old deliveries
 */
export function clearOldDeliveries(daysToKeep: number = 30): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deliveries = getAllDeliveries();
  const filtered = deliveries.filter((d) => d.createdAt > cutoffDate);

  const removedCount = deliveries.length - filtered.length;

  if (removedCount > 0) {
    localStorage.setItem('webhook_deliveries', JSON.stringify(filtered));
  }

  return removedCount;
}

/**
 * Generate webhook signature
 */
export function generateSignature(payload: string, secret: string): string {
  if (typeof window !== 'undefined') {
    // Browser environment - use Web Crypto API
    return btoa(payload + secret); // Simple encoding for browser
  } else {
    // Node environment
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}

/**
 * Verify webhook signature
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return signature === expectedSignature;
}

/**
 * Trigger webhook
 */
export async function triggerWebhook<T = any>(
  webhook: WebhookConfig,
  eventType: WebhookEventType,
  data: T,
  metadata?: Record<string, any>
): Promise<WebhookDelivery> {
  const payload: WebhookEventPayload<T> = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
    metadata,
  };

  const delivery: WebhookDelivery = {
    id: generateDeliveryId(),
    webhookId: webhook.id,
    webhookName: webhook.name,
    eventType,
    url: webhook.url,
    method: webhook.method,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: new Date(),
  };

  saveDelivery(delivery);

  // Execute delivery
  await executeDelivery(delivery, webhook);

  return delivery;
}

/**
 * Execute webhook delivery
 */
async function executeDelivery(
  delivery: WebhookDelivery,
  webhook: WebhookConfig
): Promise<void> {
  delivery.attempts++;
  delivery.status = 'pending';
  saveDelivery(delivery);

  try {
    const payloadString = JSON.stringify(delivery.payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Omni-Sales-Webhook/1.0',
      'X-Webhook-Event': delivery.eventType,
      'X-Webhook-Delivery': delivery.id,
      'X-Webhook-Timestamp': new Date().toISOString(),
      ...webhook.headers,
    };

    // Add signature if secret is configured
    if (webhook.secret) {
      headers['X-Webhook-Signature'] = generateSignature(payloadString, webhook.secret);
    }

    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: payloadString,
    });

    delivery.statusCode = response.status;
    delivery.response = await response.text().catch(() => '');

    if (response.ok) {
      delivery.status = 'success';
      delivery.completedAt = new Date();
    } else {
      throw new Error(`HTTP ${response.status}: ${delivery.response}`);
    }
  } catch (err) {
    delivery.error = err instanceof Error ? err.message : String(err);

    // Determine if we should retry
    if (delivery.attempts < webhook.retryConfig.maxRetries) {
      delivery.status = 'retrying';
      const delay =
        webhook.retryConfig.retryDelay *
        Math.pow(webhook.retryConfig.backoffMultiplier, delivery.attempts - 1);
      delivery.nextRetryAt = new Date(Date.now() + delay);
    } else {
      delivery.status = 'failed';
      delivery.completedAt = new Date();
    }
  }

  saveDelivery(delivery);
}

/**
 * Retry failed delivery
 */
export async function retryDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
  const delivery = getAllDeliveries().find((d) => d.id === deliveryId);
  if (!delivery) return null;

  const webhook = getWebhookById(delivery.webhookId);
  if (!webhook) return null;

  await executeDelivery(delivery, webhook);
  return delivery;
}

/**
 * Process pending retries
 */
export async function processPendingRetries(): Promise<number> {
  const pending = getPendingRetries();
  let processed = 0;

  for (const delivery of pending) {
    const webhook = getWebhookById(delivery.webhookId);
    if (webhook && webhook.enabled) {
      await executeDelivery(delivery, webhook);
      processed++;
    }
  }

  return processed;
}

/**
 * Trigger webhooks for event
 */
export async function triggerWebhooksForEvent<T = any>(
  eventType: WebhookEventType,
  data: T,
  metadata?: Record<string, any>
): Promise<WebhookDelivery[]> {
  const webhooks = getWebhooksByEvent(eventType);
  const deliveries: WebhookDelivery[] = [];

  for (const webhook of webhooks) {
    try {
      const delivery = await triggerWebhook(webhook, eventType, data, metadata);
      deliveries.push(delivery);
    } catch (err) {
      console.error(`Failed to trigger webhook ${webhook.id}:`, err);
    }
  }

  return deliveries;
}

/**
 * Test webhook
 */
export async function testWebhook(webhookId: string): Promise<WebhookDelivery | null> {
  const webhook = getWebhookById(webhookId);
  if (!webhook) return null;

  const testData = {
    test: true,
    message: 'This is a test webhook delivery',
    timestamp: new Date().toISOString(),
  };

  return triggerWebhook(webhook, 'onCreate', testData, { test: true });
}

/**
 * Get webhook statistics
 */
export function getWebhookStats(webhookId: string) {
  const deliveries = getDeliveriesByWebhook(webhookId);

  const total = deliveries.length;
  const successful = deliveries.filter((d) => d.status === 'success').length;
  const failed = deliveries.filter((d) => d.status === 'failed').length;
  const pending = deliveries.filter((d) => d.status === 'pending').length;
  const retrying = deliveries.filter((d) => d.status === 'retrying').length;

  const successRate = total > 0 ? (successful / total) * 100 : 0;

  const recent = deliveries.slice(0, 10);
  const avgResponseTime =
    recent.length > 0
      ? recent
          .filter((d) => d.completedAt)
          .reduce((sum, d) => {
            return sum + (d.completedAt!.getTime() - d.createdAt.getTime());
          }, 0) / recent.filter((d) => d.completedAt).length
      : 0;

  return {
    total,
    successful,
    failed,
    pending,
    retrying,
    successRate,
    avgResponseTime,
    lastDelivery: deliveries[0]?.createdAt,
  };
}

/**
 * Export webhooks configuration
 */
export function exportWebhooks(): string {
  const webhooks = getAllWebhooks();
  return JSON.stringify(webhooks, null, 2);
}

/**
 * Import webhooks configuration
 */
export function importWebhooks(json: string): number {
  try {
    const imported = JSON.parse(json) as WebhookConfig[];
    const existing = getAllWebhooks();

    let count = 0;
    for (const webhook of imported) {
      // Generate new ID to avoid conflicts
      const newWebhook = createWebhook({
        name: webhook.name,
        url: webhook.url,
        method: webhook.method,
        events: webhook.events,
        headers: webhook.headers,
        secret: webhook.secret,
        enabled: webhook.enabled,
        retryConfig: webhook.retryConfig || DEFAULT_RETRY_CONFIG,
      });
      count++;
    }

    return count;
  } catch (err) {
    console.error('Failed to import webhooks:', err);
    return 0;
  }
}

/**
 * Clear all deliveries
 */
export function clearAllDeliveries(): void {
  localStorage.removeItem('webhook_deliveries');
}

/**
 * Get delivery statistics
 */
export function getDeliveryStats() {
  const deliveries = getAllDeliveries();

  const last24h = deliveries.filter(
    (d) => d.createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000
  );
  const last7d = deliveries.filter(
    (d) => d.createdAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  return {
    total: deliveries.length,
    last24h: last24h.length,
    last7d: last7d.length,
    successful: deliveries.filter((d) => d.status === 'success').length,
    failed: deliveries.filter((d) => d.status === 'failed').length,
    pending: deliveries.filter((d) => d.status === 'pending').length,
    retrying: deliveries.filter((d) => d.status === 'retrying').length,
  };
}
