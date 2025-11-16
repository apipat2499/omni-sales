import { z } from 'zod';

// Validation schema สำหรับ add/update order items
export const addOrderItemSchema = z.object({
  productId: z.string().uuid('Product ID must be valid UUID'),
  productName: z.string().min(1, 'Product name is required').max(255),
  quantity: z.number().int().positive('Quantity must be greater than 0').max(10000),
  price: z.number().positive('Price must be greater than 0').max(999999.99),
});

export const updateOrderItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than 0').max(10000).optional(),
  price: z.number().positive('Price must be greater than 0').max(999999.99).optional(),
  discount: z.number().nonnegative('Discount must be non-negative').max(999999.99).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
}).refine((data) => data.quantity !== undefined || data.price !== undefined || data.discount !== undefined || data.notes !== undefined, {
  message: 'At least one field must be provided',
});

export type AddOrderItemInput = z.infer<typeof addOrderItemSchema>;
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>;

// Validate request body
export function validateAddOrderItem(data: unknown) {
  try {
    return { success: true, data: addOrderItemSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
        details: error.errors,
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

export function validateUpdateOrderItem(data: unknown) {
  try {
    return { success: true, data: updateOrderItemSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
        details: error.errors,
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}
