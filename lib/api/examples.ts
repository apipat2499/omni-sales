/**
 * API Usage Examples for Omni-Sales Application
 * ตัวอย่างการใช้งาน API สำหรับแอปพลิเคชัน Omni-Sales
 *
 * This file contains comprehensive examples of how to use the Omni-Sales API
 * including cURL commands and JavaScript/TypeScript examples
 */

import { apiClient } from './client';
import { endpoints } from './endpoints';
import type {
  GetOrdersRequest,
  CreateOrderRequest,
  AddOrderItemRequest,
  CreateProductRequest,
  CreateCustomerRequest,
} from './endpoints';

// ============================================
// AUTHENTICATION EXAMPLES
// ตัวอย่างการยืนยันตัวตน
// ============================================

/**
 * Example: Setting authentication token
 * ตัวอย่าง: การตั้งค่า token สำหรับการยืนยันตัวตน
 */
export function exampleSetAuthToken() {
  const token = 'your-jwt-token-here';
  apiClient.setAuthToken(token);
}

/**
 * cURL Example: Authentication
 * ตัวอย่าง cURL: การยืนยันตัวตน
 */
export const curlExampleAuth = `
# Set authentication token in headers
# ตั้งค่า token ในส่วนหัว
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     https://api.omni-sales.com/orders
`;

// ============================================
// ORDER EXAMPLES
// ตัวอย่างคำสั่งซื้อ
// ============================================

/**
 * Example: Get all orders
 * ตัวอย่าง: ดึงข้อมูลคำสั่งซื้อทั้งหมด
 */
export async function exampleGetOrders() {
  try {
    const params: GetOrdersRequest = {
      status: 'processing',
      channel: 'online',
      limit: 50,
      offset: 0,
    };

    const orders = await apiClient.get(endpoints.orders.list(), params);
    console.log('Orders:', orders);
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

/**
 * cURL Example: Get all orders
 * ตัวอย่าง cURL: ดึงข้อมูลคำสั่งซื้อทั้งหมด
 */
export const curlExampleGetOrders = `
# Get all orders with filters
# ดึงข้อมูลคำสั่งซื้อทั้งหมดพร้อมตัวกรอง
curl -X GET "https://api.omni-sales.com/orders?status=processing&channel=online&limit=50" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"

# Get orders for a specific customer
# ดึงข้อมูลคำสั่งซื้อของลูกค้าคนใดคนหนึ่ง
curl -X GET "https://api.omni-sales.com/orders?customerId=CUST-001" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"

# Search orders
# ค้นหาคำสั่งซื้อ
curl -X GET "https://api.omni-sales.com/orders?search=ORD-001" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"
`;

/**
 * JavaScript/Fetch Example: Get all orders
 * ตัวอย่าง JavaScript/Fetch: ดึงข้อมูลคำสั่งซื้อทั้งหมด
 */
export const fetchExampleGetOrders = `
// Using native fetch API
// ใช้ fetch API แบบเนทีฟ
async function getOrders() {
  const response = await fetch('https://api.omni-sales.com/orders?status=processing&limit=50', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const orders = await response.json();
  console.log('Orders:', orders);
  return orders;
}

// Using the API client
// ใช้ API client
import { apiClient, endpoints } from './lib/api';

async function getOrdersWithClient() {
  apiClient.setAuthToken('YOUR_JWT_TOKEN');

  const orders = await apiClient.get(endpoints.orders.list(), {
    status: 'processing',
    limit: 50,
  });

  console.log('Orders:', orders);
  return orders;
}
`;

/**
 * Example: Get a specific order
 * ตัวอย่าง: ดึงข้อมูลคำสั่งซื้อเฉพาะ
 */
export async function exampleGetOrder(orderId: string) {
  try {
    const order = await apiClient.get(endpoints.orders.get(orderId));
    console.log('Order:', order);
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * cURL Example: Get a specific order
 * ตัวอย่าง cURL: ดึงข้อมูลคำสั่งซื้อเฉพาะ
 */
export const curlExampleGetOrder = `
# Get order by ID
# ดึงข้อมูลคำสั่งซื้อด้วย ID
curl -X GET "https://api.omni-sales.com/orders/ORD-001" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"
`;

/**
 * Example: Create a new order
 * ตัวอย่าง: สร้างคำสั่งซื้อใหม่
 */
export async function exampleCreateOrder() {
  try {
    const orderData: CreateOrderRequest = {
      customerId: 'CUST-001',
      customerName: 'สมชาย ใจดี',
      items: [
        {
          productId: 'PROD-001',
          productName: 'สินค้าตัวอย่าง',
          quantity: 2,
          price: 500,
        },
        {
          productId: 'PROD-002',
          productName: 'สินค้าอื่น',
          quantity: 1,
          price: 750,
        },
      ],
      subtotal: 1750,
      tax: 122.5,
      shipping: 50,
      total: 1922.5,
      status: 'pending',
      channel: 'online',
      paymentMethod: 'credit_card',
      shippingAddress: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
      notes: 'กรุณาจัดส่งในช่วงบ่าย',
    };

    const order = await apiClient.post(endpoints.orders.create(), orderData);
    console.log('Created order:', order);
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * cURL Example: Create a new order
 * ตัวอย่าง cURL: สร้างคำสั่งซื้อใหม่
 */
export const curlExampleCreateOrder = `
# Create a new order
# สร้างคำสั่งซื้อใหม่
curl -X POST "https://api.omni-sales.com/orders" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "customerId": "CUST-001",
       "customerName": "สมชาย ใจดี",
       "items": [
         {
           "productId": "PROD-001",
           "productName": "สินค้าตัวอย่าง",
           "quantity": 2,
           "price": 500
         }
       ],
       "subtotal": 1000,
       "tax": 70,
       "shipping": 50,
       "total": 1120,
       "status": "pending",
       "channel": "online",
       "paymentMethod": "credit_card",
       "shippingAddress": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
       "notes": "กรุณาจัดส่งในช่วงบ่าย"
     }'
`;

/**
 * Example: Update order status
 * ตัวอย่าง: อัปเดตสถานะคำสั่งซื้อ
 */
export async function exampleUpdateOrderStatus(orderId: string) {
  try {
    const result = await apiClient.put(endpoints.orders.updateStatus(orderId), {
      status: 'shipped',
    });
    console.log('Updated order status:', result);
    return result;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * cURL Example: Update order status
 * ตัวอย่าง cURL: อัปเดตสถานะคำสั่งซื้อ
 */
export const curlExampleUpdateOrderStatus = `
# Update order status
# อัปเดตสถานะคำสั่งซื้อ
curl -X PUT "https://api.omni-sales.com/orders/ORD-001" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "status": "shipped"
     }'
`;

// ============================================
// ORDER ITEMS EXAMPLES
// ตัวอย่างรายการสินค้าในคำสั่งซื้อ
// ============================================

/**
 * Example: Get order items
 * ตัวอย่าง: ดึงรายการสินค้าในคำสั่งซื้อ
 */
export async function exampleGetOrderItems(orderId: string) {
  try {
    const items = await apiClient.get(endpoints.orderItems.list(orderId));
    console.log('Order items:', items);
    return items;
  } catch (error) {
    console.error('Error fetching order items:', error);
    throw error;
  }
}

/**
 * cURL Example: Get order items
 * ตัวอย่าง cURL: ดึงรายการสินค้าในคำสั่งซื้อ
 */
export const curlExampleGetOrderItems = `
# Get all items in an order
# ดึงรายการสินค้าทั้งหมดในคำสั่งซื้อ
curl -X GET "https://api.omni-sales.com/orders/ORD-001/items" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"
`;

/**
 * Example: Add item to order
 * ตัวอย่าง: เพิ่มรายการสินค้าในคำสั่งซื้อ
 */
export async function exampleAddOrderItem(orderId: string) {
  try {
    const itemData: AddOrderItemRequest = {
      orderId,
      productId: 'PROD-003',
      productName: 'สินค้าเพิ่มเติม',
      quantity: 1,
      price: 350,
      discount: 0,
      notes: '',
    };

    const item = await apiClient.post(endpoints.orderItems.add(orderId), itemData);
    console.log('Added item:', item);
    return item;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
}

/**
 * cURL Example: Add item to order
 * ตัวอย่าง cURL: เพิ่มรายการสินค้าในคำสั่งซื้อ
 */
export const curlExampleAddOrderItem = `
# Add a new item to an order
# เพิ่มรายการสินค้าใหม่ในคำสั่งซื้อ
curl -X POST "https://api.omni-sales.com/orders/ORD-001/items" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "productId": "PROD-003",
       "productName": "สินค้าเพิ่มเติม",
       "quantity": 1,
       "price": 350,
       "discount": 0
     }'
`;

/**
 * Example: Update order item
 * ตัวอย่าง: อัปเดตรายการสินค้าในคำสั่งซื้อ
 */
export async function exampleUpdateOrderItem(orderId: string, itemId: string) {
  try {
    const item = await apiClient.put(endpoints.orderItems.update(orderId, itemId), {
      quantity: 3,
      price: 480,
    });
    console.log('Updated item:', item);
    return item;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

/**
 * cURL Example: Update order item
 * ตัวอย่าง cURL: อัปเดตรายการสินค้าในคำสั่งซื้อ
 */
export const curlExampleUpdateOrderItem = `
# Update an order item
# อัปเดตรายการสินค้า
curl -X PUT "https://api.omni-sales.com/orders/ORD-001/items/ITEM-001" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "quantity": 3,
       "price": 480
     }'
`;

/**
 * Example: Delete order item
 * ตัวอย่าง: ลบรายการสินค้าในคำสั่งซื้อ
 */
export async function exampleDeleteOrderItem(orderId: string, itemId: string) {
  try {
    const result = await apiClient.delete(endpoints.orderItems.delete(orderId, itemId));
    console.log('Deleted item:', result);
    return result;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

/**
 * cURL Example: Delete order item
 * ตัวอย่าง cURL: ลบรายการสินค้าในคำสั่งซื้อ
 */
export const curlExampleDeleteOrderItem = `
# Delete an order item
# ลบรายการสินค้า
curl -X DELETE "https://api.omni-sales.com/orders/ORD-001/items/ITEM-001" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"
`;

// ============================================
// PRODUCT EXAMPLES
// ตัวอย่างสินค้า
// ============================================

/**
 * Example: Get all products
 * ตัวอย่าง: ดึงข้อมูลสินค้าทั้งหมด
 */
export async function exampleGetProducts() {
  try {
    const products = await apiClient.get(endpoints.products.list(), {
      search: 'สินค้า',
      category: 'Electronics',
    });
    console.log('Products:', products);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * cURL Example: Get all products
 * ตัวอย่าง cURL: ดึงข้อมูลสินค้าทั้งหมด
 */
export const curlExampleGetProducts = `
# Get all products
# ดึงข้อมูลสินค้าทั้งหมด
curl -X GET "https://api.omni-sales.com/products" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"

# Search products by name or SKU
# ค้นหาสินค้าด้วยชื่อหรือ SKU
curl -X GET "https://api.omni-sales.com/products?search=สินค้า" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"

# Filter products by category
# กรองสินค้าตามหมวดหมู่
curl -X GET "https://api.omni-sales.com/products?category=Electronics" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"
`;

/**
 * Example: Create a new product
 * ตัวอย่าง: สร้างสินค้าใหม่
 */
export async function exampleCreateProduct() {
  try {
    const productData: CreateProductRequest = {
      name: 'สินค้าใหม่',
      category: 'Electronics',
      price: 1500,
      cost: 1000,
      stock: 100,
      sku: 'PROD-NEW-001',
      description: 'รายละเอียดสินค้า',
      image: 'https://example.com/product-image.jpg',
    };

    const product = await apiClient.post(endpoints.products.create(), productData);
    console.log('Created product:', product);
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * cURL Example: Create a new product
 * ตัวอย่าง cURL: สร้างสินค้าใหม่
 */
export const curlExampleCreateProduct = `
# Create a new product
# สร้างสินค้าใหม่
curl -X POST "https://api.omni-sales.com/products" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "name": "สินค้าใหม่",
       "category": "Electronics",
       "price": 1500,
       "cost": 1000,
       "stock": 100,
       "sku": "PROD-NEW-001",
       "description": "รายละเอียดสินค้า"
     }'
`;

// ============================================
// CUSTOMER EXAMPLES
// ตัวอย่างลูกค้า
// ============================================

/**
 * Example: Get all customers
 * ตัวอย่าง: ดึงข้อมูลลูกค้าทั้งหมด
 */
export async function exampleGetCustomers() {
  try {
    const customers = await apiClient.get(endpoints.customers.list(), {
      search: 'สมชาย',
      tag: 'vip',
    });
    console.log('Customers:', customers);
    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

/**
 * cURL Example: Get all customers
 * ตัวอย่าง cURL: ดึงข้อมูลลูกค้าทั้งหมด
 */
export const curlExampleGetCustomers = `
# Get all customers
# ดึงข้อมูลลูกค้าทั้งหมด
curl -X GET "https://api.omni-sales.com/customers" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"

# Search customers
# ค้นหาลูกค้า
curl -X GET "https://api.omni-sales.com/customers?search=สมชาย" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"

# Filter customers by tag
# กรองลูกค้าตามแท็ก
curl -X GET "https://api.omni-sales.com/customers?tag=vip" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"
`;

/**
 * Example: Create a new customer
 * ตัวอย่าง: สร้างลูกค้าใหม่
 */
export async function exampleCreateCustomer() {
  try {
    const customerData: CreateCustomerRequest = {
      name: 'สมชาย ใจดี',
      email: 'somchai@example.com',
      phone: '081-234-5678',
      address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
      tags: ['vip', 'regular'],
    };

    const customer = await apiClient.post(endpoints.customers.create(), customerData);
    console.log('Created customer:', customer);
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

/**
 * cURL Example: Create a new customer
 * ตัวอย่าง cURL: สร้างลูกค้าใหม่
 */
export const curlExampleCreateCustomer = `
# Create a new customer
# สร้างลูกค้าใหม่
curl -X POST "https://api.omni-sales.com/customers" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "name": "สมชาย ใจดี",
       "email": "somchai@example.com",
       "phone": "081-234-5678",
       "address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
       "tags": ["vip", "regular"]
     }'
`;

// ============================================
// ANALYTICS EXAMPLES
// ตัวอย่างการวิเคราะห์
// ============================================

/**
 * Example: Get sales analytics
 * ตัวอย่าง: ดึงข้อมูลการวิเคราะห์การขาย
 */
export async function exampleGetSalesAnalytics() {
  try {
    const analytics = await apiClient.get(endpoints.analytics.sales(), {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      groupBy: 'month',
    });
    console.log('Sales analytics:', analytics);
    return analytics;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

/**
 * cURL Example: Get sales analytics
 * ตัวอย่าง cURL: ดึงข้อมูลการวิเคราะห์การขาย
 */
export const curlExampleGetSalesAnalytics = `
# Get sales analytics
# ดึงข้อมูลการวิเคราะห์การขาย
curl -X GET "https://api.omni-sales.com/analytics/sales?startDate=2025-01-01&endDate=2025-12-31&groupBy=month" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"
`;

// ============================================
// ERROR HANDLING EXAMPLES
// ตัวอย่างการจัดการข้อผิดพลาด
// ============================================

/**
 * Example: Error handling with try-catch
 * ตัวอย่าง: การจัดการข้อผิดพลาดด้วย try-catch
 */
export async function exampleErrorHandling() {
  try {
    const order = await apiClient.get(endpoints.orders.get('INVALID-ID'));
    console.log('Order:', order);
  } catch (error: any) {
    if (error.status === 404) {
      console.error('Order not found');
    } else if (error.status === 401) {
      console.error('Unauthorized - please login');
    } else if (error.status === 500) {
      console.error('Server error - please try again later');
    } else {
      console.error('Error:', error.message);
    }
  }
}

/**
 * Example: Using error interceptors
 * ตัวอย่าง: การใช้ error interceptors
 */
export function exampleErrorInterceptor() {
  apiClient.addErrorInterceptor(async (error) => {
    // Log error to analytics service
    console.log('Logging error to analytics:', error);

    // Add custom error message based on Thai language
    if (error.status === 404) {
      error.message = 'ไม่พบข้อมูลที่ต้องการ';
    } else if (error.status === 401) {
      error.message = 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
    } else if (error.status === 500) {
      error.message = 'เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง';
    }

    return error;
  });
}

// ============================================
// ADVANCED EXAMPLES
// ตัวอย่างขั้นสูง
// ============================================

/**
 * Example: Using request interceptors for logging
 * ตัวอย่าง: การใช้ request interceptors สำหรับบันทึกข้อมูล
 */
export function exampleRequestInterceptor() {
  apiClient.addRequestInterceptor(async (config) => {
    // Log request
    console.log('Making request:', config.method, config);

    // Add custom headers
    config.headers = {
      ...config.headers,
      'X-Request-ID': `req-${Date.now()}`,
      'X-Client-Version': '1.0.0',
    };

    return config;
  });
}

/**
 * Example: Using response interceptors for data transformation
 * ตัวอย่าง: การใช้ response interceptors สำหรับแปลงข้อมูล
 */
export function exampleResponseInterceptor() {
  apiClient.addResponseInterceptor(async (response) => {
    // Log response
    console.log('Received response:', response.status);

    // Add custom processing
    // You can transform response here if needed

    return response;
  });
}

/**
 * Example: Batch operations
 * ตัวอย่าง: การทำงานแบบชุด
 */
export async function exampleBatchOperations() {
  try {
    // Fetch multiple resources in parallel
    // ดึงข้อมูลหลายแหล่งพร้อมกัน
    const [orders, products, customers] = await Promise.all([
      apiClient.get(endpoints.orders.list(), { limit: 10 }),
      apiClient.get(endpoints.products.list()),
      apiClient.get(endpoints.customers.list()),
    ]);

    console.log('Batch results:', { orders, products, customers });
    return { orders, products, customers };
  } catch (error) {
    console.error('Error in batch operations:', error);
    throw error;
  }
}

/**
 * Example: Pagination
 * ตัวอย่าง: การแบ่งหน้า
 */
export async function examplePagination() {
  const pageSize = 20;
  let page = 0;
  let allOrders = [];

  try {
    while (true) {
      const orders = await apiClient.get(endpoints.orders.list(), {
        limit: pageSize,
        offset: page * pageSize,
      });

      if (orders.length === 0) {
        break; // No more data
      }

      allOrders.push(...orders);
      page++;

      // Stop after getting 100 orders for this example
      if (allOrders.length >= 100) {
        break;
      }
    }

    console.log('Total orders fetched:', allOrders.length);
    return allOrders;
  } catch (error) {
    console.error('Error in pagination:', error);
    throw error;
  }
}

/**
 * Example: Complete order workflow
 * ตัวอย่าง: ขั้นตอนการทำงานแบบสมบูรณ์ของคำสั่งซื้อ
 */
export async function exampleCompleteOrderWorkflow() {
  try {
    // 1. Create order
    // สร้างคำสั่งซื้อ
    const orderData: CreateOrderRequest = {
      customerId: 'CUST-001',
      customerName: 'สมชาย ใจดี',
      items: [
        {
          productId: 'PROD-001',
          productName: 'สินค้าตัวอย่าง',
          quantity: 2,
          price: 500,
        },
      ],
      subtotal: 1000,
      tax: 70,
      shipping: 50,
      total: 1120,
      status: 'pending',
      channel: 'online',
      paymentMethod: 'credit_card',
      shippingAddress: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    };

    const order = await apiClient.post(endpoints.orders.create(), orderData);
    console.log('1. Created order:', order.id);

    // 2. Update order status to processing
    // อัปเดตสถานะเป็น processing
    await apiClient.put(endpoints.orders.updateStatus(order.id), {
      status: 'processing',
    });
    console.log('2. Updated to processing');

    // 3. Add additional item
    // เพิ่มรายการสินค้า
    await apiClient.post(endpoints.orderItems.add(order.id), {
      orderId: order.id,
      productId: 'PROD-002',
      productName: 'สินค้าเพิ่มเติม',
      quantity: 1,
      price: 350,
    });
    console.log('3. Added item');

    // 4. Update to shipped
    // อัปเดตสถานะเป็น shipped
    await apiClient.put(endpoints.orders.updateStatus(order.id), {
      status: 'shipped',
    });
    console.log('4. Updated to shipped');

    // 5. Finally mark as delivered
    // อัปเดตสถานะเป็น delivered
    await apiClient.put(endpoints.orders.updateStatus(order.id), {
      status: 'delivered',
    });
    console.log('5. Updated to delivered');

    // 6. Get final order state
    // ดึงข้อมูลสถานะสุดท้าย
    const finalOrder = await apiClient.get(endpoints.orders.get(order.id));
    console.log('6. Final order:', finalOrder);

    return finalOrder;
  } catch (error) {
    console.error('Error in workflow:', error);
    throw error;
  }
}

// ============================================
// EXPORT ALL EXAMPLES
// ส่งออกตัวอย่างทั้งหมด
// ============================================

export const examples = {
  // Authentication
  auth: {
    setToken: exampleSetAuthToken,
    curlExample: curlExampleAuth,
  },

  // Orders
  orders: {
    getAll: exampleGetOrders,
    getOne: exampleGetOrder,
    create: exampleCreateOrder,
    updateStatus: exampleUpdateOrderStatus,
    curlGetAll: curlExampleGetOrders,
    curlGetOne: curlExampleGetOrder,
    curlCreate: curlExampleCreateOrder,
    curlUpdateStatus: curlExampleUpdateOrderStatus,
    fetchExample: fetchExampleGetOrders,
  },

  // Order Items
  orderItems: {
    getAll: exampleGetOrderItems,
    add: exampleAddOrderItem,
    update: exampleUpdateOrderItem,
    delete: exampleDeleteOrderItem,
    curlGetAll: curlExampleGetOrderItems,
    curlAdd: curlExampleAddOrderItem,
    curlUpdate: curlExampleUpdateOrderItem,
    curlDelete: curlExampleDeleteOrderItem,
  },

  // Products
  products: {
    getAll: exampleGetProducts,
    create: exampleCreateProduct,
    curlGetAll: curlExampleGetProducts,
    curlCreate: curlExampleCreateProduct,
  },

  // Customers
  customers: {
    getAll: exampleGetCustomers,
    create: exampleCreateCustomer,
    curlGetAll: curlExampleGetCustomers,
    curlCreate: curlExampleCreateCustomer,
  },

  // Analytics
  analytics: {
    sales: exampleGetSalesAnalytics,
    curlSales: curlExampleGetSalesAnalytics,
  },

  // Advanced
  advanced: {
    errorHandling: exampleErrorHandling,
    errorInterceptor: exampleErrorInterceptor,
    requestInterceptor: exampleRequestInterceptor,
    responseInterceptor: exampleResponseInterceptor,
    batchOperations: exampleBatchOperations,
    pagination: examplePagination,
    completeWorkflow: exampleCompleteOrderWorkflow,
  },
};

export default examples;
