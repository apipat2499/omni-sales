import { z } from 'zod';

// Customer validation schemas
export const CustomerCreateSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  address: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const CustomerUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;
