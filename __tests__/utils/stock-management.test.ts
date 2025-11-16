/**
 * Stock Management Tests
 * Tests for stock tracking, movements, alerts, and forecasting
 */

import {
  getStockLevel,
  getAllStockLevels,
  updateStockLevel,
  initializeStock,
  recordMovement,
  getMovementHistory,
  getAllMovements,
  checkStockAlerts,
  getAllAlerts,
  acknowledgeAlert,
  getLowStockProducts,
  getOutOfStockProducts,
  forecastStock,
} from '@/lib/utils/stock-management';
import { createMockStockLevel, createMockStockMovement } from '../factories';

describe('Stock Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initializeStock', () => {
    it('should initialize stock for a new product', () => {
      const stock = initializeStock('prod-1', 'Product 1', 50, 10, 100);

      expect(stock.productId).toBe('prod-1');
      expect(stock.currentStock).toBe(50);
      expect(stock.minimumStock).toBe(10);
      expect(stock.maximumStock).toBe(100);
      expect(stock.status).toBe('in-stock');
    });

    it('should set status to out-of-stock when quantity is 0', () => {
      const stock = initializeStock('prod-1', 'Product 1', 0);

      expect(stock.status).toBe('out-of-stock');
    });

    it('should set status to critical when quantity equals minimum', () => {
      const stock = initializeStock('prod-1', 'Product 1', 5, 5);

      expect(stock.status).toBe('critical');
    });

    it('should set status to critical when quantity is below minimum', () => {
      const stock = initializeStock('prod-1', 'Product 1', 3, 5);

      expect(stock.status).toBe('critical');
    });

    it('should throw error for duplicate product', () => {
      initializeStock('prod-1', 'Product 1', 50);

      expect(() => initializeStock('prod-1', 'Product 1', 50)).toThrow(
        'Product stock already exists'
      );
    });

    it('should record initial movement', () => {
      initializeStock('prod-1', 'Product 1', 50);

      const movements = getMovementHistory('prod-1');

      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('in');
      expect(movements[0].quantity).toBe(50);
      expect(movements[0].reason).toBe('Initial stock');
    });
  });

  describe('getStockLevel', () => {
    it('should get stock level by product ID', () => {
      initializeStock('prod-1', 'Product 1', 50);

      const stock = getStockLevel('prod-1');

      expect(stock).not.toBeNull();
      expect(stock!.productId).toBe('prod-1');
      expect(stock!.currentStock).toBe(50);
    });

    it('should return null for non-existent product', () => {
      const stock = getStockLevel('non-existent');

      expect(stock).toBeNull();
    });

    it('should parse dates correctly', () => {
      initializeStock('prod-1', 'Product 1', 50);

      const stock = getStockLevel('prod-1');

      expect(stock!.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('getAllStockLevels', () => {
    it('should get all stock levels', () => {
      initializeStock('prod-1', 'Product 1', 50);
      initializeStock('prod-2', 'Product 2', 30);

      const stocks = getAllStockLevels();

      expect(stocks).toHaveLength(2);
    });

    it('should return empty array when no stock', () => {
      const stocks = getAllStockLevels();

      expect(stocks).toHaveLength(0);
    });
  });

  describe('updateStockLevel', () => {
    beforeEach(() => {
      initializeStock('prod-1', 'Product 1', 50, 10, 100);
    });

    it('should increase stock level', () => {
      const updated = updateStockLevel('prod-1', 20);

      expect(updated).not.toBeNull();
      expect(updated!.currentStock).toBe(70);
    });

    it('should decrease stock level', () => {
      const updated = updateStockLevel('prod-1', -20);

      expect(updated).not.toBeNull();
      expect(updated!.currentStock).toBe(30);
    });

    it('should not go below zero', () => {
      const updated = updateStockLevel('prod-1', -100);

      expect(updated!.currentStock).toBe(0);
    });

    it('should update status based on new quantity', () => {
      const updated = updateStockLevel('prod-1', -45);

      expect(updated!.currentStock).toBe(5);
      expect(updated!.status).toBe('critical');
    });

    it('should set status to out-of-stock when reaching zero', () => {
      const updated = updateStockLevel('prod-1', -50);

      expect(updated!.status).toBe('out-of-stock');
    });

    it('should set status to low-stock when near minimum', () => {
      const updated = updateStockLevel('prod-1', -35); // Results in 15, which is <= min * 1.5

      expect(updated!.status).toBe('low-stock');
    });

    it('should update minimum and maximum stock if provided', () => {
      const updated = updateStockLevel('prod-1', 0, {
        minimumStock: 20,
        maximumStock: 200,
      });

      expect(updated!.minimumStock).toBe(20);
      expect(updated!.maximumStock).toBe(200);
    });

    it('should record movement when updating stock', () => {
      updateStockLevel('prod-1', 10, {
        type: 'in',
        reason: 'Restock',
      });

      const movements = getMovementHistory('prod-1');
      const lastMovement = movements[movements.length - 1];

      expect(lastMovement.type).toBe('in');
      expect(lastMovement.quantity).toBe(10);
      expect(lastMovement.reason).toBe('Restock');
    });

    it('should return null for non-existent product', () => {
      const updated = updateStockLevel('non-existent', 10);

      expect(updated).toBeNull();
    });

    it('should check for alerts after update', () => {
      updateStockLevel('prod-1', -45); // Drops to 5, critical

      const alerts = getAllAlerts();

      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('recordMovement', () => {
    beforeEach(() => {
      initializeStock('prod-1', 'Product 1', 50);
    });

    it('should record stock movement', () => {
      const movement = recordMovement('prod-1', 'in', 20);

      expect(movement.productId).toBe('prod-1');
      expect(movement.type).toBe('in');
      expect(movement.quantity).toBe(20);
    });

    it('should record movement with metadata', () => {
      const movement = recordMovement('prod-1', 'out', 5, {
        reason: 'Customer order',
        updatedBy: 'user-1',
        notes: 'Rush order',
      });

      expect(movement.reason).toBe('Customer order');
      expect(movement.updatedBy).toBe('user-1');
      expect(movement.notes).toBe('Rush order');
    });

    it('should generate unique movement ID', () => {
      const movement1 = recordMovement('prod-1', 'in', 10);
      const movement2 = recordMovement('prod-1', 'in', 10);

      expect(movement1.id).not.toBe(movement2.id);
    });

    it('should limit movement history to 1000 per product', () => {
      for (let i = 0; i < 1100; i++) {
        recordMovement('prod-1', 'in', 1);
      }

      const movements = getMovementHistory('prod-1');

      expect(movements.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getMovementHistory', () => {
    beforeEach(() => {
      initializeStock('prod-1', 'Product 1', 50);
      initializeStock('prod-2', 'Product 2', 30);
    });

    it('should get movement history for specific product', () => {
      recordMovement('prod-1', 'in', 10);
      recordMovement('prod-1', 'out', 5);
      recordMovement('prod-2', 'in', 20);

      const movements = getMovementHistory('prod-1');

      expect(movements.length).toBeGreaterThanOrEqual(2);
      expect(movements.every(m => m.productId === 'prod-1')).toBe(true);
    });

    it('should parse timestamps correctly', () => {
      recordMovement('prod-1', 'in', 10);

      const movements = getMovementHistory('prod-1');

      expect(movements[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getAllMovements', () => {
    it('should get all movements across all products', () => {
      initializeStock('prod-1', 'Product 1', 50);
      initializeStock('prod-2', 'Product 2', 30);

      recordMovement('prod-1', 'in', 10);
      recordMovement('prod-2', 'out', 5);

      const movements = getAllMovements();

      expect(movements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('checkStockAlerts', () => {
    it('should create low-stock alert', () => {
      const stock = createMockStockLevel({
        productId: 'prod-1',
        currentStock: 12,
        minimumStock: 10,
        status: 'low-stock',
      });

      checkStockAlerts(stock);

      const alerts = getAllAlerts();
      const lowStockAlert = alerts.find(a => a.type === 'low-stock');

      expect(lowStockAlert).toBeDefined();
      expect(lowStockAlert!.productId).toBe('prod-1');
    });

    it('should create out-of-stock alert', () => {
      const stock = createMockStockLevel({
        productId: 'prod-1',
        currentStock: 0,
        status: 'out-of-stock',
      });

      checkStockAlerts(stock);

      const alerts = getAllAlerts();
      const outOfStockAlert = alerts.find(a => a.type === 'out-of-stock');

      expect(outOfStockAlert).toBeDefined();
    });

    it('should create overstock alert', () => {
      const stock = createMockStockLevel({
        productId: 'prod-1',
        currentStock: 150,
        maximumStock: 100,
        status: 'in-stock',
      });

      checkStockAlerts(stock);

      const alerts = getAllAlerts();
      const overstockAlert = alerts.find(a => a.type === 'overstock');

      expect(overstockAlert).toBeDefined();
    });

    it('should replace existing alert for same product', () => {
      const stock = createMockStockLevel({
        productId: 'prod-1',
        status: 'low-stock',
      });

      checkStockAlerts(stock);
      checkStockAlerts(stock);

      const alerts = getAllAlerts();
      const productAlerts = alerts.filter(a => a.productId === 'prod-1');

      expect(productAlerts).toHaveLength(1);
    });
  });

  describe('getAllAlerts', () => {
    it('should get all stock alerts', () => {
      const stock1 = createMockStockLevel({
        productId: 'prod-1',
        status: 'low-stock',
      });
      const stock2 = createMockStockLevel({
        productId: 'prod-2',
        status: 'out-of-stock',
      });

      checkStockAlerts(stock1);
      checkStockAlerts(stock2);

      const alerts = getAllAlerts();

      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });

    it('should parse dates correctly', () => {
      const stock = createMockStockLevel({ status: 'low-stock' });

      checkStockAlerts(stock);

      const alerts = getAllAlerts();

      expect(alerts[0].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert', () => {
      const stock = createMockStockLevel({
        productId: 'prod-1',
        status: 'low-stock',
      });

      checkStockAlerts(stock);
      const acknowledged = acknowledgeAlert('prod-1', 'low-stock');

      expect(acknowledged).toBe(true);

      const alerts = getAllAlerts();
      const alert = alerts.find(a => a.productId === 'prod-1');

      expect(alert!.acknowledged).toBe(true);
    });

    it('should return false for non-existent alert', () => {
      const acknowledged = acknowledgeAlert('non-existent', 'low-stock');

      expect(acknowledged).toBe(false);
    });
  });

  describe('getLowStockProducts', () => {
    it('should get products with low or critical stock', () => {
      initializeStock('prod-1', 'Product 1', 8, 10); // critical
      initializeStock('prod-2', 'Product 2', 12, 10); // low-stock
      initializeStock('prod-3', 'Product 3', 50, 10); // in-stock

      const lowStock = getLowStockProducts();

      expect(lowStock.length).toBeGreaterThanOrEqual(2);
      expect(lowStock.every(s => s.status === 'low-stock' || s.status === 'critical')).toBe(true);
    });
  });

  describe('getOutOfStockProducts', () => {
    it('should get products that are out of stock', () => {
      initializeStock('prod-1', 'Product 1', 0); // out-of-stock
      initializeStock('prod-2', 'Product 2', 50); // in-stock

      const outOfStock = getOutOfStockProducts();

      expect(outOfStock).toHaveLength(1);
      expect(outOfStock[0].status).toBe('out-of-stock');
    });
  });

  describe('forecastStock', () => {
    beforeEach(() => {
      initializeStock('prod-1', 'Product 1', 100, 10, 200);
    });

    it('should forecast stock levels for upcoming days', () => {
      // Record some outgoing movements
      for (let i = 0; i < 30; i++) {
        recordMovement('prod-1', 'out', 2);
      }

      const forecast = forecastStock('prod-1', 7);

      expect(forecast).toHaveLength(7);
      expect(forecast[0]).toHaveProperty('date');
      expect(forecast[0]).toHaveProperty('predictedStock');
    });

    it('should predict decreasing stock based on outflow', () => {
      // Record consistent outgoing movements
      for (let i = 0; i < 30; i++) {
        recordMovement('prod-1', 'out', 5);
      }

      const forecast = forecastStock('prod-1', 3);

      // Stock should decrease over time
      expect(forecast[0].predictedStock).toBeGreaterThan(forecast[2].predictedStock);
    });

    it('should not predict negative stock', () => {
      // Record large outgoing movements
      for (let i = 0; i < 30; i++) {
        recordMovement('prod-1', 'out', 10);
      }

      const forecast = forecastStock('prod-1', 30);

      expect(forecast.every(f => f.predictedStock >= 0)).toBe(true);
    });

    it('should return empty array for non-existent product', () => {
      const forecast = forecastStock('non-existent', 7);

      expect(forecast).toHaveLength(0);
    });

    it('should default to 7 days ahead', () => {
      for (let i = 0; i < 30; i++) {
        recordMovement('prod-1', 'out', 2);
      }

      const forecast = forecastStock('prod-1');

      expect(forecast).toHaveLength(7);
    });

    it('should handle products with no outflow movements', () => {
      const forecast = forecastStock('prod-1', 5);

      expect(forecast).toHaveLength(5);
      // Stock should remain constant
      expect(forecast.every(f => f.predictedStock === 100)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle localStorage errors gracefully', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const stock = getStockLevel('prod-1');

      expect(stock).toBeNull();
    });

    it('should handle corrupted data in localStorage', () => {
      localStorage.setItem('product_stock', 'invalid json');

      const stocks = getAllStockLevels();

      expect(stocks).toHaveLength(0);
    });

    it('should handle very large stock quantities', () => {
      const stock = initializeStock('prod-1', 'Product 1', 1000000, 100, 2000000);

      expect(stock.currentStock).toBe(1000000);
    });

    it('should handle rapid consecutive updates', () => {
      initializeStock('prod-1', 'Product 1', 50);

      for (let i = 0; i < 100; i++) {
        updateStockLevel('prod-1', 1);
      }

      const stock = getStockLevel('prod-1');

      expect(stock!.currentStock).toBe(150);
    });
  });
});
