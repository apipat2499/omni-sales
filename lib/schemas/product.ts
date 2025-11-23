import { z } from 'zod';

// Product validation schemas
export const ProductCreateSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(255),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().nonnegative('Cost cannot be negative'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  sku: z.string().min(1, 'SKU is required').max(100),
  image: z.string().url('Invalid image URL').optional().nullable(),
  description: z.string().optional(),
});

export const ProductUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  cost: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  sku: z.string().min(1).max(100).optional(),
  image: z.string().url().optional().nullable(),
  description: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
