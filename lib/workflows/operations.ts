import {
  initiateReturn,
  addReturnItem,
  authorizeReturn,
  updateReturnStatus,
} from '@/lib/returns/service';
import {
  createStockTransfer,
  completeStockTransfer,
} from '@/lib/inventory/service';
import {
  createFulfillmentTask,
  updateFulfillmentTask,
} from '@/lib/order/service';
import type { OrderItem } from '@/types';

export interface ReturnWorkflowInput {
  userId: string;
  orderId: string;
  customerId: string;
  items: Array<
    Pick<OrderItem, 'productId' | 'productName' | 'quantity'> & {
      orderItemId: string;
    }
  >;
  reason?: string;
}

export interface WorkflowResult {
  success: boolean;
  errors: string[];
  metadata?: Record<string, unknown>;
}

export interface StockTransferWorkflowInput {
  userId: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
}

export interface FulfillmentWorkflowInput {
  orderId: string;
  tasks: Array<{
    type: string;
    nextStatus: string;
    notes?: string;
  }>;
}

export async function processReturnWorkflow(
  input: ReturnWorkflowInput
): Promise<WorkflowResult> {
  const errors: string[] = [];
  const createdReturn = await initiateReturn(input.userId, {
    orderId: input.orderId,
    customerId: input.customerId,
    reasonDetails: input.reason,
  });

  if (!createdReturn) {
    return { success: false, errors: ['ไม่สามารถสร้างคำขอคืนสินค้าได้'] };
  }

  for (const item of input.items) {
    const result = await addReturnItem(createdReturn.id, {
      orderItemId: item.orderItemId,
      productId: item.productId,
      productName: item.productName,
      quantityReturned: item.quantity,
    });
    if (!result) {
      errors.push(`เพิ่มสินค้า ${item.productName} ไม่สำเร็จ`);
    }
  }

  const authorized = await authorizeReturn(input.userId, createdReturn.id);
  if (!authorized) {
    errors.push('อนุมัติคำขอคืนสินค้าไม่สำเร็จ');
  }

  if (errors.length === 0) {
    await updateReturnStatus(createdReturn.id, 'processing');
  }

  return {
    success: errors.length === 0,
    errors,
    metadata: { returnId: createdReturn.id },
  };
}

export async function runStockTransferWorkflow(
  input: StockTransferWorkflowInput
): Promise<WorkflowResult> {
  const errors: string[] = [];
  const transfer = await createStockTransfer(input.userId, {
    productId: input.productId,
    fromWarehouseId: input.fromWarehouseId,
    toWarehouseId: input.toWarehouseId,
    quantity: input.quantity,
    notes: input.notes,
  });

  if (!transfer) {
    return { success: false, errors: ['ไม่สามารถสร้างคำสั่งย้ายสต็อก'] };
  }

  const completed = await completeStockTransfer(
    transfer.id,
    input.userId,
    input.productId,
    input.toWarehouseId,
    input.quantity
  );

  if (!completed) {
    errors.push('ไม่สามารถอัปเดตปลายทางสต็อกได้');
  }

  return {
    success: errors.length === 0,
    errors,
    metadata: { transferId: transfer.id },
  };
}

export async function advanceFulfillmentWorkflow(
  input: FulfillmentWorkflowInput
): Promise<WorkflowResult> {
  const errors: string[] = [];

  for (const task of input.tasks) {
    const created = await createFulfillmentTask(input.orderId, {
      taskType: task.type,
      notes: task.notes,
    });

    if (!created) {
      errors.push(`สร้างงาน ${task.type} ไม่สำเร็จ`);
      continue;
    }

    const updated = await updateFulfillmentTask(
      created.id,
      task.nextStatus,
      task.notes
    );
    if (!updated) {
      errors.push(`อัปเดตสถานะ ${task.type} ไม่สำเร็จ`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}
