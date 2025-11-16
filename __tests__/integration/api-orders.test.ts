/**
 * Integration tests for Order API endpoints
 */
import { mockApiResponse, mockApiError } from './setup';
import { createMockOrderItem, createMockOrderItems } from '../factories';

describe('Order API Integration', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  describe('GET /api/orders', () => {
    it('should fetch all orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          items: createMockOrderItems(2),
          totalPrice: 200,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ orders: mockOrders })
      );

      const response = await fetch('/api/orders');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.orders).toHaveLength(1);
      expect(data.orders[0]).toHaveProperty('id');
      expect(data.orders[0]).toHaveProperty('items');
    });

    it('should handle empty orders list', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ orders: [] })
      );

      const response = await fetch('/api/orders');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.orders).toEqual([]);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiError('Failed to fetch orders', 500)
      );

      const response = await fetch('/api/orders');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch orders');
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const newOrder = {
        items: createMockOrderItems(2),
        customerName: 'Test Customer',
        status: 'pending',
      };

      const mockResponse = {
        id: 'order-123',
        ...newOrder,
        totalPrice: 200,
        createdAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse(mockResponse, 201)
      );

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.items).toHaveLength(2);
    });

    it('should validate order data', async () => {
      const invalidOrder = {
        items: [], // Empty items should fail
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiError('Order must have at least one item', 400)
      );

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidOrder),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toContain('item');
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update an existing order', async () => {
      const orderId = 'order-123';
      const updates = {
        status: 'completed',
        items: createMockOrderItems(3),
      };

      const mockResponse = {
        id: orderId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse(mockResponse)
      );

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBe(orderId);
      expect(data.status).toBe('completed');
      expect(data.items).toHaveLength(3);
    });

    it('should handle non-existent orders', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiError('Order not found', 404)
      );

      const response = await fetch('/api/orders/non-existent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should delete an order', async () => {
      const orderId = 'order-123';

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ success: true, id: orderId })
      );

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.id).toBe(orderId);
    });

    it('should handle deletion errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiError('Cannot delete order with status completed', 400)
      );

      const response = await fetch('/api/orders/order-123', {
        method: 'DELETE',
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot delete');
    });
  });
});
