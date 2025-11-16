/**
 * Data Validation Tests
 * Tests for order item validation logic and business rules
 */

import {
  validateAddOrderItem,
  validateUpdateOrderItem,
  addOrderItemSchema,
  updateOrderItemSchema,
} from '@/lib/validations/order-items';
import { createMockOrderItem } from '../factories';

describe('Data Validation', () => {
  describe('addOrderItemSchema', () => {
    describe('valid inputs', () => {
      it('should validate valid order item with all required fields', () => {
        const validItem = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 5,
          price: 99.99,
        };

        const result = validateAddOrderItem(validItem);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(validItem);
      });

      it('should validate with maximum allowed quantity', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 10000,
          price: 1.00,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(true);
      });

      it('should validate with maximum allowed price', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: 999999.99,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(true);
      });

      it('should validate with minimum valid quantity (1)', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(true);
      });

      it('should validate with minimum valid price', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: 0.01,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(true);
      });

      it('should validate with long product name (255 chars)', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'A'.repeat(255),
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid productId', () => {
      it('should reject missing productId', () => {
        const item = {
          productName: 'Test Product',
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject invalid UUID format', () => {
        const item = {
          productId: 'invalid-uuid',
          productName: 'Test Product',
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
        expect(result.error).toContain('UUID');
      });

      it('should reject empty string productId', () => {
        const item = {
          productId: '',
          productName: 'Test Product',
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject numeric productId', () => {
        const item = {
          productId: 12345,
          productName: 'Test Product',
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });
    });

    describe('invalid productName', () => {
      it('should reject missing productName', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
        expect(result.error).toContain('required');
      });

      it('should reject empty productName', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: '',
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject productName longer than 255 characters', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'A'.repeat(256),
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject whitespace-only productName', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: '   ',
          quantity: 1,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });
    });

    describe('invalid quantity', () => {
      it('should reject zero quantity', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 0,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
        expect(result.error).toContain('greater than 0');
      });

      it('should reject negative quantity', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: -5,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject quantity exceeding maximum (10000)', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 10001,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject decimal quantity', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 5.5,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject missing quantity', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject string quantity', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: '5',
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });
    });

    describe('invalid price', () => {
      it('should reject zero price', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: 0,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
        expect(result.error).toContain('greater than 0');
      });

      it('should reject negative price', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: -10,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject price exceeding maximum (999999.99)', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: 1000000,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject missing price', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should reject string price', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: '100',
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should reject null input', () => {
        const result = validateAddOrderItem(null);
        expect(result.success).toBe(false);
      });

      it('should reject undefined input', () => {
        const result = validateAddOrderItem(undefined);
        expect(result.success).toBe(false);
      });

      it('should reject array input', () => {
        const result = validateAddOrderItem([]);
        expect(result.success).toBe(false);
      });

      it('should reject string input', () => {
        const result = validateAddOrderItem('invalid');
        expect(result.success).toBe(false);
      });

      it('should ignore extra fields not in schema', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: 100,
          extraField: 'should be ignored',
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateOrderItemSchema', () => {
    describe('valid updates', () => {
      it('should validate quantity update', () => {
        const update = { quantity: 5 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(update);
      });

      it('should validate price update', () => {
        const update = { price: 150.50 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });

      it('should validate discount update', () => {
        const update = { discount: 10.00 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });

      it('should validate notes update', () => {
        const update = { notes: 'Special instructions here' };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });

      it('should validate multiple field updates', () => {
        const update = {
          quantity: 10,
          price: 200,
          discount: 20,
          notes: 'Bulk order',
        };

        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });

      it('should validate maximum quantity in update', () => {
        const update = { quantity: 10000 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });

      it('should validate zero discount', () => {
        const update = { discount: 0 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });

      it('should validate empty notes', () => {
        const update = { notes: '' };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });

      it('should validate long notes (1000 chars)', () => {
        const update = { notes: 'A'.repeat(1000) };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid updates', () => {
      it('should reject empty update object', () => {
        const result = validateUpdateOrderItem({});
        expect(result.success).toBe(false);
        expect(result.error).toContain('At least one field');
      });

      it('should reject zero quantity', () => {
        const update = { quantity: 0 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject negative quantity', () => {
        const update = { quantity: -1 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject quantity exceeding maximum', () => {
        const update = { quantity: 10001 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject decimal quantity', () => {
        const update = { quantity: 5.5 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject zero price', () => {
        const update = { price: 0 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject negative price', () => {
        const update = { price: -10 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject price exceeding maximum', () => {
        const update = { price: 1000000 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject negative discount', () => {
        const update = { discount: -5 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject discount exceeding maximum', () => {
        const update = { discount: 1000000 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject notes longer than 1000 characters', () => {
        const update = { notes: 'A'.repeat(1001) };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });
    });

    describe('type validation', () => {
      it('should reject string quantity', () => {
        const update = { quantity: '5' as any };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject string price', () => {
        const update = { price: '100' as any };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject string discount', () => {
        const update = { discount: '10' as any };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should reject numeric notes', () => {
        const update = { notes: 12345 as any };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('business rule validation', () => {
    describe('quantity constraints', () => {
      it('should enforce minimum quantity of 1', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 0,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should enforce maximum quantity limit', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 100000,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should only allow integer quantities', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 2.7,
          price: 100,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });
    });

    describe('price constraints', () => {
      it('should enforce positive prices', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: -50,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should enforce maximum price limit', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: 10000000,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(false);
      });

      it('should allow decimal prices', () => {
        const item = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          productName: 'Test Product',
          quantity: 1,
          price: 99.99,
        };

        const result = validateAddOrderItem(item);
        expect(result.success).toBe(true);
      });
    });

    describe('discount constraints', () => {
      it('should enforce non-negative discounts', () => {
        const update = { discount: -10 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });

      it('should allow zero discount', () => {
        const update = { discount: 0 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(true);
      });

      it('should enforce maximum discount limit', () => {
        const update = { discount: 10000000 };
        const result = validateUpdateOrderItem(update);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should provide detailed error messages for validation failures', () => {
      const item = {
        productId: 'invalid',
        productName: '',
        quantity: 0,
        price: -10,
      };

      const result = validateAddOrderItem(item);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.details).toBeDefined();
    });

    it('should return first error message', () => {
      const item = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        productName: 'Test',
        quantity: 0,
        price: 100,
      };

      const result = validateAddOrderItem(item);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity');
    });

    it('should handle unexpected error types gracefully', () => {
      const result = validateAddOrderItem(Symbol('invalid') as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should validate complete order item creation flow', () => {
      const validItem = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        productName: 'Premium Product',
        quantity: 3,
        price: 299.99,
      };

      const result = validateAddOrderItem(validItem);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(validItem);
    });

    it('should validate complete order item update flow', () => {
      const update = {
        quantity: 5,
        price: 249.99,
        discount: 25.00,
        notes: 'Customer requested discount',
      };

      const result = validateUpdateOrderItem(update);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(update);
    });
  });
});
