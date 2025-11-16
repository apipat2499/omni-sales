/**
 * Advanced Filtering Tests
 * Tests for filter criteria, groups, and complex filtering logic
 */

import {
  applyCriterion,
  applyFilterGroup,
  applyMultipleFilters,
  getAllSavedFilters,
  saveSavedFilter,
  createSavedFilter,
  deleteSavedFilter,
  getSavedFilterById,
  searchSavedFilters,
  getFilterGroups,
  saveFilterGroup,
  createFilterGroup,
  deleteFilterGroup,
  presetFilters,
  exportFilters,
  importFilters,
} from '@/lib/utils/advanced-filtering';
import {
  createMockOrderItem,
  createMockOrderItems,
  createMockFilterCriterion,
  createMockFilterGroup,
  createMockSavedFilter,
} from '../factories';

describe('Advanced Filtering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('applyCriterion', () => {
    describe('equals operator', () => {
      it('should filter items by exact match', () => {
        const items = [
          createMockOrderItem({ id: 'item1', productName: 'Apple' }),
          createMockOrderItem({ id: 'item2', productName: 'Banana' }),
          createMockOrderItem({ id: 'item3', productName: 'Apple' }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'productName',
          operator: 'equals',
          value: 'Apple',
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(2);
        expect(result[0].productName).toBe('Apple');
        expect(result[1].productName).toBe('Apple');
      });

      it('should support case-insensitive matching', () => {
        const items = [
          createMockOrderItem({ productName: 'APPLE' }),
          createMockOrderItem({ productName: 'apple' }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'productName',
          operator: 'equals',
          value: 'Apple',
          caseSensitive: false,
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(2);
      });

      it('should be case-sensitive by default', () => {
        const items = [
          createMockOrderItem({ productName: 'APPLE' }),
          createMockOrderItem({ productName: 'apple' }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'productName',
          operator: 'equals',
          value: 'apple',
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(1);
      });
    });

    describe('contains operator', () => {
      it('should filter items containing substring', () => {
        const items = [
          createMockOrderItem({ productName: 'Apple Juice' }),
          createMockOrderItem({ productName: 'Banana' }),
          createMockOrderItem({ productName: 'Pineapple' }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'productName',
          operator: 'contains',
          value: 'apple',
          caseSensitive: false,
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(2);
      });

      it('should support case-sensitive contains', () => {
        const items = [
          createMockOrderItem({ productName: 'Apple' }),
          createMockOrderItem({ productName: 'apple' }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'productName',
          operator: 'contains',
          value: 'App',
          caseSensitive: true,
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(1);
        expect(result[0].productName).toBe('Apple');
      });
    });

    describe('comparison operators', () => {
      it('should filter with gt (greater than)', () => {
        const items = [
          createMockOrderItem({ price: 50 }),
          createMockOrderItem({ price: 100 }),
          createMockOrderItem({ price: 150 }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'price',
          operator: 'gt',
          value: 100,
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(1);
        expect(result[0].price).toBe(150);
      });

      it('should filter with gte (greater than or equal)', () => {
        const items = [
          createMockOrderItem({ price: 50 }),
          createMockOrderItem({ price: 100 }),
          createMockOrderItem({ price: 150 }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'price',
          operator: 'gte',
          value: 100,
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(2);
      });

      it('should filter with lt (less than)', () => {
        const items = [
          createMockOrderItem({ price: 50 }),
          createMockOrderItem({ price: 100 }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'price',
          operator: 'lt',
          value: 100,
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(1);
        expect(result[0].price).toBe(50);
      });

      it('should filter with lte (less than or equal)', () => {
        const items = [
          createMockOrderItem({ price: 50 }),
          createMockOrderItem({ price: 100 }),
          createMockOrderItem({ price: 150 }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'price',
          operator: 'lte',
          value: 100,
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(2);
      });
    });

    describe('between operator', () => {
      it('should filter values within range', () => {
        const items = [
          createMockOrderItem({ price: 50 }),
          createMockOrderItem({ price: 100 }),
          createMockOrderItem({ price: 150 }),
          createMockOrderItem({ price: 200 }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'price',
          operator: 'between',
          value: 75,
          value2: 175,
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(2);
        expect(result[0].price).toBe(100);
        expect(result[1].price).toBe(150);
      });
    });

    describe('in operator', () => {
      it('should filter items matching any value in array', () => {
        const items = [
          createMockOrderItem({ quantity: 1 }),
          createMockOrderItem({ quantity: 5 }),
          createMockOrderItem({ quantity: 10 }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'quantity',
          operator: 'in',
          value: [1, 10],
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(2);
      });
    });

    describe('regex operator', () => {
      it('should filter using regex pattern', () => {
        const items = [
          createMockOrderItem({ productName: 'Product-123' }),
          createMockOrderItem({ productName: 'Product-ABC' }),
          createMockOrderItem({ productName: 'Item-456' }),
        ];

        const criterion = createMockFilterCriterion({
          field: 'productName',
          operator: 'regex',
          value: '^Product-\\d+$',
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(1);
        expect(result[0].productName).toBe('Product-123');
      });

      it('should handle invalid regex gracefully', () => {
        const items = [createMockOrderItem()];

        const criterion = createMockFilterCriterion({
          field: 'productName',
          operator: 'regex',
          value: '[invalid(regex',
        });

        const result = applyCriterion(items, criterion);

        expect(result).toHaveLength(0);
      });
    });
  });

  describe('applyFilterGroup', () => {
    it('should apply AND logic for multiple criteria', () => {
      const items = [
        createMockOrderItem({ price: 100, quantity: 5 }),
        createMockOrderItem({ price: 200, quantity: 3 }),
        createMockOrderItem({ price: 150, quantity: 10 }),
      ];

      const group = createMockFilterGroup({
        criteria: [
          createMockFilterCriterion({ field: 'price', operator: 'gte', value: 100 }),
          createMockFilterCriterion({ field: 'quantity', operator: 'gte', value: 5 }),
        ],
        logic: 'and',
      });

      const result = applyFilterGroup(items, group);

      expect(result).toHaveLength(2);
    });

    it('should apply OR logic for multiple criteria', () => {
      const items = [
        createMockOrderItem({ id: 'item1', price: 50, quantity: 20 }),
        createMockOrderItem({ id: 'item2', price: 200, quantity: 2 }),
        createMockOrderItem({ id: 'item3', price: 75, quantity: 5 }),
      ];

      const group = createMockFilterGroup({
        criteria: [
          createMockFilterCriterion({ field: 'price', operator: 'gt', value: 150 }),
          createMockFilterCriterion({ field: 'quantity', operator: 'gt', value: 15 }),
        ],
        logic: 'or',
      });

      const result = applyFilterGroup(items, group);

      expect(result).toHaveLength(2);
      expect(result.find(i => i.id === 'item1')).toBeDefined();
      expect(result.find(i => i.id === 'item2')).toBeDefined();
    });

    it('should return all items if group is inactive', () => {
      const items = createMockOrderItems(5);

      const group = createMockFilterGroup({
        isActive: false,
        criteria: [createMockFilterCriterion({ field: 'price', operator: 'gt', value: 1000 })],
      });

      const result = applyFilterGroup(items, group);

      expect(result).toHaveLength(5);
    });

    it('should return all items if no criteria', () => {
      const items = createMockOrderItems(3);

      const group = createMockFilterGroup({
        criteria: [],
      });

      const result = applyFilterGroup(items, group);

      expect(result).toHaveLength(3);
    });

    it('should eliminate duplicates in OR logic', () => {
      const items = [
        createMockOrderItem({ id: 'item1', price: 200, quantity: 20 }),
      ];

      const group = createMockFilterGroup({
        criteria: [
          createMockFilterCriterion({ field: 'price', operator: 'gt', value: 150 }),
          createMockFilterCriterion({ field: 'quantity', operator: 'gt', value: 15 }),
        ],
        logic: 'or',
      });

      const result = applyFilterGroup(items, group);

      expect(result).toHaveLength(1);
    });
  });

  describe('applyMultipleFilters', () => {
    it('should apply multiple filter groups with AND logic', () => {
      const items = [
        createMockOrderItem({ price: 100, quantity: 10 }),
        createMockOrderItem({ price: 200, quantity: 5 }),
        createMockOrderItem({ price: 150, quantity: 15 }),
      ];

      const groups = [
        createMockFilterGroup({
          criteria: [createMockFilterCriterion({ field: 'price', operator: 'gte', value: 100 })],
          logic: 'and',
        }),
        createMockFilterGroup({
          criteria: [createMockFilterCriterion({ field: 'quantity', operator: 'gte', value: 10 })],
          logic: 'and',
        }),
      ];

      const result = applyMultipleFilters(items, groups, 'and');

      expect(result.matched).toBe(2);
      expect(result.total).toBe(3);
    });

    it('should apply multiple filter groups with OR logic', () => {
      const items = [
        createMockOrderItem({ id: 'item1', price: 50 }),
        createMockOrderItem({ id: 'item2', price: 200 }),
        createMockOrderItem({ id: 'item3', price: 100 }),
      ];

      const groups = [
        createMockFilterGroup({
          criteria: [createMockFilterCriterion({ field: 'price', operator: 'lt', value: 75 })],
          logic: 'and',
        }),
        createMockFilterGroup({
          criteria: [createMockFilterCriterion({ field: 'price', operator: 'gt', value: 150 })],
          logic: 'and',
        }),
      ];

      const result = applyMultipleFilters(items, groups, 'or');

      expect(result.matched).toBe(2);
    });

    it('should track execution time', () => {
      const items = createMockOrderItems(10);
      const groups = [createMockFilterGroup()];

      const result = applyMultipleFilters(items, groups);

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should return filter metadata', () => {
      const items = createMockOrderItems(5);
      const groups = [
        createMockFilterGroup({
          criteria: [
            createMockFilterCriterion({ field: 'price', operator: 'gt', value: 100 }),
            createMockFilterCriterion({ field: 'quantity', operator: 'gt', value: 5 }),
          ],
        }),
      ];

      const result = applyMultipleFilters(items, groups);

      expect(result.filters).toHaveLength(2);
      expect(result.total).toBe(5);
    });
  });

  describe('saved filters', () => {
    it('should create and save filter', () => {
      const filter = createSavedFilter({
        name: 'Test Filter',
        criteria: [createMockFilterCriterion()],
        logic: 'and',
        isPublic: false,
      });

      expect(filter.id).toBeDefined();
      expect(filter.createdAt).toBeInstanceOf(Date);
      expect(filter.updatedAt).toBeInstanceOf(Date);
    });

    it('should save and retrieve filters', () => {
      const filter = createMockSavedFilter({ name: 'My Filter' });

      saveSavedFilter(filter);
      const retrieved = getAllSavedFilters();

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].name).toBe('My Filter');
    });

    it('should update existing filter', () => {
      const filter = createMockSavedFilter({ name: 'Original' });

      saveSavedFilter(filter);
      saveSavedFilter({ ...filter, name: 'Updated' });

      const filters = getAllSavedFilters();

      expect(filters).toHaveLength(1);
      expect(filters[0].name).toBe('Updated');
    });

    it('should delete filter by ID', () => {
      const filter = createMockSavedFilter();

      saveSavedFilter(filter);
      const deleted = deleteSavedFilter(filter.id);

      expect(deleted).toBe(true);
      expect(getAllSavedFilters()).toHaveLength(0);
    });

    it('should return false when deleting non-existent filter', () => {
      const deleted = deleteSavedFilter('non-existent-id');

      expect(deleted).toBe(false);
    });

    it('should get filter by ID', () => {
      const filter = createMockSavedFilter({ name: 'Test Filter' });

      saveSavedFilter(filter);
      const retrieved = getSavedFilterById(filter.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Test Filter');
    });

    it('should search filters by name', () => {
      saveSavedFilter(createMockSavedFilter({ name: 'Apple Filter' }));
      saveSavedFilter(createMockSavedFilter({ name: 'Banana Filter' }));
      saveSavedFilter(createMockSavedFilter({ name: 'Pineapple Special' }));

      const results = searchSavedFilters('apple');

      expect(results).toHaveLength(2);
    });

    it('should search filters by description', () => {
      saveSavedFilter(createMockSavedFilter({ name: 'Filter1', description: 'High value items' }));
      saveSavedFilter(createMockSavedFilter({ name: 'Filter2', description: 'Low stock items' }));

      const results = searchSavedFilters('value');

      expect(results).toHaveLength(1);
    });
  });

  describe('filter groups', () => {
    it('should create filter group', () => {
      const group = createFilterGroup({
        name: 'Test Group',
        criteria: [],
        logic: 'and',
        isActive: true,
      });

      expect(group.id).toBeDefined();
      expect(group.createdAt).toBeInstanceOf(Date);
    });

    it('should save and retrieve filter groups', () => {
      const group = createMockFilterGroup({ name: 'My Group' });

      saveFilterGroup(group);
      const retrieved = getFilterGroups();

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].name).toBe('My Group');
    });

    it('should delete filter group', () => {
      const group = createMockFilterGroup();

      saveFilterGroup(group);
      const deleted = deleteFilterGroup(group.id);

      expect(deleted).toBe(true);
      expect(getFilterGroups()).toHaveLength(0);
    });
  });

  describe('preset filters', () => {
    it('should generate high value filter', () => {
      const filter = presetFilters.highValue();

      expect(filter.name).toBe('High Value Orders');
      expect(filter.criteria[0].field).toBe('price');
      expect(filter.criteria[0].operator).toBe('gt');
      expect(filter.criteria[0].value).toBe(5000);
    });

    it('should generate discounted items filter', () => {
      const filter = presetFilters.discounted();

      expect(filter.name).toBe('Discounted Items');
      expect(filter.criteria[0].field).toBe('discount');
      expect(filter.criteria[0].operator).toBe('gt');
    });

    it('should generate bulk orders filter', () => {
      const filter = presetFilters.bulkOrders();

      expect(filter.name).toBe('Bulk Orders');
      expect(filter.criteria[0].field).toBe('quantity');
      expect(filter.criteria[0].operator).toBe('gte');
      expect(filter.criteria[0].value).toBe(10);
    });

    it('should generate specific product filter', () => {
      const filter = presetFilters.specificProduct('prod-123');

      expect(filter.criteria[0].field).toBe('productId');
      expect(filter.criteria[0].value).toBe('prod-123');
    });
  });

  describe('import/export', () => {
    it('should export filters as JSON', () => {
      const filters = [
        createMockSavedFilter({ name: 'Filter 1' }),
        createMockSavedFilter({ name: 'Filter 2' }),
      ];

      const json = exportFilters(filters);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Filter 1');
    });

    it('should import filters from JSON', () => {
      const filters = [createMockSavedFilter({ name: 'Imported Filter' })];
      const json = exportFilters(filters);

      const imported = importFilters(json);

      expect(imported).toHaveLength(1);

      const allFilters = getAllSavedFilters();
      expect(allFilters.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => importFilters('invalid json')).toThrow('Failed to import filters');
    });

    it('should assign new IDs to imported filters', () => {
      const filter = createMockSavedFilter({ name: 'Original' });
      const json = exportFilters([filter]);

      importFilters(json);
      const allFilters = getAllSavedFilters();

      expect(allFilters[0].id).not.toBe(filter.id);
      expect(allFilters[0].id).toMatch(/^imported_/);
    });
  });
});
