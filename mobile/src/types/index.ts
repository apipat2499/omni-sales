// Type definitions for the mobile app

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  twoFactorEnabled: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  requiresTwoFactor?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  currency: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  shippingAddress?: Address;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  category?: string;
  images?: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  currency: string;
  period: 'today' | 'week' | 'month' | 'year';
  trend: {
    revenue: number;
    orders: number;
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'product' | 'customer' | 'system';
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface UserPreferences {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  biometricEnabled: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}
