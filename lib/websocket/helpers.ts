/**
 * WebSocket Integration Helpers
 * Helper functions to integrate WebSocket events into existing API routes
 */

import { wsEvents } from './events';
import { Order, OrderStatus, Product } from '@/types';

/**
 * Emit order events based on order data
 */
export function emitOrderEvent(
  action: 'created' | 'updated' | 'status_changed' | 'deleted',
  orderData: Partial<Order> & { id: string },
  oldStatus?: OrderStatus
) {
  try {
    switch (action) {
      case 'created':
        if (orderData.customerId && orderData.customerName && orderData.total && orderData.status && orderData.channel) {
          wsEvents.orderCreated({
            orderId: orderData.id,
            customerId: orderData.customerId,
            customerName: orderData.customerName,
            total: orderData.total,
            status: orderData.status,
            channel: orderData.channel,
          });
        }
        break;

      case 'updated':
        wsEvents.orderUpdated({
          orderId: orderData.id,
          changes: {
            status: orderData.status,
            total: orderData.total,
            items: orderData.items,
          },
        });
        break;

      case 'status_changed':
        if (oldStatus && orderData.status && orderData.customerId && orderData.customerName) {
          wsEvents.orderStatusChanged({
            orderId: orderData.id,
            customerId: orderData.customerId,
            customerName: orderData.customerName,
            oldStatus,
            newStatus: orderData.status,
            timestamp: Date.now(),
          });
        }
        break;

      case 'deleted':
        wsEvents.orderDeleted(orderData.id);
        break;
    }
  } catch (error) {
    console.error('[WebSocket Helper] Error emitting order event:', error);
  }
}

/**
 * Emit inventory events
 */
export function emitInventoryEvent(
  action: 'updated' | 'low_stock' | 'out_of_stock' | 'restocked',
  productData: {
    id: string;
    name: string;
    sku: string;
    oldStock?: number;
    newStock: number;
    reason?: 'sale' | 'restock' | 'adjustment' | 'return';
  }
) {
  try {
    switch (action) {
      case 'updated':
        if (productData.oldStock !== undefined) {
          wsEvents.inventoryUpdated({
            productId: productData.id,
            productName: productData.name,
            sku: productData.sku,
            oldStock: productData.oldStock,
            newStock: productData.newStock,
            difference: productData.newStock - productData.oldStock,
            reason: productData.reason,
          });
        }
        break;

      case 'low_stock':
        wsEvents.inventoryAlert({
          productId: productData.id,
          productName: productData.name,
          sku: productData.sku,
          currentStock: productData.newStock,
          threshold: 10,
          severity: productData.newStock <= 5 ? 'critical' : 'low',
        });
        break;

      case 'out_of_stock':
        wsEvents.inventoryOutOfStock({
          productId: productData.id,
          productName: productData.name,
          sku: productData.sku,
        });
        break;

      case 'restocked':
        if (productData.oldStock !== undefined) {
          wsEvents.inventoryRestocked({
            productId: productData.id,
            productName: productData.name,
            sku: productData.sku,
            newStock: productData.newStock,
            addedQuantity: productData.newStock - productData.oldStock,
          });
        }
        break;
    }
  } catch (error) {
    console.error('[WebSocket Helper] Error emitting inventory event:', error);
  }
}

/**
 * Emit product events
 */
export function emitProductEvent(
  action: 'created' | 'updated' | 'deleted' | 'price_changed',
  productData: Partial<Product> & { id: string },
  oldPrice?: number
) {
  try {
    switch (action) {
      case 'created':
        if (productData.name && productData.category && productData.price) {
          wsEvents.productCreated({
            productId: productData.id,
            productName: productData.name,
            category: productData.category,
            price: productData.price,
          });
        }
        break;

      case 'updated':
        wsEvents.productUpdated({
          productId: productData.id,
          changes: {
            name: productData.name,
            price: productData.price,
            stock: productData.stock,
            category: productData.category,
          },
        });
        break;

      case 'deleted':
        wsEvents.productDeleted(productData.id);
        break;

      case 'price_changed':
        if (oldPrice !== undefined && productData.price && productData.name && productData.sku) {
          const changePercentage = ((productData.price - oldPrice) / oldPrice) * 100;
          wsEvents.productPriceChanged({
            productId: productData.id,
            productName: productData.name,
            sku: productData.sku,
            oldPrice,
            newPrice: productData.price,
            changePercentage,
          });
        }
        break;
    }
  } catch (error) {
    console.error('[WebSocket Helper] Error emitting product event:', error);
  }
}

/**
 * Emit payment events
 */
export function emitPaymentEvent(
  action: 'received' | 'failed' | 'refunded',
  paymentData: {
    id: string;
    orderId: string;
    customerId: string;
    amount: number;
    method?: string;
    status?: 'success' | 'pending' | 'failed';
    reason?: string;
    retryable?: boolean;
  }
) {
  try {
    switch (action) {
      case 'received':
        wsEvents.paymentReceived({
          paymentId: paymentData.id,
          orderId: paymentData.orderId,
          customerId: paymentData.customerId,
          amount: paymentData.amount,
          method: paymentData.method || 'unknown',
          status: paymentData.status || 'success',
        });
        break;

      case 'failed':
        wsEvents.paymentFailed({
          paymentId: paymentData.id,
          orderId: paymentData.orderId,
          customerId: paymentData.customerId,
          amount: paymentData.amount,
          reason: paymentData.reason || 'Unknown error',
          retryable: paymentData.retryable || false,
        });
        break;

      case 'refunded':
        wsEvents.paymentRefunded({
          paymentId: paymentData.id,
          orderId: paymentData.orderId,
          customerId: paymentData.customerId,
          amount: paymentData.amount,
          reason: paymentData.reason,
        });
        break;
    }
  } catch (error) {
    console.error('[WebSocket Helper] Error emitting payment event:', error);
  }
}

/**
 * Emit customer activity events
 */
export function emitCustomerActivity(
  customerId: string,
  action: 'viewing' | 'cart_add' | 'cart_remove' | 'checkout_start' | 'checkout_complete',
  details?: {
    customerName?: string;
    productId?: string;
    productName?: string;
  }
) {
  try {
    wsEvents.customerActivity({
      customerId,
      customerName: details?.customerName,
      action,
      productId: details?.productId,
      productName: details?.productName,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[WebSocket Helper] Error emitting customer activity:', error);
  }
}

/**
 * Emit system notifications
 */
export function emitSystemNotification(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'success',
  targetRoles?: Array<'admin' | 'manager' | 'staff' | 'customer' | 'guest'>,
  actionUrl?: string
) {
  try {
    wsEvents.systemNotification({
      title,
      message,
      severity,
      targetRoles,
      actionUrl,
    });
  } catch (error) {
    console.error('[WebSocket Helper] Error emitting system notification:', error);
  }
}
