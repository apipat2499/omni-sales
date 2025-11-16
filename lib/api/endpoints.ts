/**
 * API Endpoints for Omni-Sales Application
 * จุดเชื่อมต่อ API สำหรับแอปพลิเคชัน Omni-Sales
 *
 * Typed endpoint definitions with request/response types
 */

import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderChannel,
  Product,
  ProductCategory,
  Customer,
  OrderPayment,
  OrderShipping,
  OrderReturn,
  OrderStatusHistory,
} from '@/types';

// ============================================
// BASE CONFIGURATION
// ============================================

/**
 * Base API URL Configuration
 * การตั้งค่า URL พื้นฐานของ API
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// ============================================
// REQUEST/RESPONSE TYPES - ORDERS
// ============================================

export interface GetOrdersRequest {
  customerId?: string;
  status?: OrderStatus | 'all';
  channel?: OrderChannel | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

export type GetOrdersResponse = Order[];

export interface GetOrderRequest {
  orderId: string;
}

export type GetOrderResponse = Order;

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    status: OrderStatus;
    deliveredAt?: Date;
    updatedAt: Date;
  };
}

export interface CreateOrderRequest {
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status?: OrderStatus;
  channel?: OrderChannel;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
}

export type CreateOrderResponse = Order;

// ============================================
// REQUEST/RESPONSE TYPES - ORDER ITEMS
// ============================================

export interface GetOrderItemsRequest {
  orderId: string;
}

export type GetOrderItemsResponse = OrderItem[];

export interface AddOrderItemRequest {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount?: number;
  notes?: string;
}

export interface AddOrderItemResponse {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount?: number;
  notes?: string;
  createdAt: Date;
}

export interface UpdateOrderItemRequest {
  orderId: string;
  itemId: string;
  quantity?: number;
  price?: number;
  discount?: number;
  notes?: string;
}

export type UpdateOrderItemResponse = OrderItem;

export interface DeleteOrderItemRequest {
  orderId: string;
  itemId: string;
}

export interface DeleteOrderItemResponse {
  success: boolean;
  message: string;
}

export interface GetOrderItemHistoryRequest {
  orderId: string;
  itemId?: string;
}

export interface OrderItemHistoryEntry {
  id: string;
  orderId: string;
  itemId?: string;
  action: 'added' | 'updated' | 'removed';
  previousValue?: any;
  newValue?: any;
  changedBy?: string;
  createdAt: Date;
}

export type GetOrderItemHistoryResponse = OrderItemHistoryEntry[];

// ============================================
// REQUEST/RESPONSE TYPES - PRODUCTS
// ============================================

export interface GetProductsRequest {
  search?: string;
  category?: ProductCategory | 'all';
  limit?: number;
  offset?: number;
}

export type GetProductsResponse = Product[];

export interface GetProductRequest {
  productId: string;
}

export type GetProductResponse = Product;

export interface CreateProductRequest {
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  sku: string;
  image?: string;
  description?: string;
}

export type CreateProductResponse = Product;

export interface UpdateProductRequest {
  productId: string;
  name?: string;
  category?: ProductCategory;
  price?: number;
  cost?: number;
  stock?: number;
  sku?: string;
  image?: string;
  description?: string;
}

export type UpdateProductResponse = Product;

export interface DeleteProductRequest {
  productId: string;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

// ============================================
// REQUEST/RESPONSE TYPES - CUSTOMERS
// ============================================

export interface GetCustomersRequest {
  search?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export type GetCustomersResponse = Customer[];

export interface GetCustomerRequest {
  customerId: string;
}

export type GetCustomerResponse = Customer;

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address?: string;
  tags?: string[];
}

export type CreateCustomerResponse = Customer;

export interface UpdateCustomerRequest {
  customerId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tags?: string[];
}

export type UpdateCustomerResponse = Customer;

// ============================================
// REQUEST/RESPONSE TYPES - ORDER RELATED
// ============================================

export interface GetOrderPaymentsRequest {
  orderId: string;
}

export type GetOrderPaymentsResponse = OrderPayment[];

export interface CreateOrderPaymentRequest {
  orderId: string;
  paymentMethod: string;
  amount: number;
  currency?: string;
  transactionId?: string;
  paymentGateway?: string;
}

export type CreateOrderPaymentResponse = OrderPayment;

export interface GetOrderShippingRequest {
  orderId: string;
}

export type GetOrderShippingResponse = OrderShipping;

export interface UpdateOrderShippingRequest {
  orderId: string;
  shippingMethod?: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}

export type UpdateOrderShippingResponse = OrderShipping;

export interface GetOrderReturnsRequest {
  orderId: string;
}

export type GetOrderReturnsResponse = OrderReturn[];

export interface CreateOrderReturnRequest {
  orderId: string;
  returnReason: string;
  reasonDetails?: string;
  items: {
    itemId: string;
    quantity: number;
    reason?: string;
  }[];
  requestedAction: 'refund' | 'exchange' | 'store_credit';
}

export type CreateOrderReturnResponse = OrderReturn;

export interface GetOrderStatusHistoryRequest {
  orderId: string;
}

export type GetOrderStatusHistoryResponse = OrderStatusHistory[];

// ============================================
// REQUEST/RESPONSE TYPES - ANALYTICS
// ============================================

export interface GetSalesAnalyticsRequest {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  channel?: OrderChannel;
}

export interface SalesAnalyticsResponse {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByPeriod: {
    period: string;
    revenue: number;
    orders: number;
  }[];
  revenueByChannel?: {
    channel: string;
    revenue: number;
    orders: number;
  }[];
  topProducts?: {
    productId: string;
    productName: string;
    revenue: number;
    quantity: number;
  }[];
}

export interface GetInventoryAnalyticsRequest {
  productId?: string;
  lowStock?: boolean;
}

export interface InventoryAnalyticsResponse {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  stockValue: number;
  products?: {
    productId: string;
    productName: string;
    stock: number;
    value: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
  }[];
}

// ============================================
// ENDPOINT URLS
// ============================================

/**
 * API Endpoints
 * จุดเชื่อมต่อ API
 */
export const endpoints = {
  // Orders
  orders: {
    list: () => '/orders',
    get: (orderId: string) => `/orders/${orderId}`,
    create: () => '/orders',
    update: (orderId: string) => `/orders/${orderId}`,
    delete: (orderId: string) => `/orders/${orderId}`,
    updateStatus: (orderId: string) => `/orders/${orderId}/status`,
    statusHistory: (orderId: string) => `/orders/${orderId}/status-history`,
  },

  // Order Items
  orderItems: {
    list: (orderId: string) => `/orders/${orderId}/items`,
    get: (orderId: string, itemId: string) => `/orders/${orderId}/items/${itemId}`,
    add: (orderId: string) => `/orders/${orderId}/items`,
    update: (orderId: string, itemId: string) => `/orders/${orderId}/items/${itemId}`,
    delete: (orderId: string, itemId: string) => `/orders/${orderId}/items/${itemId}`,
    history: (orderId: string, itemId?: string) =>
      itemId
        ? `/orders/${orderId}/items/${itemId}/history`
        : `/orders/${orderId}/items/history`,
  },

  // Order Related
  orderPayments: {
    list: (orderId: string) => `/orders/${orderId}/payments`,
    create: (orderId: string) => `/orders/${orderId}/payments`,
  },

  orderShipping: {
    get: (orderId: string) => `/orders/${orderId}/shipping`,
    update: (orderId: string) => `/orders/${orderId}/shipping`,
  },

  orderReturns: {
    list: (orderId: string) => `/orders/${orderId}/returns`,
    create: (orderId: string) => `/orders/${orderId}/returns`,
  },

  orderFulfillment: {
    get: (orderId: string) => `/orders/${orderId}/fulfillment`,
    update: (orderId: string) => `/orders/${orderId}/fulfillment`,
  },

  orderRefunds: {
    list: (orderId: string) => `/orders/${orderId}/refunds`,
    create: (orderId: string) => `/orders/${orderId}/refunds`,
  },

  // Products
  products: {
    list: () => '/products',
    get: (productId: string) => `/products/${productId}`,
    create: () => '/products',
    update: (productId: string) => `/products/${productId}`,
    delete: (productId: string) => `/products/${productId}`,
  },

  // Customers
  customers: {
    list: () => '/customers',
    get: (customerId: string) => `/customers/${customerId}`,
    create: () => '/customers',
    update: (customerId: string) => `/customers/${customerId}`,
    delete: (customerId: string) => `/customers/${customerId}`,
    profiles: () => '/customers/profiles',
    analytics: () => '/customers/analytics',
    segments: () => '/customers/segments',
    communications: () => '/customers/communications',
    loyaltyPoints: () => '/customers/loyalty-points',
    rfm: () => '/customers/rfm',
  },

  // Analytics
  analytics: {
    sales: () => '/analytics/sales',
    products: () => '/analytics/products',
    customers: () => '/analytics/customers',
    dashboard: () => '/analytics/dashboard',
    financial: () => '/analytics/financial',
    operational: () => '/analytics/operational',
  },

  // Inventory
  inventory: {
    stock: () => '/inventory/stock',
    levels: () => '/inventory/levels',
    movements: () => '/inventory/movements',
    transfers: () => '/inventory/transfers',
    alerts: () => '/inventory/alerts',
    analytics: () => '/inventory/analytics',
    warehouses: () => '/inventory/warehouses',
    reorder: () => '/inventory/reorder',
    barcodes: () => '/inventory/barcodes',
  },

  // Payments
  payments: {
    process: () => '/payments/process',
    createIntent: () => '/payments/create-payment-intent',
    webhook: () => '/payments/webhook',
    dashboard: () => '/payment/dashboard',
  },

  // Returns
  returns: {
    list: () => '/returns/list',
    create: () => '/returns',
    authorize: () => '/returns/authorize',
    refund: () => '/returns/refund',
    items: () => '/returns/items',
    analytics: () => '/returns/analytics',
  },

  // Reviews
  reviews: {
    product: (productId: string) => `/reviews/product?productId=${productId}`,
    create: () => '/reviews/create',
    moderate: () => '/reviews/moderate',
    vote: () => '/reviews/vote',
    report: () => '/reviews/report',
    analytics: () => '/reviews/analytics',
  },

  // Discounts
  discounts: {
    codes: () => '/discounts/codes',
    campaigns: () => '/discounts/campaigns',
    redeem: () => '/discounts/redeem',
    analytics: () => '/discounts/analytics',
  },

  // Recommendations
  recommendations: {
    generate: () => '/recommendations/generate',
    track: () => '/recommendations/track',
    analytics: () => '/recommendations/analytics',
  },

  // Marketplace
  marketplace: {
    platforms: () => '/marketplace/platforms',
    connections: () => '/marketplace/connections',
    orders: () => '/marketplace/orders',
    syncOrders: () => '/marketplace/sync-orders',
  },

  // CRM
  crm: {
    customers: () => '/crm/customers',
    leads: () => '/crm/leads',
    opportunities: () => '/crm/opportunities',
    interactions: () => '/crm/interactions',
    dashboard: () => '/crm/dashboard',
  },

  // Email
  email: {
    send: () => '/email/send',
    templates: () => '/email/templates',
    campaigns: () => '/email/campaigns',
    preferences: () => '/email/preferences',
    dashboard: () => '/email/dashboard',
  },

  // SMS
  sms: {
    send: () => '/sms/send',
    templates: () => '/sms/templates',
    campaigns: () => '/sms/campaigns',
  },

  // Loyalty
  loyalty: {
    programs: () => '/loyalty/programs',
    dashboard: () => '/loyalty/dashboard',
  },

  // Pricing
  pricing: {
    calculate: () => '/pricing/calculate',
    rules: () => '/pricing/rules',
    strategies: () => '/pricing/strategies',
    competitors: () => '/pricing/competitors',
    analytics: () => '/pricing/analytics',
  },

  // Support
  support: {
    dashboard: () => '/support/dashboard',
  },

  // Complaints
  complaints: {
    list: () => '/complaints',
    resolve: () => '/complaints/resolve',
    escalate: () => '/complaints/escalate',
    response: () => '/complaints/response',
    feedback: () => '/complaints/feedback',
    analytics: () => '/complaints/analytics',
  },

  // Wishlist
  wishlists: {
    list: () => '/wishlists',
    preferences: () => '/wishlists/preferences',
  },

  // Segmentation
  segmentation: {
    segments: () => '/segmentation/segments',
    events: () => '/segmentation/events',
    analytics: () => '/segmentation/analytics',
  },

  // Import/Export
  importExport: {
    orders: () => '/import-export/orders',
    products: () => '/import-export/products',
    customers: () => '/import-export/customers',
  },

  // Forecast
  forecast: {
    sales: () => '/forecast/sales',
  },

  // Billing
  billing: {
    plans: () => '/billing/plans',
    checkout: () => '/billing/checkout',
    userSubscriptions: () => '/billing/user-subscriptions',
  },

  // Currency
  currency: {
    convert: () => '/currency/convert',
  },

  // Search
  search: {
    global: () => '/search/global',
  },

  // Notifications
  notifications: {
    dashboard: () => '/notification/dashboard',
    pushRegister: () => '/notifications/push/register',
  },

  // Integrations
  integrations: {
    webhook: () => '/integrations/webhook',
  },
} as const;

export default endpoints;
