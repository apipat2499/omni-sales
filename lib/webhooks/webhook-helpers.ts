import crypto from 'crypto';
import { WebhookEventType } from './types';
import { WebhookDeliveryService } from './webhook-delivery';

/**
 * Verify webhook signature (for receiving webhooks from external services)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp?: string
): boolean {
  // Optional: Check if timestamp is recent (within 5 minutes)
  if (timestamp) {
    const timestampNum = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - timestampNum);

    if (timeDiff > 300) {
      // 5 minutes
      return false;
    }
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

/**
 * Webhook Event Emitter
 * Use this to trigger webhooks from anywhere in your application
 */
export class WebhookEmitter {
  private deliveryService: WebhookDeliveryService;

  constructor() {
    this.deliveryService = new WebhookDeliveryService();
  }

  /**
   * Emit an order event
   */
  async emitOrderEvent(
    eventType: Extract<
      WebhookEventType,
      'order.created' | 'order.updated' | 'order.shipped' | 'order.completed' | 'order.cancelled' | 'order.refunded'
    >,
    orderData: any,
    tenantId?: string
  ) {
    return this.deliveryService.triggerEvent(eventType, orderData, orderData.order_id || orderData.id, 'order', tenantId);
  }

  /**
   * Emit a payment event
   */
  async emitPaymentEvent(
    eventType: Extract<WebhookEventType, 'payment.received' | 'payment.failed' | 'payment.refunded' | 'payment.pending'>,
    paymentData: any,
    tenantId?: string
  ) {
    return this.deliveryService.triggerEvent(
      eventType,
      paymentData,
      paymentData.payment_id || paymentData.id,
      'payment',
      tenantId
    );
  }

  /**
   * Emit a customer event
   */
  async emitCustomerEvent(
    eventType: Extract<WebhookEventType, 'customer.created' | 'customer.updated' | 'customer.deleted'>,
    customerData: any,
    tenantId?: string
  ) {
    return this.deliveryService.triggerEvent(
      eventType,
      customerData,
      customerData.customer_id || customerData.id,
      'customer',
      tenantId
    );
  }

  /**
   * Emit a product event
   */
  async emitProductEvent(
    eventType: Extract<
      WebhookEventType,
      | 'product.created'
      | 'product.updated'
      | 'product.deleted'
      | 'product.inventory_low'
      | 'product.inventory_out'
      | 'product.inventory_restocked'
    >,
    productData: any,
    tenantId?: string
  ) {
    return this.deliveryService.triggerEvent(
      eventType,
      productData,
      productData.product_id || productData.id,
      'product',
      tenantId
    );
  }

  /**
   * Emit a refund event
   */
  async emitRefundEvent(
    eventType: Extract<WebhookEventType, 'refund.created' | 'refund.processed' | 'refund.failed'>,
    refundData: any,
    tenantId?: string
  ) {
    return this.deliveryService.triggerEvent(
      eventType,
      refundData,
      refundData.refund_id || refundData.id,
      'refund',
      tenantId
    );
  }

  /**
   * Emit an email event
   */
  async emitEmailEvent(
    eventType: Extract<
      WebhookEventType,
      'email.sent' | 'email.delivered' | 'email.failed' | 'email.bounced' | 'email.opened' | 'email.clicked'
    >,
    emailData: any,
    tenantId?: string
  ) {
    return this.deliveryService.triggerEvent(
      eventType,
      emailData,
      emailData.email_id || emailData.id,
      'email',
      tenantId
    );
  }

  /**
   * Emit a chat/support event
   */
  async emitChatEvent(
    eventType: Extract<
      WebhookEventType,
      'chat.escalated' | 'chat.assigned' | 'chat.resolved' | 'ticket.created' | 'ticket.updated' | 'ticket.closed'
    >,
    chatData: any,
    tenantId?: string
  ) {
    return this.deliveryService.triggerEvent(
      eventType,
      chatData,
      chatData.ticket_id || chatData.id,
      'ticket',
      tenantId
    );
  }

  /**
   * Generic event emitter for custom events
   */
  async emit(eventType: WebhookEventType, data: any, resourceId?: string, resourceType?: string, tenantId?: string) {
    return this.deliveryService.triggerEvent(eventType, data, resourceId, resourceType, tenantId);
  }
}

/**
 * Singleton instance
 */
export const webhookEmitter = new WebhookEmitter();

/**
 * Helper function to check rate limit
 */
export async function checkRateLimit(webhookId: string, limitPerWindow: number = 1000): Promise<boolean> {
  // This would typically use Redis or similar for distributed rate limiting
  // For now, we'll use a simple database-based approach
  const windowDuration = 60 * 60 * 1000; // 1 hour
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / windowDuration) * windowDuration);
  const windowEnd = new Date(windowStart.getTime() + windowDuration);

  // This is a simplified version - in production you'd want to use Redis
  return true; // For now, always allow
}

/**
 * Format webhook event data for display
 */
export function formatEventData(event: any): string {
  try {
    return JSON.stringify(event, null, 2);
  } catch {
    return String(event);
  }
}

/**
 * Sanitize webhook URL
 */
export function sanitizeWebhookUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();

      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
      ) {
        throw new Error('Private IP addresses are not allowed');
      }
    }

    return parsedUrl.toString();
  } catch (error) {
    throw new Error(`Invalid webhook URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if IP is whitelisted
 */
export function isIpWhitelisted(ip: string, whitelist?: string[]): boolean {
  if (!whitelist || whitelist.length === 0) {
    return true; // No whitelist means all IPs are allowed
  }

  return whitelist.includes(ip);
}

export default {
  verifyWebhookSignature,
  webhookEmitter,
  checkRateLimit,
  formatEventData,
  sanitizeWebhookUrl,
  isIpWhitelisted,
};
