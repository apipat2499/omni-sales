import { wsManager } from './server';
import {
  WebSocketEvent,
  WebSocketEventType,
  WebSocketNamespace,
  BroadcastOptions,
  OrderCreatedPayload,
  OrderUpdatedPayload,
  OrderStatusChangedPayload,
  CustomerActivityPayload,
  CustomerViewingProductPayload,
  CustomerOnlineStatusPayload,
  InventoryUpdatedPayload,
  InventoryAlertPayload,
  ProductPriceChangedPayload,
  PaymentReceivedPayload,
  PaymentFailedPayload,
  SystemNotificationPayload,
  UserRole,
} from './types';

/**
 * Event Emitter for WebSocket events
 * Handles creating and broadcasting real-time events
 */
class WebSocketEventEmitter {
  private static instance: WebSocketEventEmitter;

  private constructor() {}

  public static getInstance(): WebSocketEventEmitter {
    if (!WebSocketEventEmitter.instance) {
      WebSocketEventEmitter.instance = new WebSocketEventEmitter();
    }
    return WebSocketEventEmitter.instance;
  }

  /**
   * Generic event emission
   */
  private emit<T>(
    type: WebSocketEventType,
    namespace: WebSocketNamespace,
    data: T,
    options: BroadcastOptions = {}
  ): void {
    const event: WebSocketEvent<T> = {
      type,
      namespace,
      data,
      timestamp: Date.now(),
    };

    console.log(`[WebSocket Event] ${type}:`, data);

    wsManager.broadcast(event, {
      namespace: options.namespace || namespace,
      userIds: options.userIds,
      roles: options.roles,
      excludeUserIds: options.excludeUserIds,
      excludeConnectionId: options.excludeSessionId,
    });
  }

  // ==================== ORDER EVENTS ====================

  /**
   * Emit order created event
   */
  public orderCreated(payload: OrderCreatedPayload, options?: BroadcastOptions): void {
    this.emit('order:created', 'orders', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager', 'staff'],
    });
  }

  /**
   * Emit order updated event
   */
  public orderUpdated(payload: OrderUpdatedPayload, options?: BroadcastOptions): void {
    this.emit('order:updated', 'orders', payload, options);
  }

  /**
   * Emit order status changed event
   */
  public orderStatusChanged(payload: OrderStatusChangedPayload, options?: BroadcastOptions): void {
    this.emit('order:status_changed', 'orders', payload, {
      ...options,
      // Notify customer and staff
      roles: options?.roles || ['admin', 'manager', 'staff', 'customer'],
    });

    // Also send to specific customer
    if (payload.customerId) {
      wsManager.sendToUser(payload.customerId, {
        type: 'order:status_changed',
        namespace: 'orders',
        data: payload,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Emit order deleted event
   */
  public orderDeleted(orderId: string, options?: BroadcastOptions): void {
    this.emit('order:deleted', 'orders', { orderId }, {
      ...options,
      roles: options?.roles || ['admin', 'manager'],
    });
  }

  // ==================== CUSTOMER EVENTS ====================

  /**
   * Emit customer activity event
   */
  public customerActivity(payload: CustomerActivityPayload, options?: BroadcastOptions): void {
    this.emit('customer:activity', 'customers', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager', 'staff'],
    });
  }

  /**
   * Emit customer viewing product event
   */
  public customerViewingProduct(payload: CustomerViewingProductPayload, options?: BroadcastOptions): void {
    this.emit('customer:viewing_product', 'customers', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager'],
    });
  }

  /**
   * Emit customer online status event
   */
  public customerOnlineStatus(payload: CustomerOnlineStatusPayload, options?: BroadcastOptions): void {
    this.emit(
      payload.isOnline ? 'customer:online' : 'customer:offline',
      'customers',
      payload,
      options
    );
  }

  /**
   * Emit customer added to cart event
   */
  public customerAddedToCart(
    payload: {
      customerId: string;
      productId: string;
      productName: string;
      quantity: number;
    },
    options?: BroadcastOptions
  ): void {
    this.emit('customer:added_to_cart', 'customers', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager'],
    });
  }

  // ==================== INVENTORY EVENTS ====================

  /**
   * Emit inventory updated event
   */
  public inventoryUpdated(payload: InventoryUpdatedPayload, options?: BroadcastOptions): void {
    this.emit('inventory:updated', 'inventory', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager', 'staff'],
    });

    // If stock is low, also emit alert
    if (payload.newStock <= 10 && payload.newStock > 0) {
      this.inventoryAlert({
        productId: payload.productId,
        productName: payload.productName,
        sku: payload.sku,
        currentStock: payload.newStock,
        threshold: 10,
        severity: payload.newStock <= 5 ? 'critical' : 'low',
      });
    } else if (payload.newStock === 0) {
      this.inventoryOutOfStock({
        productId: payload.productId,
        productName: payload.productName,
        sku: payload.sku,
      });
    }
  }

  /**
   * Emit inventory alert event
   */
  public inventoryAlert(payload: InventoryAlertPayload, options?: BroadcastOptions): void {
    this.emit('inventory:low_stock', 'inventory', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager', 'staff'],
    });
  }

  /**
   * Emit inventory out of stock event
   */
  public inventoryOutOfStock(
    payload: {
      productId: string;
      productName: string;
      sku: string;
    },
    options?: BroadcastOptions
  ): void {
    this.emit('inventory:out_of_stock', 'inventory', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager', 'staff'],
    });
  }

  /**
   * Emit inventory restocked event
   */
  public inventoryRestocked(
    payload: {
      productId: string;
      productName: string;
      sku: string;
      newStock: number;
      addedQuantity: number;
    },
    options?: BroadcastOptions
  ): void {
    this.emit('inventory:restocked', 'inventory', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager', 'staff'],
    });
  }

  // ==================== PRODUCT EVENTS ====================

  /**
   * Emit product price changed event
   */
  public productPriceChanged(payload: ProductPriceChangedPayload, options?: BroadcastOptions): void {
    this.emit('product:price_changed', 'products', payload, {
      ...options,
      // Notify everyone about price changes
      roles: options?.roles || ['admin', 'manager', 'staff', 'customer'],
    });
  }

  /**
   * Emit product created event
   */
  public productCreated(
    payload: {
      productId: string;
      productName: string;
      category: string;
      price: number;
    },
    options?: BroadcastOptions
  ): void {
    this.emit('product:created', 'products', payload, options);
  }

  /**
   * Emit product updated event
   */
  public productUpdated(
    payload: {
      productId: string;
      changes: Record<string, any>;
    },
    options?: BroadcastOptions
  ): void {
    this.emit('product:updated', 'products', payload, options);
  }

  /**
   * Emit product deleted event
   */
  public productDeleted(productId: string, options?: BroadcastOptions): void {
    this.emit('product:deleted', 'products', { productId }, {
      ...options,
      roles: options?.roles || ['admin', 'manager'],
    });
  }

  // ==================== PAYMENT EVENTS ====================

  /**
   * Emit payment received event
   */
  public paymentReceived(payload: PaymentReceivedPayload, options?: BroadcastOptions): void {
    this.emit('payment:received', 'payments', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager'],
    });

    // Notify the customer
    if (payload.customerId) {
      wsManager.sendToUser(payload.customerId, {
        type: 'payment:received',
        namespace: 'payments',
        data: payload,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Emit payment failed event
   */
  public paymentFailed(payload: PaymentFailedPayload, options?: BroadcastOptions): void {
    this.emit('payment:failed', 'payments', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager'],
    });

    // Notify the customer
    if (payload.customerId) {
      wsManager.sendToUser(payload.customerId, {
        type: 'payment:failed',
        namespace: 'payments',
        data: payload,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Emit payment refunded event
   */
  public paymentRefunded(
    payload: {
      paymentId: string;
      orderId: string;
      customerId: string;
      amount: number;
      reason?: string;
    },
    options?: BroadcastOptions
  ): void {
    this.emit('payment:refunded', 'payments', payload, {
      ...options,
      roles: options?.roles || ['admin', 'manager'],
    });

    // Notify the customer
    if (payload.customerId) {
      wsManager.sendToUser(payload.customerId, {
        type: 'payment:refunded',
        namespace: 'payments',
        data: payload,
        timestamp: Date.now(),
      });
    }
  }

  // ==================== SYSTEM EVENTS ====================

  /**
   * Emit system notification
   */
  public systemNotification(payload: SystemNotificationPayload, options?: BroadcastOptions): void {
    this.emit('system:notification', 'system', payload, {
      ...options,
      roles: options?.roles || payload.targetRoles,
    });
  }

  /**
   * Emit system alert
   */
  public systemAlert(
    payload: {
      title: string;
      message: string;
      severity: 'info' | 'warning' | 'error' | 'success';
      targetRoles?: UserRole[];
    },
    options?: BroadcastOptions
  ): void {
    this.emit('system:alert', 'system', payload, {
      ...options,
      roles: options?.roles || payload.targetRoles || ['admin'],
    });
  }

  /**
   * Emit maintenance notification
   */
  public systemMaintenance(
    payload: {
      message: string;
      scheduledAt?: number;
      duration?: number;
    },
    options?: BroadcastOptions
  ): void {
    this.emit('system:maintenance', 'system', payload, {
      ...options,
      // Notify everyone
      roles: options?.roles,
    });
  }
}

// Export singleton instance
export const wsEvents = WebSocketEventEmitter.getInstance();
export default WebSocketEventEmitter;

// ==================== HELPER FUNCTIONS ====================

/**
 * Helper to emit multiple events in sequence
 */
export async function emitEvents(
  events: Array<{
    type: WebSocketEventType;
    namespace: WebSocketNamespace;
    data: any;
    options?: BroadcastOptions;
  }>
): Promise<void> {
  for (const event of events) {
    wsManager.broadcast(
      {
        type: event.type,
        namespace: event.namespace,
        data: event.data,
        timestamp: Date.now(),
      },
      event.options
    );
  }
}

/**
 * Helper to create a debounced event emitter
 */
export function createDebouncedEmitter<T>(
  emitFn: (data: T) => void,
  delay: number = 1000
): (data: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingData: T[] = [];

  return (data: T) => {
    pendingData.push(data);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      // Emit batched data
      if (pendingData.length === 1) {
        emitFn(pendingData[0]);
      } else if (pendingData.length > 1) {
        // For multiple events, emit the last one
        emitFn(pendingData[pendingData.length - 1]);
      }

      pendingData = [];
      timeoutId = null;
    }, delay);
  };
}
