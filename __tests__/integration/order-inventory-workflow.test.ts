/**
 * Integration-style tests for order + inventory workflow
 */
import { processOrderInventoryWorkflow } from '@/lib/workflows/order-inventory';
import type { Order } from '@/types';

jest.mock('@/lib/supabase/database', () => ({
  createOrder: jest.fn(),
}));

jest.mock('@/lib/inventory/service', () => ({
  updateStockLevel: jest.fn(),
}));

const { createOrder } = jest.requireMock('@/lib/supabase/database');
const { updateStockLevel } = jest.requireMock('@/lib/inventory/service');

const baseOrder: Order = {
  id: 'order-001',
  customerId: 'cust-001',
  customerName: 'คุณลลิตา',
  items: [
    {
      productId: 'prod-001',
      productName: 'สินค้า A',
      quantity: 2,
      price: 500,
    },
    {
      productId: 'prod-002',
      productName: 'สินค้า B',
      quantity: 1,
      price: 1200,
    },
  ],
  subtotal: 2200,
  tax: 154,
  shipping: 80,
  total: 2434,
  status: 'pending',
  channel: 'online',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('processOrderInventoryWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates order and adjusts inventory for each item', async () => {
    createOrder.mockResolvedValue({ success: true, data: baseOrder, error: null });
    updateStockLevel.mockResolvedValue(true);

    const result = await processOrderInventoryWorkflow(baseOrder, {
      userId: 'user-001',
      warehouseId: 'warehouse-001',
    });

    expect(createOrder).toHaveBeenCalledWith(baseOrder);
    expect(updateStockLevel).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.stockAdjustments.every((adj) => adj.success)).toBe(true);
  });

  it('returns failure when order creation fails', async () => {
    createOrder.mockResolvedValue({
      success: false,
      data: null,
      error: { message: 'DB down' },
    });

    const result = await processOrderInventoryWorkflow(baseOrder, {
      userId: 'user-001',
      warehouseId: 'warehouse-001',
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('DB down');
    expect(updateStockLevel).not.toHaveBeenCalled();
  });

  it('reports inventory adjustment failure', async () => {
    createOrder.mockResolvedValue({ success: true, data: baseOrder, error: null });
    updateStockLevel
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await processOrderInventoryWorkflow(baseOrder, {
      userId: 'user-001',
      warehouseId: 'warehouse-001',
      allowPartialFulfillment: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.stockAdjustments).toHaveLength(2);
    expect(result.stockAdjustments[1].success).toBe(false);
  });
});
