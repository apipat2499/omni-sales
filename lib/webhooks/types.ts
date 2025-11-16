// Webhook System Types and Event Definitions

export type WebhookEventType =
  // Order Events
  | 'order.created'
  | 'order.updated'
  | 'order.shipped'
  | 'order.completed'
  | 'order.cancelled'
  | 'order.refunded'
  // Payment Events
  | 'payment.received'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.pending'
  // Customer Events
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  // Product Events
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.inventory_low'
  | 'product.inventory_out'
  | 'product.inventory_restocked'
  // Refund Events
  | 'refund.created'
  | 'refund.processed'
  | 'refund.failed'
  // Email Events
  | 'email.sent'
  | 'email.delivered'
  | 'email.failed'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked'
  // Chat/Support Events
  | 'chat.escalated'
  | 'chat.assigned'
  | 'chat.resolved'
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.closed';

export type WebhookStatus = 'pending' | 'success' | 'failed' | 'timeout';

export type DeliveryStatus = 'pending' | 'delivering' | 'success' | 'failed' | 'timeout' | 'cancelled';

export interface Webhook {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  headers?: Record<string, string>;
  is_active: boolean;
  retry_enabled: boolean;
  max_retries: number;
  timeout_seconds: number;
  api_key?: string;
  ip_whitelist?: string[];
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  last_triggered_at?: Date;
}

export interface WebhookEvent {
  id: string;
  tenant_id?: string;
  event_type: WebhookEventType;
  event_data: any;
  resource_id?: string;
  resource_type?: string;
  triggered_at: Date;
  created_at: Date;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_id: string;
  attempt_number: number;
  status: DeliveryStatus;
  http_status_code?: number;
  response_body?: string;
  response_headers?: Record<string, any>;
  error_message?: string;
  duration_ms?: number;
  next_retry_at?: Date;
  delivered_at?: Date;
  created_at: Date;
}

export interface WebhookFailure {
  id: string;
  webhook_id: string;
  event_id: string;
  delivery_id: string;
  failure_reason: string;
  attempts_count: number;
  last_attempt_at?: Date;
  can_replay: boolean;
  replayed_at?: Date;
  created_at: Date;
}

export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  created_at: string;
  data: any;
}

export interface WebhookSignature {
  timestamp: number;
  signature: string;
}

// Event Payload Types
export interface OrderEventPayload {
  order_id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  total: number;
  currency: string;
  status: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  shipping_address?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentEventPayload {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
}

export interface CustomerEventPayload {
  customer_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductEventPayload {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  low_stock_threshold?: number;
  created_at: string;
  updated_at: string;
}

export interface RefundEventPayload {
  refund_id: string;
  order_id: string;
  amount: number;
  currency: string;
  reason?: string;
  status: string;
  processed_at?: string;
  created_at: string;
}

export interface EmailEventPayload {
  email_id: string;
  to: string;
  from: string;
  subject: string;
  status: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error?: string;
}

export interface ChatEventPayload {
  ticket_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to?: string;
  escalated_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// Webhook Configuration
export interface CreateWebhookRequest {
  name: string;
  description?: string;
  url: string;
  events: WebhookEventType[];
  headers?: Record<string, string>;
  retry_enabled?: boolean;
  max_retries?: number;
  timeout_seconds?: number;
  api_key?: string;
  ip_whitelist?: string[];
}

export interface UpdateWebhookRequest {
  name?: string;
  description?: string;
  url?: string;
  events?: WebhookEventType[];
  headers?: Record<string, string>;
  is_active?: boolean;
  retry_enabled?: boolean;
  max_retries?: number;
  timeout_seconds?: number;
  api_key?: string;
  ip_whitelist?: string[];
}

export interface WebhookStats {
  total_events: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pending_deliveries: number;
  avg_duration_ms: number;
  success_rate: number;
}

export interface WebhookDeliverySummary {
  webhook_id: string;
  webhook_name: string;
  webhook_url: string;
  is_active: boolean;
  total_events: number;
  successful_deliveries: number;
  failed_deliveries: number;
  permanent_failures: number;
  last_triggered_at?: Date;
  created_at: Date;
}

// Retry configuration
export interface RetryConfig {
  enabled: boolean;
  max_attempts: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  enabled: true,
  max_attempts: 3,
  initial_delay_ms: 1000, // 1 second
  max_delay_ms: 60000, // 1 minute
  backoff_multiplier: 2, // Exponential backoff
};

// Error codes
export enum WebhookErrorCode {
  TIMEOUT = 'TIMEOUT',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  RATE_LIMITED = 'RATE_LIMITED',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface WebhookError {
  code: WebhookErrorCode;
  message: string;
  details?: any;
}
