import { z } from 'zod';

// Product Validation Schema
export const productSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อสินค้า').max(255, 'ชื่อสินค้ายาวเกินไป'),
  sku: z.string().min(1, 'กรุณาระบุ SKU').max(100, 'SKU ยาวเกินไป'),
  category: z.enum(['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Books', 'Other'], {
    errorMap: () => ({ message: 'กรุณาเลือกหมวดหมู่' }),
  }),
  price: z.number().min(0, 'ราคาต้องเป็นจำนวนบวก').max(1000000000, 'ราคาสูงเกินไป'),
  cost: z.number().min(0, 'ต้นทุนต้องเป็นจำนวนบวก').max(1000000000, 'ต้นทุนสูงเกินไป'),
  stock: z.number().int('จำนวนสต็อกต้องเป็นจำนวนเต็ม').min(0, 'สต็อกต้องเป็นจำนวนบวก'),
  image: z.string().url('URL รูปภาพไม่ถูกต้อง').optional().or(z.literal('')),
  description: z.string().max(1000, 'คำอธิบายยาวเกินไป').optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Customer Validation Schema
export const customerSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อลูกค้า').max(255, 'ชื่อยาวเกินไป'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  phone: z.string().regex(/^[0-9]{9,10}$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง (9-10 หลัก)'),
  address: z.string().max(500, 'ที่อยู่ยาวเกินไป').optional(),
  tags: z.array(z.enum(['new', 'regular', 'vip', 'inactive'])).optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// Discount Validation Schema
export const discountSchema = z.object({
  code: z.string()
    .min(3, 'โค้ดต้องมีอย่างน้อย 3 ตัวอักษร')
    .max(50, 'โค้ดยาวเกินไป')
    .regex(/^[A-Z0-9_-]+$/, 'โค้ดต้องเป็นตัวพิมพ์ใหญ่, ตัวเลข, ขีด หรือขีดล่างเท่านั้น'),
  name: z.string().min(1, 'กรุณาระบุชื่อส่วนลด').max(255, 'ชื่อยาวเกินไป'),
  description: z.string().max(500, 'คำอธิบายยาวเกินไป').optional(),
  type: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: 'กรุณาเลือกประเภทส่วนลด' }),
  }),
  value: z.number().positive('มูลค่าต้องมากกว่า 0'),
  minPurchaseAmount: z.number().min(0, 'ยอดซื้อขั้นต่ำต้องเป็นจำนวนบวก'),
  maxDiscountAmount: z.number().min(0, 'ส่วนลดสูงสุดต้องเป็นจำนวนบวก').optional(),
  usageLimit: z.number().int('จำกัดการใช้งานต้องเป็นจำนวนเต็ม').min(1, 'จำกัดการใช้งานต้องมากกว่า 0').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean(),
  appliesTo: z.enum(['all', 'category', 'product']),
  appliesToValue: z.string().optional(),
}).refine((data) => {
  if (data.type === 'percentage') {
    return data.value <= 100;
  }
  return true;
}, {
  message: 'เปอร์เซ็นต์ส่วนลดต้องไม่เกิน 100',
  path: ['value'],
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: 'วันที่สิ้นสุดต้องหลังวันที่เริ่มต้น',
  path: ['endDate'],
});

export type DiscountFormData = z.infer<typeof discountSchema>;

// Order Item Schema
const orderItemSchema = z.object({
  productId: z.string().uuid('Product ID ไม่ถูกต้อง'),
  productName: z.string(),
  quantity: z.number().int('จำนวนต้องเป็นจำนวนเต็ม').min(1, 'จำนวนต้องมากกว่า 0'),
  price: z.number().min(0, 'ราคาต้องเป็นจำนวนบวก'),
});

// Order Validation Schema
export const orderSchema = z.object({
  customerId: z.string().uuid('Customer ID ไม่ถูกต้อง'),
  items: z.array(orderItemSchema).min(1, 'ต้องมีสินค้าอย่างน้อย 1 รายการ'),
  subtotal: z.number().min(0, 'ยอดรวมย่อยต้องเป็นจำนวนบวก'),
  tax: z.number().min(0, 'ภาษีต้องเป็นจำนวนบวก'),
  shipping: z.number().min(0, 'ค่าจัดส่งต้องเป็นจำนวนบวก'),
  total: z.number().min(0, 'ยอดรวมต้องเป็นจำนวนบวก'),
  channel: z.enum(['online', 'pos', 'phone', 'other'], {
    errorMap: () => ({ message: 'กรุณาเลือกช่องทางการขาย' }),
  }),
  paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'e_wallet'], {
    errorMap: () => ({ message: 'กรุณาเลือกวิธีการชำระเงิน' }),
  }),
  discountCode: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>;

// Bulk Update Schema
export const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'กรุณาเลือกรายการที่ต้องการอัพเดท'),
  field: z.string().min(1, 'กรุณาเลือกฟิลด์ที่ต้องการอัพเดท'),
  value: z.any(),
});

export type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>;
