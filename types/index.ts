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
  barcode?: string;
  rating?: number;
  viewCount?: number;
  isFeatured?: boolean;
  minStockLevel?: number;
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
  discountAmount?: number;
  total: number;
  status: OrderStatus;
  channel: OrderChannel;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  promotionId?: string;
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

export type CustomerLifecycleStage = 'new' | 'active' | 'at_risk' | 'dormant' | 'vip';

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
  lifecycleStage?: CustomerLifecycleStage;
  preferredContact?: 'email' | 'sms' | 'phone';
  birthday?: Date;
  notes?: string;
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

export type StockMovementType = 'sale' | 'adjustment' | 'return' | 'restock';

export interface StockMovement {
  id: string;
  productId: string;
  orderId?: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

// ======================================
// PROMOTION & DISCOUNT TYPES
// ======================================

export type PromotionType = 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  applicableTo: 'all' | 'products' | 'categories' | 'customers';
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionRule {
  id: string;
  promotionId: string;
  ruleType: 'product' | 'category' | 'customer_tag';
  ruleValue: string;
  createdAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  promotionId: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PromotionUsage {
  id: string;
  promotionId: string;
  couponId?: string;
  orderId: string;
  customerId?: string;
  discountAmount: number;
  createdAt: Date;
}

// ======================================
// SUPPLIER MANAGEMENT TYPES
// ======================================

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  productId: string;
  supplierSku?: string;
  cost: number;
  minOrderQty?: number;
  leadTimeDays?: number;
  isPreferred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  expectedDate?: Date;
  receivedDate?: Date;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  productId: string;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  cost: number;
  total: number;
  createdAt: Date;
}

export interface SupplierCommunication {
  id: string;
  supplierId: string;
  type: 'email' | 'phone' | 'meeting' | 'note';
  subject?: string;
  content?: string;
  createdBy?: string;
  createdAt: Date;
}

// ======================================
// CRM TYPES
// ======================================

export interface CustomerCommunication {
  id: string;
  customerId: string;
  type: 'email' | 'sms' | 'phone' | 'meeting' | 'note';
  subject?: string;
  content?: string;
  direction?: 'inbound' | 'outbound';
  status?: 'draft' | 'sent' | 'delivered' | 'failed';
  createdBy?: string;
  createdAt: Date;
}

export interface CustomerActivity {
  id: string;
  customerId: string;
  activityType: 'order' | 'communication' | 'note' | 'status_change';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  rules: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSegmentMember {
  id: string;
  customerId: string;
  segmentId: string;
  addedAt: Date;
}

export type RFMSegment = 'Champions' | 'Loyal' | 'Potential' | 'At Risk' | 'Dormant' | 'Lost';

export interface RFMScore {
  id: string;
  customerId: string;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmSegment: RFMSegment;
  lastCalculated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ======================================
// NOTIFICATION TYPES
// ======================================

export type NotificationType = 'email' | 'sms';
export type NotificationEvent = 'order_created' | 'order_shipped' | 'order_delivered' | 'low_stock' | 'promotion' | 'customer_created';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  event: NotificationEvent;
  subject?: string;
  body: string;
  variables?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSent {
  id: string;
  templateId?: string;
  type: NotificationType;
  recipient: string;
  subject?: string;
  body?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
  sentAt?: Date;
  createdAt: Date;
}

export interface UserPreferences {
  id: string;
  customerId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  lowStockAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationQueue {
  id: string;
  templateId?: string;
  type: NotificationType;
  recipient: string;
  data?: Record<string, any>;
  status: 'queued' | 'processing' | 'sent' | 'failed';
  retryCount: number;
  scheduledAt: Date;
  processedAt?: Date;
  createdAt: Date;
}

// ======================================
// REPORTS & ANALYTICS TYPES
// ======================================

export type ReportType = 'sales' | 'inventory' | 'customer' | 'financial';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly';
export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  config: Record<string, any>;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSchedule {
  id: string;
  templateId: string;
  name: string;
  frequency: ReportFrequency;
  recipients: string[];
  format: ReportFormat;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPerformance {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  rating?: number;
  viewCount?: number;
  timesOrdered: number;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface CustomerLifetimeValue {
  id: string;
  name: string;
  email: string;
  lifecycleStage?: CustomerLifecycleStage;
  tags: CustomerTag[];
  totalOrders: number;
  lifetimeValue: number;
  avgOrderValue: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;
  daysSinceLastOrder?: number;
}

export interface SalesAnalytics {
  saleDate: Date;
  totalOrders: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discounts: number;
  revenue: number;
  uniqueCustomers: number;
  avgOrderValue: number;
  channel: OrderChannel;
  status: OrderStatus;
}

// ======================================
// SEARCH & FILTER TYPES
// ======================================

export interface ProductSearch {
  id: string;
  searchTerm: string;
  resultCount?: number;
  createdAt: Date;
}

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  channel?: OrderChannel;
  startDate?: Date;
  endDate?: Date;
  minTotal?: number;
  maxTotal?: number;
}

export interface CustomerFilters {
  search?: string;
  tags?: CustomerTag[];
  lifecycleStage?: CustomerLifecycleStage;
  minSpent?: number;
  maxSpent?: number;
}
