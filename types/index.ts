export type ProductCategory =
  | 'Electronics'
  | 'Clothing'
  | 'Food & Beverage'
  | 'Home & Garden'
  | 'Sports'
  | 'Books'
  | 'Other';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderChannel =
  | 'online'
  | 'offline'
  | 'mobile'
  | 'phone';

export type CustomerTag =
  | 'vip'
  | 'regular'
  | 'new'
  | 'wholesale';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  sku: string;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  channel: OrderChannel;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  discountCode?: string;
  discountAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  tags: CustomerTag[];
  lastOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategorySales {
  category: string;
  value: number;
  percentage: number;
}

// Discount & Promotion Types
export type DiscountType = 'percentage' | 'fixed';
export type DiscountAppliesTo = 'all' | 'category' | 'product';

export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  appliesTo: DiscountAppliesTo;
  appliesToValue?: string; // JSON array of product IDs or category name
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountUsage {
  id: string;
  discountId: string;
  orderId: string;
  customerId: string;
  discountAmount: number;
  createdAt: Date;
}

// Notification Types
export type NotificationType =
  | 'low_stock'
  | 'out_of_stock'
  | 'order_created'
  | 'order_shipped'
  | 'order_delivered'
  | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  id: string;
  userId?: string;
  emailEnabled: boolean;
  emailOnOrderCreated: boolean;
  emailOnOrderShipped: boolean;
  emailOnOrderDelivered: boolean;
  emailOnLowStock: boolean;
  emailOnOutOfStock: boolean;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}
