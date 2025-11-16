/**
 * Tax Calculation Tests
 * Tests for tax configurations, calculations, and regional settings
 */

import {
  getAllTaxConfigs,
  getActiveTaxConfigs,
  getTaxConfigById,
  createTaxConfig,
  saveTaxConfig,
  updateTaxConfig,
  deleteTaxConfig,
  calculateTax,
  calculateItemsSubtotal,
  calculateItemsTotal,
  calculateItemTax,
  isItemTaxExempt,
  recordTaxCalculation,
  getTaxHistory,
  getTaxStatistics,
  exportTaxReport,
  getDefaultTaxConfigs,
  validateTaxConfig,
  duplicateTaxConfig,
} from '@/lib/utils/tax-calculation';
import { createMockOrderItem, createMockOrderItems, createMockTaxConfig } from '../factories';

describe('Tax Calculation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createTaxConfig', () => {
    it('should create tax configuration', () => {
      const config = createTaxConfig({
        name: 'VAT',
        type: 'vat',
        rate: 7,
        isInclusive: false,
        isActive: true,
      });

      expect(config.id).toBeDefined();
      expect(config.createdAt).toBeInstanceOf(Date);
      expect(config.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', () => {
      const config1 = createTaxConfig({ name: 'Tax 1', type: 'vat', rate: 7, isInclusive: false, isActive: true });
      const config2 = createTaxConfig({ name: 'Tax 2', type: 'vat', rate: 10, isInclusive: false, isActive: true });

      expect(config1.id).not.toBe(config2.id);
    });
  });

  describe('saveTaxConfig and getTaxConfig', () => {
    it('should save and retrieve tax configuration', () => {
      const config = createMockTaxConfig({ name: 'Test Tax' });

      saveTaxConfig(config);
      const retrieved = getTaxConfigById(config.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Test Tax');
    });

    it('should update existing configuration', () => {
      const config = createMockTaxConfig({ name: 'Original' });

      saveTaxConfig(config);
      saveTaxConfig({ ...config, name: 'Updated' });

      const configs = getAllTaxConfigs();

      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('Updated');
    });

    it('should limit to 50 configurations', () => {
      for (let i = 0; i < 60; i++) {
        const config = createMockTaxConfig({ name: `Tax ${i}` });
        saveTaxConfig(config);
      }

      const configs = getAllTaxConfigs();

      expect(configs.length).toBeLessThanOrEqual(50);
    });
  });

  describe('getActiveTaxConfigs', () => {
    it('should return only active configurations', () => {
      saveTaxConfig(createMockTaxConfig({ name: 'Active 1', isActive: true }));
      saveTaxConfig(createMockTaxConfig({ name: 'Inactive', isActive: false }));
      saveTaxConfig(createMockTaxConfig({ name: 'Active 2', isActive: true }));

      const active = getActiveTaxConfigs();

      expect(active).toHaveLength(2);
      expect(active.every(c => c.isActive)).toBe(true);
    });
  });

  describe('updateTaxConfig', () => {
    it('should update tax configuration', () => {
      const config = createMockTaxConfig({ name: 'Original', rate: 7 });

      saveTaxConfig(config);
      const updated = updateTaxConfig(config.id, { rate: 10 });

      expect(updated).not.toBeNull();
      expect(updated!.rate).toBe(10);
      expect(updated!.name).toBe('Original');
    });

    it('should update updatedAt timestamp', () => {
      const config = createMockTaxConfig();
      saveTaxConfig(config);

      const originalTime = config.updatedAt.getTime();

      // Wait a bit to ensure timestamp changes
      jest.advanceTimersByTime(100);

      const updated = updateTaxConfig(config.id, { rate: 10 });

      expect(updated!.updatedAt.getTime()).toBeGreaterThan(originalTime);
    });

    it('should return null for non-existent config', () => {
      const updated = updateTaxConfig('non-existent', { rate: 10 });

      expect(updated).toBeNull();
    });
  });

  describe('deleteTaxConfig', () => {
    it('should delete tax configuration', () => {
      const config = createMockTaxConfig();

      saveTaxConfig(config);
      const deleted = deleteTaxConfig(config.id);

      expect(deleted).toBe(true);
      expect(getAllTaxConfigs()).toHaveLength(0);
    });

    it('should return false for non-existent config', () => {
      const deleted = deleteTaxConfig('non-existent');

      expect(deleted).toBe(false);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax with single tax config', () => {
      const items = [
        createMockOrderItem({ quantity: 2, price: 100, discount: 0 }),
      ];

      const config = createMockTaxConfig({ rate: 7, isInclusive: false });

      const result = calculateTax(items, [config]);

      expect(result.subtotal).toBe(200);
      expect(result.taxAmount).toBe(14);
      expect(result.total).toBe(214);
    });

    it('should calculate tax with multiple configs', () => {
      const items = [
        createMockOrderItem({ quantity: 1, price: 100, discount: 0 }),
      ];

      const configs = [
        createMockTaxConfig({ name: 'Tax 1', rate: 7, isInclusive: false }),
        createMockTaxConfig({ name: 'Tax 2', rate: 3, isInclusive: false }),
      ];

      const result = calculateTax(items, configs);

      expect(result.taxAmount).toBe(10);
      expect(result.total).toBe(110);
      expect(result.taxBreakdown).toHaveLength(2);
    });

    it('should handle tax-inclusive pricing', () => {
      const items = [
        createMockOrderItem({ quantity: 1, price: 107, discount: 0 }),
      ];

      const config = createMockTaxConfig({ rate: 7, isInclusive: false });

      const result = calculateTax(items, [config], true);

      expect(result.taxAmount).toBe(7);
    });

    it('should apply discounts before calculating tax', () => {
      const items = [
        createMockOrderItem({ quantity: 1, price: 100, discount: 20 }),
      ];

      const config = createMockTaxConfig({ rate: 10, isInclusive: false });

      const result = calculateTax(items, [config]);

      expect(result.subtotal).toBe(80);
      expect(result.taxAmount).toBe(8);
      expect(result.total).toBe(88);
    });

    it('should handle flat-fee tax type', () => {
      const items = [
        createMockOrderItem({ quantity: 1, price: 100, discount: 0 }),
      ];

      const config = createMockTaxConfig({ type: 'flat-fee', rate: 15, isInclusive: false });

      const result = calculateTax(items, [config]);

      expect(result.taxAmount).toBe(15);
    });

    it('should filter by applicable items', () => {
      const items = [
        createMockOrderItem({ productId: 'prod-1', price: 100, quantity: 1 }),
        createMockOrderItem({ productId: 'prod-2', price: 100, quantity: 1 }),
      ];

      const config = createMockTaxConfig({
        rate: 10,
        isInclusive: false,
        applicableItems: ['prod-1'],
      });

      const result = calculateTax(items, [config]);

      // Only prod-1 should be taxed
      expect(result.taxAmount).toBe(10);
    });

    it('should return zero tax when no configs provided', () => {
      const items = [
        createMockOrderItem({ quantity: 1, price: 100 }),
      ];

      const result = calculateTax(items, []);

      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(100);
    });

    it('should round tax amounts correctly', () => {
      const items = [
        createMockOrderItem({ quantity: 1, price: 33.33, discount: 0 }),
      ];

      const config = createMockTaxConfig({ rate: 7, isInclusive: false });

      const result = calculateTax(items, [config]);

      expect(result.taxAmount).toBe(2.33);
      expect(result.total).toBe(35.66);
    });

    it('should skip inactive tax configs', () => {
      const items = [
        createMockOrderItem({ quantity: 1, price: 100 }),
      ];

      const config = createMockTaxConfig({ rate: 10, isActive: false });

      const result = calculateTax(items, [config]);

      expect(result.taxAmount).toBe(0);
    });
  });

  describe('calculateItemsSubtotal', () => {
    it('should calculate subtotal from items', () => {
      const items = [
        createMockOrderItem({ quantity: 2, price: 50, discount: 10 }),
        createMockOrderItem({ quantity: 1, price: 100, discount: 0 }),
      ];

      const subtotal = calculateItemsSubtotal(items);

      expect(subtotal).toBe(190); // (2*50-10) + (1*100)
    });

    it('should handle items without discount', () => {
      const items = [
        createMockOrderItem({ quantity: 3, price: 25 }),
      ];

      const subtotal = calculateItemsSubtotal(items);

      expect(subtotal).toBe(75);
    });

    it('should return 0 for empty array', () => {
      expect(calculateItemsSubtotal([])).toBe(0);
    });
  });

  describe('calculateItemTax', () => {
    it('should calculate tax for single item', () => {
      const item = createMockOrderItem({ quantity: 1, price: 100, discount: 0 });
      const config = createMockTaxConfig({ rate: 7, isInclusive: false });

      const tax = calculateItemTax(item, [config]);

      expect(tax).toBe(7);
    });
  });

  describe('isItemTaxExempt', () => {
    it('should identify exempt items', () => {
      const item = createMockOrderItem({ productId: 'prod-exempt' });

      const isExempt = isItemTaxExempt(item, ['prod-exempt']);

      expect(isExempt).toBe(true);
    });

    it('should identify non-exempt items', () => {
      const item = createMockOrderItem({ productId: 'prod-1' });

      const isExempt = isItemTaxExempt(item, ['prod-exempt']);

      expect(isExempt).toBe(false);
    });

    it('should return false when no exempt list provided', () => {
      const item = createMockOrderItem();

      const isExempt = isItemTaxExempt(item);

      expect(isExempt).toBe(false);
    });
  });

  describe('recordTaxCalculation', () => {
    it('should record tax calculation', () => {
      const items = [createMockOrderItem()];
      const configs = [createMockTaxConfig()];

      const record = recordTaxCalculation(items, configs, 'Test note');

      expect(record.id).toBeDefined();
      expect(record.date).toBeInstanceOf(Date);
      expect(record.notes).toBe('Test note');
      expect(record.calculation).toBeDefined();
    });

    it('should save record to history', () => {
      const items = [createMockOrderItem()];
      const configs = [createMockTaxConfig()];

      recordTaxCalculation(items, configs);

      const history = getTaxHistory();

      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('getTaxHistory', () => {
    it('should get tax history', () => {
      const items = [createMockOrderItem()];
      const configs = [createMockTaxConfig()];

      recordTaxCalculation(items, configs);
      recordTaxCalculation(items, configs);

      const history = getTaxHistory();

      expect(history).toHaveLength(2);
    });

    it('should limit history by parameter', () => {
      const items = [createMockOrderItem()];
      const configs = [createMockTaxConfig()];

      for (let i = 0; i < 10; i++) {
        recordTaxCalculation(items, configs);
      }

      const history = getTaxHistory(5);

      expect(history).toHaveLength(5);
    });

    it('should return most recent first', () => {
      const items = [createMockOrderItem()];
      const configs = [createMockTaxConfig()];

      recordTaxCalculation(items, configs, 'First');
      jest.advanceTimersByTime(100);
      recordTaxCalculation(items, configs, 'Second');

      const history = getTaxHistory();

      expect(history[0].notes).toBe('Second');
    });
  });

  describe('getTaxStatistics', () => {
    it('should calculate tax statistics', () => {
      const items = [createMockOrderItem({ quantity: 1, price: 100 })];
      const config = createMockTaxConfig({ rate: 10 });

      recordTaxCalculation(items, [config]);
      recordTaxCalculation(items, [config]);

      const stats = getTaxStatistics();

      expect(stats.totalTaxCollected).toBe(20);
      expect(stats.transactionCount).toBe(2);
      expect(stats.averageTaxRate).toBe(10);
    });

    it('should aggregate tax by type', () => {
      const items = [createMockOrderItem({ quantity: 1, price: 100 })];
      const vat = createMockTaxConfig({ name: 'VAT', rate: 7 });
      const gst = createMockTaxConfig({ name: 'GST', rate: 3 });

      recordTaxCalculation(items, [vat, gst]);

      const stats = getTaxStatistics();

      expect(stats.taxTypeBreakdown['VAT']).toBe(7);
      expect(stats.taxTypeBreakdown['GST']).toBe(3);
    });
  });

  describe('exportTaxReport', () => {
    it('should export tax report for period', () => {
      const items = [createMockOrderItem()];
      const config = [createMockTaxConfig()];

      recordTaxCalculation(items, config);

      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date(Date.now() + 86400000);

      const report = exportTaxReport(startDate, endDate);

      expect(report.period).toBeDefined();
      expect(report.statistics).toBeDefined();
      expect(report.records.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultTaxConfigs', () => {
    it('should get Thailand default tax config', () => {
      const configs = getDefaultTaxConfigs('thailand');

      expect(configs).toHaveLength(1);
      expect(configs[0].type).toBe('vat');
      expect(configs[0].rate).toBe(7);
      expect(configs[0].isInclusive).toBe(true);
    });

    it('should get US default tax config', () => {
      const configs = getDefaultTaxConfigs('us');

      expect(configs).toHaveLength(1);
      expect(configs[0].type).toBe('sales-tax');
      expect(configs[0].isInclusive).toBe(false);
    });

    it('should get EU default tax config', () => {
      const configs = getDefaultTaxConfigs('eu');

      expect(configs).toHaveLength(1);
      expect(configs[0].type).toBe('vat');
      expect(configs[0].rate).toBe(21);
    });

    it('should return empty for custom region', () => {
      const configs = getDefaultTaxConfigs('custom');

      expect(configs).toHaveLength(0);
    });
  });

  describe('validateTaxConfig', () => {
    it('should validate valid configuration', () => {
      const config = {
        name: 'VAT',
        type: 'vat' as const,
        rate: 7,
      };

      const result = validateTaxConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing name', () => {
      const config = {
        type: 'vat' as const,
        rate: 7,
      };

      const result = validateTaxConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tax name is required');
    });

    it('should reject missing type', () => {
      const config = {
        name: 'VAT',
        rate: 7,
      };

      const result = validateTaxConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tax type is required');
    });

    it('should reject negative rate', () => {
      const config = {
        name: 'VAT',
        type: 'vat' as const,
        rate: -5,
      };

      const result = validateTaxConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tax rate must be non-negative');
    });

    it('should reject percentage rate over 100', () => {
      const config = {
        name: 'Tax',
        type: 'percentage' as const,
        rate: 150,
      };

      const result = validateTaxConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Percentage tax rate cannot exceed 100%');
    });
  });

  describe('duplicateTaxConfig', () => {
    it('should duplicate tax configuration', () => {
      const config = createMockTaxConfig({ name: 'Original' });

      saveTaxConfig(config);
      const duplicate = duplicateTaxConfig(config.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate!.id).not.toBe(config.id);
      expect(duplicate!.name).toBe('Original (copy)');
    });

    it('should use custom name if provided', () => {
      const config = createMockTaxConfig({ name: 'Original' });

      saveTaxConfig(config);
      const duplicate = duplicateTaxConfig(config.id, 'Custom Name');

      expect(duplicate!.name).toBe('Custom Name');
    });

    it('should return null for non-existent config', () => {
      const duplicate = duplicateTaxConfig('non-existent');

      expect(duplicate).toBeNull();
    });
  });
});
