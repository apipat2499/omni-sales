import { processReturnWorkflow, runStockTransferWorkflow, advanceFulfillmentWorkflow } from '@/lib/workflows/operations';

jest.mock('@/lib/returns/service', () => ({
  initiateReturn: jest.fn(),
  addReturnItem: jest.fn(),
  authorizeReturn: jest.fn(),
  updateReturnStatus: jest.fn(),
}));

jest.mock('@/lib/inventory/service', () => ({
  createStockTransfer: jest.fn(),
  completeStockTransfer: jest.fn(),
}));

jest.mock('@/lib/order/service', () => ({
  createFulfillmentTask: jest.fn(),
  updateFulfillmentTask: jest.fn(),
}));

const returnsService = jest.requireMock('@/lib/returns/service');
const inventoryService = jest.requireMock('@/lib/inventory/service');
const orderService = jest.requireMock('@/lib/order/service');

describe('operations workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processReturnWorkflow handles happy path', async () => {
    returnsService.initiateReturn.mockResolvedValue({ id: 'ret-1' });
    returnsService.addReturnItem.mockResolvedValue(true);
    returnsService.authorizeReturn.mockResolvedValue(true);
    returnsService.updateReturnStatus.mockResolvedValue(true);

    const result = await processReturnWorkflow({
      userId: 'user-1',
      orderId: 'order-123',
      customerId: 'cust-9',
      reason: 'สินค้าเสียหาย',
      items: [
        { orderItemId: 'oi-1', productId: 'prod-1', productName: 'แก้วน้ำ', quantity: 1 },
      ],
    });

    expect(result.success).toBe(true);
    expect(returnsService.initiateReturn).toHaveBeenCalled();
    expect(returnsService.addReturnItem).toHaveBeenCalledTimes(1);
    expect(returnsService.authorizeReturn).toHaveBeenCalled();
    expect(returnsService.updateReturnStatus).toHaveBeenCalledWith('ret-1', 'processing');
  });

  it('processReturnWorkflow aggregates errors', async () => {
    returnsService.initiateReturn.mockResolvedValue({ id: 'ret-1' });
    returnsService.addReturnItem.mockResolvedValueOnce(null);
    returnsService.authorizeReturn.mockResolvedValue(false);

    const result = await processReturnWorkflow({
      userId: 'user-1',
      orderId: 'order-123',
      customerId: 'cust-9',
      items: [
        { orderItemId: 'oi-1', productId: 'prod-1', productName: 'แก้วน้ำ', quantity: 1 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('processReturnWorkflow handles initiate failure', async () => {
    returnsService.initiateReturn.mockResolvedValue(null);

    const result = await processReturnWorkflow({
      userId: 'user-1',
      orderId: 'order-123',
      customerId: 'cust-9',
      items: [],
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('คำขอคืนสินค้า');
  });

  it('runStockTransferWorkflow chains create and complete', async () => {
    inventoryService.createStockTransfer.mockResolvedValue({ id: 'transfer-1' });
    inventoryService.completeStockTransfer.mockResolvedValue(true);

    const result = await runStockTransferWorkflow({
      userId: 'user-1',
      productId: 'prod-1',
      fromWarehouseId: 'wh-a',
      toWarehouseId: 'wh-b',
      quantity: 5,
    });

    expect(result.success).toBe(true);
    expect(inventoryService.createStockTransfer).toHaveBeenCalled();
    expect(inventoryService.completeStockTransfer).toHaveBeenCalledWith(
      'transfer-1',
      'user-1',
      'prod-1',
      'wh-b',
      5
    );
  });

  it('runStockTransferWorkflow reports completion failure', async () => {
    inventoryService.createStockTransfer.mockResolvedValue({ id: 'transfer-1' });
    inventoryService.completeStockTransfer.mockResolvedValue(false);

    const result = await runStockTransferWorkflow({
      userId: 'user-1',
      productId: 'prod-1',
      fromWarehouseId: 'wh-a',
      toWarehouseId: 'wh-b',
      quantity: 5,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('advanceFulfillmentWorkflow creates tasks sequentially', async () => {
    orderService.createFulfillmentTask.mockResolvedValue({ id: 'task-1' });
    orderService.updateFulfillmentTask.mockResolvedValue(true);

    const result = await advanceFulfillmentWorkflow({
      orderId: 'order-42',
      tasks: [
        { type: 'pick', nextStatus: 'completed' },
        { type: 'pack', nextStatus: 'completed' },
      ],
    });

    expect(orderService.createFulfillmentTask).toHaveBeenCalledTimes(2);
    expect(orderService.updateFulfillmentTask).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('advanceFulfillmentWorkflow reports task errors', async () => {
    orderService.createFulfillmentTask
      .mockResolvedValueOnce({ id: 'task-1' })
      .mockResolvedValueOnce(null);
    orderService.updateFulfillmentTask.mockResolvedValueOnce(false);

    const result = await advanceFulfillmentWorkflow({
      orderId: 'order-42',
      tasks: [
        { type: 'pick', nextStatus: 'completed' },
        { type: 'pack', nextStatus: 'completed' },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
