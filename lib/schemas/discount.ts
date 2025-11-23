import { z } from 'zod';

// Discount validation schemas
export const DiscountCreateSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50).toUpperCase(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount'], {
    errorMap: () => ({ message: 'Type must be either percentage or fixed_amount' }),
  }),
  value: z.number().positive('Value must be positive'),
  minPurchaseAmount: z.number().nonnegative('Minimum purchase cannot be negative').optional().default(0),
  maxDiscountAmount: z.number().nonnegative('Max discount cannot be negative').optional(),
  usageLimit: z.number().int().positive('Usage limit must be positive').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  active: z.boolean().optional().default(true),
  appliesTo: z.enum(['all', 'specific_products', 'specific_categories']).optional().default('all'),
  appliesToValue: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const DiscountUpdateSchema = z.object({
  code: z.string().min(2).max(50).toUpperCase().optional(),
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount']).optional(),
  value: z.number().positive().optional(),
  minPurchaseAmount: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  active: z.boolean().optional(),
  appliesTo: z.enum(['all', 'specific_products', 'specific_categories']).optional(),
  appliesToValue: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export type DiscountCreate = z.infer<typeof DiscountCreateSchema>;
export type DiscountUpdate = z.infer<typeof DiscountUpdateSchema>;
