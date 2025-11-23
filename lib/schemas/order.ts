import { z } from 'zod';

// Order validation schemas
export const OrderCreateSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      productName: z.string().min(1),
      quantity: z.number().int().positive('Quantity must be positive'),
      price: z.number().nonnegative('Price cannot be negative'),
    })
  ).min(1, 'Order must contain at least one item'),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash', 'wallet']).optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional().default('pending'),
  shippingAddress: z.object({
    address: z.string(),
    city: z.string(),
    zip: z.string(),
  }).optional(),
  notes: z.string().optional(),
});

export const OrderUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
}).strict();

export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;
