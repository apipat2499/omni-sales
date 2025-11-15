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

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired';

export interface SubscriptionPlan {
  id: string;
  name: string;
  stripeProductId: string;
  stripePriceId: string;
  amountCents: number;
  currency: string;
  billingInterval: string;
  productLimit: number;
  features: string[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  plan?: SubscriptionPlan;
}

export interface Invoice {
  id: string;
  subscriptionId?: string;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  amountCents: number;
  currency: string;
  status: string;
  description?: string;
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
  paidAt?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  subscriptionId?: string;
  stripeChargeId: string;
  stripePaymentIntentId: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MarketplaceCode = 'shopee' | 'lazada' | 'facebook';

export interface MarketplacePlatform {
  id: string;
  name: string;
  code: MarketplaceCode;
  iconUrl?: string;
  apiBaseUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceConnection {
  id: string;
  userId: string;
  platformId: string;
  platformCode: MarketplaceCode;
  shopId?: string;
  shopName?: string;
  accessToken?: string;
  refreshToken?: string;
  shopAuthorizationToken?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  lastSyncedAt?: Date;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceProduct {
  id: string;
  userId: string;
  connectionId: string;
  marketplaceProductId: string;
  platformCode: MarketplaceCode;
  localProductId?: string;
  name: string;
  description?: string;
  price?: number;
  quantityAvailable?: number;
  imageUrl?: string;
  marketplaceUrl?: string;
  status: string;
  metadata?: Record<string, unknown>;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceOrder {
  id: string;
  userId: string;
  connectionId: string;
  localOrderId?: string;
  marketplaceOrderId: string;
  platformCode: MarketplaceCode;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderStatus: string;
  paymentStatus?: string;
  totalAmount: number;
  currency: string;
  shippingAddress?: string;
  itemsCount?: number;
  rawData?: Record<string, unknown>;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceOrderItem {
  id: string;
  marketplaceOrderId: string;
  marketplaceProductId?: string;
  productName: string;
  quantity: number;
  price: number;
  variationDetails?: Record<string, unknown>;
  createdAt: Date;
}

export interface MarketplaceSyncLog {
  id: string;
  userId: string;
  connectionId: string;
  syncType: string;
  status: 'pending' | 'success' | 'failed';
  itemsSynced: number;
  itemsFailed: number;
  errorMessage?: string;
  syncDurationMs?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}
