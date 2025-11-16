/**
 * OpenAPI Schema Definitions
 * This file contains all the schema definitions for the API documentation
 */

export const schemas = {
  // ============= Base Types =============
  ProductCategory: {
    type: 'string',
    enum: ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Books', 'Other'],
    description: 'Product category type'
  },

  OrderStatus: {
    type: 'string',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    description: 'Order status'
  },

  OrderChannel: {
    type: 'string',
    enum: ['online', 'offline', 'mobile', 'phone'],
    description: 'Order channel'
  },

  CustomerTag: {
    type: 'string',
    enum: ['vip', 'regular', 'new', 'wholesale'],
    description: 'Customer tag'
  },

  SubscriptionStatus: {
    type: 'string',
    enum: ['active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired'],
    description: 'Subscription status'
  },

  MarketplaceCode: {
    type: 'string',
    enum: ['shopee', 'lazada', 'facebook'],
    description: 'Marketplace platform code'
  },

  // ============= Product Schemas =============
  Product: {
    type: 'object',
    required: ['id', 'name', 'category', 'price', 'cost', 'stock', 'sku'],
    properties: {
      id: { type: 'string', description: 'Product ID' },
      name: { type: 'string', description: 'Product name' },
      category: { $ref: '#/components/schemas/ProductCategory' },
      price: { type: 'number', format: 'float', description: 'Product price' },
      cost: { type: 'number', format: 'float', description: 'Product cost' },
      stock: { type: 'integer', description: 'Available stock quantity' },
      sku: { type: 'string', description: 'Stock Keeping Unit' },
      image: { type: 'string', description: 'Product image URL' },
      description: { type: 'string', description: 'Product description' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  // ============= Order Schemas =============
  OrderItem: {
    type: 'object',
    required: ['productId', 'productName', 'quantity', 'price'],
    properties: {
      id: { type: 'string', description: 'Order item ID' },
      productId: { type: 'string', description: 'Product ID' },
      productName: { type: 'string', description: 'Product name' },
      quantity: { type: 'integer', description: 'Quantity ordered' },
      price: { type: 'number', format: 'float', description: 'Unit price' },
      totalPrice: { type: 'number', format: 'float', description: 'Total price for this item' },
      discount: { type: 'number', format: 'float', description: 'Discount amount per item' },
      notes: { type: 'string', description: 'Special instructions or notes' }
    }
  },

  Order: {
    type: 'object',
    required: ['id', 'customerId', 'customerName', 'items', 'subtotal', 'tax', 'shipping', 'total', 'status', 'channel'],
    properties: {
      id: { type: 'string', description: 'Order ID' },
      customerId: { type: 'string', description: 'Customer ID' },
      customerName: { type: 'string', description: 'Customer name' },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/OrderItem' },
        description: 'Order items'
      },
      subtotal: { type: 'number', format: 'float', description: 'Order subtotal' },
      tax: { type: 'number', format: 'float', description: 'Tax amount' },
      shipping: { type: 'number', format: 'float', description: 'Shipping cost' },
      total: { type: 'number', format: 'float', description: 'Total amount' },
      status: { $ref: '#/components/schemas/OrderStatus' },
      channel: { $ref: '#/components/schemas/OrderChannel' },
      paymentMethod: { type: 'string', description: 'Payment method used' },
      shippingAddress: { type: 'string', description: 'Shipping address' },
      notes: { type: 'string', description: 'Order notes' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
      deliveredAt: { type: 'string', format: 'date-time', description: 'Delivery timestamp' }
    }
  },

  // ============= Customer Schemas =============
  Customer: {
    type: 'object',
    required: ['id', 'name', 'email', 'phone', 'totalOrders', 'totalSpent', 'tags'],
    properties: {
      id: { type: 'string', description: 'Customer ID' },
      name: { type: 'string', description: 'Customer name' },
      email: { type: 'string', format: 'email', description: 'Customer email' },
      phone: { type: 'string', description: 'Customer phone number' },
      address: { type: 'string', description: 'Customer address' },
      totalOrders: { type: 'integer', description: 'Total number of orders' },
      totalSpent: { type: 'number', format: 'float', description: 'Total amount spent' },
      tags: {
        type: 'array',
        items: { $ref: '#/components/schemas/CustomerTag' },
        description: 'Customer tags'
      },
      lastOrderDate: { type: 'string', format: 'date-time', description: 'Last order date' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  // ============= Analytics Schemas =============
  SalesStats: {
    type: 'object',
    properties: {
      totalRevenue: { type: 'number', format: 'float', description: 'Total revenue' },
      totalOrders: { type: 'integer', description: 'Total number of orders' },
      totalCustomers: { type: 'integer', description: 'Total number of customers' },
      averageOrderValue: { type: 'number', format: 'float', description: 'Average order value' },
      revenueGrowth: { type: 'number', format: 'float', description: 'Revenue growth percentage' },
      ordersGrowth: { type: 'number', format: 'float', description: 'Orders growth percentage' },
      customersGrowth: { type: 'number', format: 'float', description: 'Customers growth percentage' }
    }
  },

  // ============= Subscription Schemas =============
  SubscriptionPlan: {
    type: 'object',
    required: ['id', 'name', 'stripeProductId', 'stripePriceId', 'amountCents', 'currency', 'billingInterval', 'productLimit', 'features', 'isActive'],
    properties: {
      id: { type: 'string', description: 'Plan ID' },
      name: { type: 'string', description: 'Plan name' },
      stripeProductId: { type: 'string', description: 'Stripe product ID' },
      stripePriceId: { type: 'string', description: 'Stripe price ID' },
      amountCents: { type: 'integer', description: 'Amount in cents' },
      currency: { type: 'string', description: 'Currency code (e.g., USD, THB)' },
      billingInterval: { type: 'string', description: 'Billing interval (e.g., month, year)' },
      productLimit: { type: 'integer', description: 'Maximum number of products allowed' },
      features: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of features included in the plan'
      },
      description: { type: 'string', description: 'Plan description' },
      isActive: { type: 'boolean', description: 'Whether the plan is active' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  Subscription: {
    type: 'object',
    required: ['id', 'userId', 'planId', 'stripeSubscriptionId', 'stripeCustomerId', 'status', 'currentPeriodStart', 'currentPeriodEnd', 'cancelAtPeriodEnd'],
    properties: {
      id: { type: 'string', description: 'Subscription ID' },
      userId: { type: 'string', description: 'User ID' },
      planId: { type: 'string', description: 'Plan ID' },
      stripeSubscriptionId: { type: 'string', description: 'Stripe subscription ID' },
      stripeCustomerId: { type: 'string', description: 'Stripe customer ID' },
      status: { $ref: '#/components/schemas/SubscriptionStatus' },
      currentPeriodStart: { type: 'string', format: 'date-time', description: 'Current period start date' },
      currentPeriodEnd: { type: 'string', format: 'date-time', description: 'Current period end date' },
      cancelAtPeriodEnd: { type: 'boolean', description: 'Whether subscription will be canceled at period end' },
      canceledAt: { type: 'string', format: 'date-time', description: 'Cancellation timestamp' },
      endedAt: { type: 'string', format: 'date-time', description: 'End timestamp' },
      metadata: { type: 'object', description: 'Additional metadata' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
      plan: { $ref: '#/components/schemas/SubscriptionPlan' }
    }
  },

  // ============= Payment Schemas =============
  Payment: {
    type: 'object',
    required: ['id', 'stripeChargeId', 'stripePaymentIntentId', 'amountCents', 'currency', 'status'],
    properties: {
      id: { type: 'string', description: 'Payment ID' },
      invoiceId: { type: 'string', description: 'Invoice ID' },
      subscriptionId: { type: 'string', description: 'Subscription ID' },
      stripeChargeId: { type: 'string', description: 'Stripe charge ID' },
      stripePaymentIntentId: { type: 'string', description: 'Stripe payment intent ID' },
      amountCents: { type: 'integer', description: 'Amount in cents' },
      currency: { type: 'string', description: 'Currency code' },
      status: { type: 'string', description: 'Payment status' },
      paymentMethod: { type: 'string', description: 'Payment method' },
      receiptUrl: { type: 'string', description: 'Receipt URL' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  // ============= Marketplace Schemas =============
  MarketplacePlatform: {
    type: 'object',
    required: ['id', 'name', 'code', 'apiBaseUrl', 'isActive'],
    properties: {
      id: { type: 'string', description: 'Platform ID' },
      name: { type: 'string', description: 'Platform name' },
      code: { $ref: '#/components/schemas/MarketplaceCode' },
      iconUrl: { type: 'string', description: 'Platform icon URL' },
      apiBaseUrl: { type: 'string', description: 'API base URL' },
      description: { type: 'string', description: 'Platform description' },
      isActive: { type: 'boolean', description: 'Whether the platform is active' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  // ============= Inventory Schemas =============
  InventoryItem: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Inventory item ID' },
      productId: { type: 'string', description: 'Product ID' },
      warehouseId: { type: 'string', description: 'Warehouse ID' },
      quantity: { type: 'integer', description: 'Quantity in stock' },
      reservedQuantity: { type: 'integer', description: 'Reserved quantity' },
      reorderPoint: { type: 'integer', description: 'Reorder point threshold' },
      reorderQuantity: { type: 'integer', description: 'Reorder quantity' },
      lastRestocked: { type: 'string', format: 'date-time', description: 'Last restock timestamp' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  // ============= CRM Schemas =============
  Lead: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Lead ID' },
      name: { type: 'string', description: 'Lead name' },
      email: { type: 'string', format: 'email', description: 'Lead email' },
      phone: { type: 'string', description: 'Lead phone' },
      company: { type: 'string', description: 'Company name' },
      status: { type: 'string', description: 'Lead status' },
      source: { type: 'string', description: 'Lead source' },
      assignedTo: { type: 'string', description: 'Assigned user ID' },
      notes: { type: 'string', description: 'Lead notes' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  // ============= Email & SMS Schemas =============
  EmailTemplate: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Template ID' },
      name: { type: 'string', description: 'Template name' },
      subject: { type: 'string', description: 'Email subject' },
      htmlContent: { type: 'string', description: 'HTML content' },
      textContent: { type: 'string', description: 'Plain text content' },
      category: { type: 'string', description: 'Template category' },
      isActive: { type: 'boolean', description: 'Whether template is active' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  SMSTemplate: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Template ID' },
      name: { type: 'string', description: 'Template name' },
      content: { type: 'string', description: 'SMS content' },
      category: { type: 'string', description: 'Template category' },
      isActive: { type: 'boolean', description: 'Whether template is active' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
  },

  // ============= Error Response =============
  Error: {
    type: 'object',
    required: ['error'],
    properties: {
      error: { type: 'string', description: 'Error message' },
      details: { type: 'string', description: 'Additional error details' },
      code: { type: 'string', description: 'Error code' }
    }
  },

  // ============= Success Response =============
  SuccessMessage: {
    type: 'object',
    required: ['message'],
    properties: {
      message: { type: 'string', description: 'Success message' },
      data: { type: 'object', description: 'Response data' }
    }
  }
};

export const securitySchemes = {
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token authentication'
  },
  ApiKeyAuth: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API key authentication'
  },
  OAuth2: {
    type: 'oauth2',
    flows: {
      authorizationCode: {
        authorizationUrl: '/api/auth/authorize',
        tokenUrl: '/api/auth/token',
        scopes: {
          'read:products': 'Read products',
          'write:products': 'Create and update products',
          'read:orders': 'Read orders',
          'write:orders': 'Create and update orders',
          'read:customers': 'Read customers',
          'write:customers': 'Create and update customers',
          'admin': 'Full administrative access'
        }
      }
    }
  }
};

export const parameters = {
  limitParam: {
    name: 'limit',
    in: 'query',
    description: 'Number of items to return',
    required: false,
    schema: { type: 'integer', default: 50, minimum: 1, maximum: 100 }
  },
  offsetParam: {
    name: 'offset',
    in: 'query',
    description: 'Number of items to skip',
    required: false,
    schema: { type: 'integer', default: 0, minimum: 0 }
  },
  searchParam: {
    name: 'search',
    in: 'query',
    description: 'Search query string',
    required: false,
    schema: { type: 'string' }
  },
  statusParam: {
    name: 'status',
    in: 'query',
    description: 'Filter by status',
    required: false,
    schema: { type: 'string' }
  }
};

export const responses = {
  UnauthorizedError: {
    description: 'Authentication required',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: { error: 'Authentication required' }
      }
    }
  },
  ForbiddenError: {
    description: 'Insufficient permissions',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: { error: 'Insufficient permissions' }
      }
    }
  },
  NotFoundError: {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: { error: 'Resource not found' }
      }
    }
  },
  ValidationError: {
    description: 'Validation error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: { error: 'Validation failed', details: 'Invalid input data' }
      }
    }
  },
  ServerError: {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: { error: 'Internal server error' }
      }
    }
  }
};
