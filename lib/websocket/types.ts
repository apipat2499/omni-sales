import { OrderStatus } from '@/types';

// WebSocket Event Types
export type WebSocketEventType =
  // Order Events
  | 'order:created'
  | 'order:updated'
  | 'order:status_changed'
  | 'order:deleted'
  // Customer Events
  | 'customer:activity'
  | 'customer:viewing_product'
  | 'customer:added_to_cart'
  | 'customer:online'
  | 'customer:offline'
  // Inventory Events
  | 'inventory:updated'
  | 'inventory:low_stock'
  | 'inventory:out_of_stock'
  | 'inventory:restocked'
  // Product Events
  | 'product:price_changed'
  | 'product:created'
  | 'product:updated'
  | 'product:deleted'
  // Payment Events
  | 'payment:received'
  | 'payment:failed'
  | 'payment:refunded'
  // System Events
  | 'system:notification'
  | 'system:alert'
  | 'system:maintenance';

// WebSocket Namespaces
export type WebSocketNamespace = 'orders' | 'customers' | 'products' | 'inventory' | 'payments' | 'system';

// User Roles for Permission Checking
export type UserRole = 'admin' | 'staff' | 'manager' | 'customer' | 'guest';

// Base Event Interface
export interface WebSocketEvent<T = any> {
  type: WebSocketEventType;
  namespace: WebSocketNamespace;
  data: T;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

// Order Event Payloads
export interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  channel: string;
}

export interface OrderUpdatedPayload {
  orderId: string;
  changes: Partial<{
    status: OrderStatus;
    total: number;
    items: any[];
  }>;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  customerId: string;
  customerName: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: number;
}

// Customer Event Payloads
export interface CustomerActivityPayload {
  customerId: string;
  customerName?: string;
  action: 'viewing' | 'cart_add' | 'cart_remove' | 'checkout_start' | 'checkout_complete';
  productId?: string;
  productName?: string;
  timestamp: number;
}

export interface CustomerViewingProductPayload {
  customerId: string;
  productId: string;
  productName: string;
  duration?: number;
}

export interface CustomerOnlineStatusPayload {
  customerId: string;
  isOnline: boolean;
  lastSeen: number;
}

// Inventory Event Payloads
export interface InventoryUpdatedPayload {
  productId: string;
  productName: string;
  sku: string;
  oldStock: number;
  newStock: number;
  difference: number;
  reason?: 'sale' | 'restock' | 'adjustment' | 'return';
}

export interface InventoryAlertPayload {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  severity: 'low' | 'critical';
}

// Product Event Payloads
export interface ProductPriceChangedPayload {
  productId: string;
  productName: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  changePercentage: number;
}

// Payment Event Payloads
export interface PaymentReceivedPayload {
  paymentId: string;
  orderId: string;
  customerId: string;
  amount: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
}

export interface PaymentFailedPayload {
  paymentId: string;
  orderId: string;
  customerId: string;
  amount: number;
  reason: string;
  retryable: boolean;
}

// System Event Payloads
export interface SystemNotificationPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  targetRoles?: UserRole[];
  actionUrl?: string;
}

// WebSocket Connection Info
export interface WebSocketConnection {
  id: string;
  userId?: string;
  role?: UserRole;
  namespaces: WebSocketNamespace[];
  connectedAt: number;
  lastActivity: number;
  ipAddress?: string;
}

// WebSocket Server Config
export interface WebSocketServerConfig {
  port?: number;
  path?: string;
  maxConnections?: number;
  pingInterval?: number;
  pongTimeout?: number;
  allowedOrigins?: string[];
}

// Event Broadcasting Options
export interface BroadcastOptions {
  namespace?: WebSocketNamespace;
  userIds?: string[];
  roles?: UserRole[];
  excludeUserIds?: string[];
  excludeSessionId?: string;
}

// Rate Limiting Config
export interface RateLimitConfig {
  windowMs: number;
  maxEvents: number;
  message?: string;
}

// WebSocket Authentication Token
export interface WebSocketAuthToken {
  userId: string;
  role: UserRole;
  sessionId: string;
  expiresAt: number;
}
