// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    VERIFY_2FA: '/api/auth/verify-2fa',
    REFRESH_TOKEN: '/api/auth/refresh',
    BIOMETRIC_LOGIN: '/api/auth/biometric',
  },

  // Orders
  ORDERS: {
    LIST: '/api/orders',
    DETAIL: (id: string) => `/api/orders/${id}`,
    CREATE: '/api/orders',
    UPDATE: (id: string) => `/api/orders/${id}`,
    DELETE: (id: string) => `/api/orders/${id}`,
    STATS: '/api/orders/stats',
  },

  // Products
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (id: string) => `/api/products/${id}`,
    CREATE: '/api/products',
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
    SEARCH: '/api/search/global',
    BARCODE: (code: string) => `/api/inventory/barcodes?code=${code}`,
  },

  // Customers
  CUSTOMERS: {
    LIST: '/api/customers',
    DETAIL: (id: string) => `/api/customers/${id}`,
    CREATE: '/api/customers',
    UPDATE: (id: string) => `/api/customers/${id}`,
    DELETE: (id: string) => `/api/customers/${id}`,
  },

  // Analytics
  ANALYTICS: {
    SALES: '/api/analytics/sales',
    PRODUCTS: '/api/analytics/products',
    CUSTOMERS: '/api/analytics/customers',
    FINANCIAL: '/api/analytics/financial',
  },

  // Notifications
  NOTIFICATIONS: {
    REGISTER_DEVICE: '/api/notifications/push/register',
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
  },

  // User
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    PREFERENCES: '/api/user/preferences',
  },
};
