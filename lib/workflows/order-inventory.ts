import type { Order } from '@/types';
import { createOrder } from '@/lib/supabase/database';
import { updateStockLevel } from '@/lib/inventory/service';

export interface OrderInventoryContext {
  userId: string;
  warehouseId: string;
  allowPartialFulfillment?: boolean;
}

export interface OrderInventoryResult {
  success: boolean;
  orderId?: string;
  errors: string[];
  stockAdjustments: {
    productId: string;
    quantity: number;
    success: boolean;
  }[];
}

/**
 * Create order and update stock in a single workflow.
 * Returns combined result for observability & integration testing.
 */
export async function processOrderInventoryWorkflow(
  order: Order,
  context: OrderInventoryContext
): Promise<OrderInventoryResult> {
  const result: OrderInventoryResult = {
    success: false,
    errors: [],
    stockAdjustments: [],
  };

  const orderResponse = await createOrder(order);
  if (!orderResponse.success) {
    result.errors.push(orderResponse.error?.message || 'Create order failed');
    return result;
  }

  for (const item of order.items) {
    const adjustmentSucceeded = await updateStockLevel(
      context.userId,
      item.productId,
      context.warehouseId,
      -item.quantity,
      'order_fulfillment',
      'order',
      order.id
    );

    result.stockAdjustments.push({
      productId: item.productId,
      quantity: item.quantity,
      success: adjustmentSucceeded,
    });

    if (!adjustmentSucceeded) {
      result.errors.push(`ไม่สามารถหักสต็อกสินค้า ${item.productName}`);
      if (!context.allowPartialFulfillment) {
        break;
      }
    }
  }

  result.success = result.errors.length === 0;
  result.orderId = order.id;
  return result;
}
