/**
 * Analytics Tests
 * Tests for sales statistics, product analysis, and reporting
 */

import {
  calculateSalesStats,
  analyzeProducts,
  getTopProducts,
  analyzeByTimeRange,
  analyzeDiscounts,
  calculateGrowth,
  getOrderStats,
  identifyTrends,
  exportAnalytics,
} from '@/lib/utils/analytics';
import { createMockOrderItem, createMockOrderItems, createMockOrders } from '../factories';

describe('Analytics', () => {
  describe('calculateSalesStats', () => {
    it('should calculate sales statistics', () => {
      const orders = [
        [
          createMockOrderItem({ quantity: 2, price: 100, discount: 10 }),
          createMockOrderItem({ quantity: 1, price: 50, discount: 0 }),
        ],
        [
          createMockOrderItem({ quantity: 3, price: 75, discount: 15 }),
        ],
      ];

      const stats = calculateSalesStats(orders);

      expect(stats.totalRevenue).toBe(415); // (2*100-10) + 50 + (3*75-15)
      expect(stats.totalOrders).toBe(2);
      expect(stats.totalItems).toBe(6);
      expect(stats.averageOrderValue).toBe(207.5);
      expect(stats.totalDiscounts).toBe(25);
    });

    it('should handle empty orders', () => {
      const stats = calculateSalesStats([]);

      expect(stats.totalRevenue).toBe(0);
      expect(stats.totalOrders).toBe(0);
      expect(stats.totalItems).toBe(0);
      expect(stats.averageOrderValue).toBe(0);
    });

    it('should calculate average item price correctly', () => {
      const orders = [
        [
          createMockOrderItem({ price: 100 }),
          createMockOrderItem({ price: 200 }),
        ],
      ];

      const stats = calculateSalesStats(orders);

      expect(stats.averageItemPrice).toBe(150);
    });
  });

  describe('analyzeProducts', () => {
    it('should analyze product sales', () => {
      const orders = [
        [
          createMockOrderItem({ productId: 'prod-1', productName: 'Product 1', quantity: 2, price: 100 }),
          createMockOrderItem({ productId: 'prod-2', productName: 'Product 2', quantity: 1, price: 50 }),
        ],
        [
          createMockOrderItem({ productId: 'prod-1', productName: 'Product 1', quantity: 3, price: 100 }),
        ],
      ];

      const analysis = analyzeProducts(orders);

      expect(analysis).toHaveLength(2);

      const prod1 = analysis.find(p => p.productId === 'prod-1');
      expect(prod1!.unitsSold).toBe(5);
      expect(prod1!.frequency).toBe(2);
      expect(prod1!.revenue).toBe(500);
    });

    it('should sort products by revenue in descending order', () => {
      const orders = [
        [
          createMockOrderItem({ productId: 'prod-1', quantity: 1, price: 100 }),
          createMockOrderItem({ productId: 'prod-2', quantity: 1, price: 200 }),
        ],
      ];

      const analysis = analyzeProducts(orders);

      expect(analysis[0].productId).toBe('prod-2');
      expect(analysis[1].productId).toBe('prod-1');
    });

    it('should handle discounts in revenue calculation', () => {
      const orders = [
        [
          createMockOrderItem({
            productId: 'prod-1',
            quantity: 2,
            price: 100,
            discount: 20,
          }),
        ],
      ];

      const analysis = analyzeProducts(orders);

      expect(analysis[0].revenue).toBe(180); // 2*100 - 20
      expect(analysis[0].discountAmount).toBe(20);
    });
  });

  describe('getTopProducts', () => {
    it('should get top products by revenue', () => {
      const orders = createMockOrders(5, 10);

      const top = getTopProducts(orders, 5, 'revenue');

      expect(top).toHaveLength(5);
    });

    it('should get top products by units sold', () => {
      const orders = [
        [
          createMockOrderItem({ productId: 'prod-1', quantity: 10, price: 50 }),
          createMockOrderItem({ productId: 'prod-2', quantity: 5, price: 100 }),
        ],
      ];

      const top = getTopProducts(orders, 2, 'units');

      expect(top[0].productId).toBe('prod-1');
      expect(top[0].unitsSold).toBe(10);
    });

    it('should limit results to specified count', () => {
      const orders = createMockOrders(3, 10);

      const top = getTopProducts(orders, 3);

      expect(top.length).toBeLessThanOrEqual(3);
    });
  });

  describe('analyzeByTimeRange', () => {
    it('should group orders by day', () => {
      const orders = [
        {
          items: [createMockOrderItem({ quantity: 1, price: 100 })],
          date: new Date('2024-11-16'),
        },
        {
          items: [createMockOrderItem({ quantity: 2, price: 50 })],
          date: new Date('2024-11-16'),
        },
        {
          items: [createMockOrderItem({ quantity: 1, price: 200 })],
          date: new Date('2024-11-17'),
        },
      ];

      const analysis = analyzeByTimeRange(orders, 'day');

      expect(analysis.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate revenue per time period', () => {
      const orders = [
        {
          items: [
            createMockOrderItem({ quantity: 2, price: 100, discount: 10 }),
          ],
          date: new Date('2024-11-16'),
        },
        {
          items: [
            createMockOrderItem({ quantity: 1, price: 50, discount: 0 }),
          ],
          date: new Date('2024-11-16'),
        },
      ];

      const analysis = analyzeByTimeRange(orders, 'day');

      expect(analysis[0].revenue).toBe(240); // (2*100-10) + 50
      expect(analysis[0].orderCount).toBe(2);
    });

    it('should track item count per period', () => {
      const orders = [
        {
          items: [
            createMockOrderItem({ quantity: 3 }),
            createMockOrderItem({ quantity: 2 }),
          ],
          date: new Date('2024-11-16'),
        },
      ];

      const analysis = analyzeByTimeRange(orders, 'day');

      expect(analysis[0].itemCount).toBe(5);
    });

    it('should calculate average order value', () => {
      const orders = [
        {
          items: [createMockOrderItem({ quantity: 1, price: 100 })],
          date: new Date('2024-11-16'),
        },
        {
          items: [createMockOrderItem({ quantity: 1, price: 200 })],
          date: new Date('2024-11-16'),
        },
      ];

      const analysis = analyzeByTimeRange(orders, 'day');

      expect(analysis[0].averageOrderValue).toBe(150);
    });
  });

  describe('analyzeDiscounts', () => {
    it('should analyze discount impact', () => {
      const orders = [
        [
          createMockOrderItem({ quantity: 1, price: 100, discount: 10 }),
          createMockOrderItem({ quantity: 1, price: 50, discount: 5 }),
        ],
        [
          createMockOrderItem({ quantity: 2, price: 75, discount: 0 }),
        ],
      ];

      const analysis = analyzeDiscounts(orders);

      expect(analysis.totalDiscounts).toBe(15);
      expect(analysis.discountedOrders).toBe(1);
      expect(analysis.averageDiscountPerOrder).toBe(15);
    });

    it('should calculate discount percentage', () => {
      const orders = [
        [
          createMockOrderItem({ quantity: 1, price: 100, discount: 10 }),
        ],
      ];

      const analysis = analyzeDiscounts(orders);

      expect(analysis.discountPercentage).toBe(10);
    });

    it('should handle orders without discounts', () => {
      const orders = [
        [
          createMockOrderItem({ quantity: 1, price: 100, discount: 0 }),
        ],
      ];

      const analysis = analyzeDiscounts(orders);

      expect(analysis.totalDiscounts).toBe(0);
      expect(analysis.discountedOrders).toBe(0);
      expect(analysis.averageDiscountPerOrder).toBe(0);
    });
  });

  describe('calculateGrowth', () => {
    it('should calculate growth metrics', () => {
      const previousPeriod = [
        [createMockOrderItem({ quantity: 1, price: 100 })],
        [createMockOrderItem({ quantity: 1, price: 100 })],
      ];

      const currentPeriod = [
        [createMockOrderItem({ quantity: 1, price: 150 })],
        [createMockOrderItem({ quantity: 1, price: 150 })],
        [createMockOrderItem({ quantity: 1, price: 150 })],
      ];

      const growth = calculateGrowth(previousPeriod, currentPeriod);

      expect(growth.revenueGrowth).toBeGreaterThan(0);
      expect(growth.orderGrowth).toBe(50); // From 2 to 3 orders
    });

    it('should detect upward trend', () => {
      const previousPeriod = [
        [createMockOrderItem({ quantity: 1, price: 100 })],
      ];

      const currentPeriod = [
        [createMockOrderItem({ quantity: 2, price: 200 })],
        [createMockOrderItem({ quantity: 2, price: 200 })],
      ];

      const growth = calculateGrowth(previousPeriod, currentPeriod);

      expect(growth.trend).toBe('up');
    });

    it('should detect downward trend', () => {
      const previousPeriod = [
        [createMockOrderItem({ quantity: 2, price: 200 })],
        [createMockOrderItem({ quantity: 2, price: 200 })],
      ];

      const currentPeriod = [
        [createMockOrderItem({ quantity: 1, price: 100 })],
      ];

      const growth = calculateGrowth(previousPeriod, currentPeriod);

      expect(growth.trend).toBe('down');
    });

    it('should detect stable trend', () => {
      const previousPeriod = [
        [createMockOrderItem({ quantity: 1, price: 100 })],
      ];

      const currentPeriod = [
        [createMockOrderItem({ quantity: 1, price: 102 })],
      ];

      const growth = calculateGrowth(previousPeriod, currentPeriod);

      expect(growth.trend).toBe('stable');
    });
  });

  describe('getOrderStats', () => {
    it('should calculate order statistics', () => {
      const orders = [
        [createMockOrderItem({ quantity: 1, price: 100 })],
        [createMockOrderItem({ quantity: 1, price: 200 })],
        [createMockOrderItem({ quantity: 1, price: 150 })],
        [createMockOrderItem({ quantity: 1, price: 300 })],
        [createMockOrderItem({ quantity: 1, price: 50 })],
      ];

      const stats = getOrderStats(orders);

      expect(stats.min).toBe(50);
      expect(stats.max).toBe(300);
      expect(stats.average).toBe(160);
      expect(stats.median).toBe(150);
      expect(stats.stdDev).toBeGreaterThan(0);
    });

    it('should calculate median for even number of orders', () => {
      const orders = [
        [createMockOrderItem({ quantity: 1, price: 100 })],
        [createMockOrderItem({ quantity: 1, price: 200 })],
        [createMockOrderItem({ quantity: 1, price: 300 })],
        [createMockOrderItem({ quantity: 1, price: 400 })],
      ];

      const stats = getOrderStats(orders);

      expect(stats.median).toBe(250); // Average of 200 and 300
    });

    it('should handle empty orders', () => {
      const stats = getOrderStats([]);

      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.average).toBe(0);
    });
  });

  describe('identifyTrends', () => {
    it('should identify rising products', () => {
      const products = [
        {
          productId: 'prod-1',
          productName: 'Rising Product',
          unitsSold: 100,
          revenue: 1000,
          averagePrice: 10,
          discountAmount: 0,
          frequency: 10,
        },
      ];

      const trends = identifyTrends(products);

      expect(trends.rising).toHaveLength(1);
      expect(trends.rising[0].productId).toBe('prod-1');
    });

    it('should identify declining products', () => {
      const products = [
        {
          productId: 'prod-1',
          productName: 'Declining Product',
          unitsSold: 15,
          revenue: 150,
          averagePrice: 10,
          discountAmount: 0,
          frequency: 15,
        },
      ];

      const trends = identifyTrends(products);

      expect(trends.declining).toHaveLength(1);
    });

    it('should identify stable products', () => {
      const products = [
        {
          productId: 'prod-1',
          productName: 'Stable Product',
          unitsSold: 20,
          revenue: 200,
          averagePrice: 10,
          discountAmount: 0,
          frequency: 8,
        },
      ];

      const trends = identifyTrends(products);

      expect(trends.stable).toHaveLength(1);
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics as JSON', () => {
      const orders = [
        [createMockOrderItem({ quantity: 1, price: 100 })],
        [createMockOrderItem({ quantity: 2, price: 50 })],
      ];

      const json = exportAnalytics(orders);
      const data = JSON.parse(json);

      expect(data.exportDate).toBeDefined();
      expect(data.salesStats).toBeDefined();
      expect(data.productAnalytics).toBeDefined();
      expect(data.discountAnalysis).toBeDefined();
      expect(data.orderStatistics).toBeDefined();
      expect(data.topProducts).toBeDefined();
    });

    it('should include top 10 products', () => {
      const orders = createMockOrders(5, 15);

      const json = exportAnalytics(orders);
      const data = JSON.parse(json);

      expect(data.topProducts.length).toBeLessThanOrEqual(10);
    });

    it('should use custom filename', () => {
      const orders = [[createMockOrderItem()]];

      const json = exportAnalytics(orders, 'custom.json');

      expect(json).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle orders with zero prices', () => {
      const orders = [
        [createMockOrderItem({ quantity: 1, price: 0 })],
      ];

      const stats = calculateSalesStats(orders);

      expect(stats.totalRevenue).toBe(0);
      expect(stats.averageOrderValue).toBe(0);
    });

    it('should handle very large quantities', () => {
      const orders = [
        [createMockOrderItem({ quantity: 10000, price: 1 })],
      ];

      const stats = calculateSalesStats(orders);

      expect(stats.totalRevenue).toBe(10000);
      expect(stats.totalItems).toBe(10000);
    });

    it('should handle orders with negative discounts (markup)', () => {
      const orders = [
        [createMockOrderItem({ quantity: 1, price: 100, discount: -10 })],
      ];

      const stats = calculateSalesStats(orders);

      expect(stats.totalRevenue).toBe(110);
    });

    it('should handle single item orders', () => {
      const orders = [[createMockOrderItem()]];

      const analysis = analyzeProducts(orders);

      expect(analysis).toHaveLength(1);
    });

    it('should handle products with same revenue', () => {
      const orders = [
        [
          createMockOrderItem({ productId: 'prod-1', quantity: 1, price: 100 }),
          createMockOrderItem({ productId: 'prod-2', quantity: 1, price: 100 }),
        ],
      ];

      const analysis = analyzeProducts(orders);

      expect(analysis).toHaveLength(2);
      expect(analysis[0].revenue).toBe(analysis[1].revenue);
    });
  });
});
