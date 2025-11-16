# Omni Sales API Documentation

Welcome to the Omni Sales API documentation. This guide provides comprehensive information about our REST API endpoints, authentication, and best practices.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Orders](#orders)
  - [Customers](#customers)
  - [Products](#products)
  - [Analytics](#analytics)
  - [Payments](#payments)
  - [Subscriptions](#subscriptions)
  - [Marketplace](#marketplace)
  - [Inventory](#inventory)
  - [CRM](#crm)
  - [Email & SMS](#email--sms)
  - [Returns & Reviews](#returns--reviews)
  - [Discounts & Loyalty](#discounts--loyalty)
- [Code Examples](#code-examples)
- [Webhooks](#webhooks)
- [FAQ](#faq)
- [Support](#support)

## Overview

The Omni Sales API is a RESTful API that allows you to integrate with our e-commerce platform. Our API provides access to:

- **120+ endpoints** across multiple domains
- **Product management** with categories and inventory tracking
- **Order processing** with multi-channel support
- **Customer management** with segmentation and RFM analysis
- **Analytics and reporting** with real-time dashboards
- **Payment processing** via Stripe integration
- **Marketplace integration** with Shopee, Lazada, and Facebook
- **Inventory management** with warehouses and stock tracking
- **CRM capabilities** with leads and opportunities
- **Email/SMS campaigns** with template support
- **Returns and refunds** processing
- **Discount codes** and loyalty programs

### Base URLs

- **Development:** `http://localhost:3000`
- **Production:** `https://api.omnisales.com`

### API Version

Current version: **v1.0.0**

## Authentication

The Omni Sales API supports multiple authentication methods:

### 1. JWT Bearer Token (Recommended)

Include the JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```bash
curl -X GET https://api.omnisales.com/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. API Key

Include your API key in the `X-API-Key` header:

```http
X-API-Key: your-api-key-here
```

**Example:**

```bash
curl -X GET https://api.omnisales.com/api/orders \
  -H "X-API-Key: YOUR_API_KEY"
```

### 3. OAuth 2.0

We support OAuth 2.0 with authorization code flow. Available scopes:

- `read:products` - Read products
- `write:products` - Create and update products
- `read:orders` - Read orders
- `write:orders` - Create and update orders
- `read:customers` - Read customers
- `write:customers` - Create and update customers
- `admin` - Full administrative access

### Obtaining Authentication Credentials

1. Log in to your Omni Sales dashboard
2. Navigate to Settings > API Keys
3. Generate a new API key or JWT token
4. Store your credentials securely (never commit to version control)

## Rate Limiting

To ensure fair usage and system stability, we implement rate limiting:

- **Read operations:** 1000 requests per hour
- **Write operations:** 100 requests per hour
- **Webhook endpoints:** No rate limiting

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

## Error Handling

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

**Example:**

```json
{
  "error": "Customer not found",
  "details": "No customer exists with ID: cus_123",
  "code": "CUSTOMER_NOT_FOUND"
}
```

## API Endpoints

### Orders

Manage orders across multiple sales channels.

#### List Orders

```http
GET /api/orders
```

**Query Parameters:**

- `limit` (integer, default: 50) - Number of orders to return
- `offset` (integer, default: 0) - Number of orders to skip
- `customerId` (string) - Filter by customer ID
- `status` (string) - Filter by status: `pending`, `processing`, `shipped`, `delivered`, `cancelled`
- `channel` (string) - Filter by channel: `online`, `offline`, `mobile`, `phone`
- `search` (string) - Search by order ID or customer name

**Example Request:**

```bash
curl -X GET "https://api.omnisales.com/api/orders?limit=10&status=processing" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**

```json
[
  {
    "id": "ord_123456",
    "customerId": "cus_789",
    "customerName": "John Doe",
    "items": [
      {
        "id": "item_1",
        "productId": "prod_456",
        "productName": "Laptop",
        "quantity": 1,
        "price": 999.99
      }
    ],
    "subtotal": 999.99,
    "tax": 79.99,
    "shipping": 20.00,
    "total": 1099.98,
    "status": "processing",
    "channel": "online",
    "paymentMethod": "credit_card",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
]
```

#### Get Order by ID

```http
GET /api/orders/{orderId}
```

**Path Parameters:**

- `orderId` (string, required) - Order ID

#### Update Order Status

```http
PUT /api/orders/{orderId}/status
```

**Request Body:**

```json
{
  "status": "shipped"
}
```

#### Get Order Items

```http
GET /api/orders/{orderId}/items
```

#### Get Order Shipping

```http
GET /api/orders/{orderId}/shipping
```

#### Get Order Payments

```http
GET /api/orders/{orderId}/payments
```

---

### Customers

Manage customer information and analytics.

#### Get Customer

```http
GET /api/customers/{customerId}
```

**Example Response:**

```json
{
  "id": "cus_123",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State 12345",
  "totalOrders": 15,
  "totalSpent": 5432.10,
  "tags": ["vip", "regular"],
  "lastOrderDate": "2024-01-10T14:30:00Z",
  "createdAt": "2023-06-01T09:00:00Z",
  "updatedAt": "2024-01-10T14:30:00Z"
}
```

#### Update Customer

```http
PUT /api/customers/{customerId}
```

**Request Body:**

```json
{
  "name": "Jane Smith",
  "email": "jane.new@example.com",
  "phone": "+1234567890",
  "address": "456 Oak Ave",
  "tags": ["vip"]
}
```

#### Delete Customer

```http
DELETE /api/customers/{customerId}
```

#### Get Customer Segments

```http
GET /api/customers/segments
```

Returns customer segmentation data based on behavior and demographics.

#### Get RFM Analysis

```http
GET /api/customers/rfm
```

Returns Recency, Frequency, Monetary (RFM) analysis for customer segmentation.

---

### Products

*Product endpoints are available in the full API specification.*

---

### Analytics

Comprehensive analytics and reporting endpoints.

#### Dashboard Analytics

```http
GET /api/analytics/dashboard
```

**Query Parameters:**

- `startDate` (date) - Start date for analytics range
- `endDate` (date) - End date for analytics range

**Example Response:**

```json
{
  "totalRevenue": 125000.50,
  "totalOrders": 1250,
  "totalCustomers": 450,
  "averageOrderValue": 100.00,
  "revenueGrowth": 15.5,
  "ordersGrowth": 12.3,
  "customersGrowth": 8.7
}
```

#### Sales Analytics

```http
GET /api/analytics/sales
```

Returns detailed sales trends and patterns.

#### Product Analytics

```http
GET /api/analytics/products
```

Returns product performance metrics.

#### Customer Analytics

```http
GET /api/analytics/customers
```

Returns customer behavior and lifetime value analytics.

#### Financial Analytics

```http
GET /api/analytics/financial
```

Returns financial metrics and profitability analysis.

---

### Payments

Process payments via Stripe integration.

#### Process Payment

```http
POST /api/payments/process
```

**Request Body:**

```json
{
  "amount": 10000,
  "currency": "usd",
  "paymentMethodId": "pm_123456",
  "customerId": "cus_123456",
  "description": "Order #12345"
}
```

**Response:**

```json
{
  "id": "pay_123",
  "stripeChargeId": "ch_123456",
  "stripePaymentIntentId": "pi_123456",
  "amountCents": 10000,
  "currency": "usd",
  "status": "succeeded",
  "receiptUrl": "https://stripe.com/receipt/...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Payment Webhook

```http
POST /api/payments/webhook
```

Stripe webhook endpoint for payment events. Configure this URL in your Stripe dashboard.

---

### Subscriptions

Manage subscription plans and billing.

#### List Plans

```http
GET /api/billing/plans
```

**Response:**

```json
[
  {
    "id": "plan_starter",
    "name": "Starter Plan",
    "stripeProductId": "prod_123",
    "stripePriceId": "price_123",
    "amountCents": 2900,
    "currency": "usd",
    "billingInterval": "month",
    "productLimit": 100,
    "features": [
      "Up to 100 products",
      "Basic analytics",
      "Email support"
    ],
    "isActive": true
  }
]
```

#### Get User Subscriptions

```http
GET /api/billing/user-subscriptions
```

#### Create Checkout Session

```http
POST /api/billing/checkout
```

**Request Body:**

```json
{
  "planId": "plan_starter"
}
```

**Response:**

```json
{
  "sessionId": "cs_test_123",
  "url": "https://checkout.stripe.com/pay/cs_test_123"
}
```

---

### Marketplace

Integrate with Shopee, Lazada, and other marketplaces.

#### List Marketplace Platforms

```http
GET /api/marketplace/platforms
```

**Response:**

```json
[
  {
    "id": "platform_shopee",
    "name": "Shopee",
    "code": "shopee",
    "iconUrl": "https://cdn.omnisales.com/shopee.png",
    "apiBaseUrl": "https://partner.shopeemobile.com",
    "isActive": true
  }
]
```

#### List Connections

```http
GET /api/marketplace/connections
```

#### Create Connection

```http
POST /api/marketplace/connections
```

**Request Body:**

```json
{
  "platformId": "platform_shopee",
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "shopId": "your-shop-id"
}
```

#### Sync Orders

```http
POST /api/marketplace/sync-orders
```

**Request Body:**

```json
{
  "platformId": "platform_shopee",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z"
}
```

---

### Inventory

Track inventory across multiple warehouses.

#### Get Stock Levels

```http
GET /api/inventory/stock
```

#### Get Inventory Movements

```http
GET /api/inventory/movements
```

#### Get Inventory Alerts

```http
GET /api/inventory/alerts
```

Returns low stock and reorder alerts.

#### Manage Warehouses

```http
GET /api/inventory/warehouses
POST /api/inventory/warehouses
```

---

### CRM

Customer relationship management features.

#### List Leads

```http
GET /api/crm/leads
```

#### Create Lead

```http
POST /api/crm/leads
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "status": "new",
  "source": "website"
}
```

#### Manage Opportunities

```http
GET /api/crm/opportunities
POST /api/crm/opportunities
```

---

### Email & SMS

Send transactional and marketing messages.

#### Send Email

```http
POST /api/email/send
```

**Request Body:**

```json
{
  "to": "customer@example.com",
  "subject": "Order Confirmation",
  "content": "Your order has been confirmed.",
  "templateId": "template_order_confirmation"
}
```

#### List Email Templates

```http
GET /api/email/templates
```

#### Email Campaigns

```http
GET /api/email/campaigns
POST /api/email/campaigns
```

#### Send SMS

```http
POST /api/sms/send
```

**Request Body:**

```json
{
  "to": "+1234567890",
  "message": "Your order #12345 has been shipped!"
}
```

---

### Returns & Reviews

Manage product returns and customer reviews.

#### List Returns

```http
GET /api/returns
POST /api/returns
```

#### Authorize Return

```http
POST /api/returns/authorize
```

#### Process Refund

```http
POST /api/returns/refund
```

#### Get Product Reviews

```http
GET /api/reviews/product?productId=prod_123
```

#### Create Review

```http
POST /api/reviews/create
```

---

### Discounts & Loyalty

Manage discount codes and loyalty programs.

#### List Discount Codes

```http
GET /api/discounts/codes
POST /api/discounts/codes
```

#### Validate Discount Code

```http
POST /api/discounts/validate
```

**Request Body:**

```json
{
  "code": "SUMMER2024",
  "orderTotal": 100.00
}
```

#### Loyalty Programs

```http
GET /api/loyalty/programs
POST /api/loyalty/programs
```

## Code Examples

### JavaScript/TypeScript

```typescript
// Using fetch API
const response = await fetch('https://api.omnisales.com/api/orders', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const orders = await response.json();

// Create an order
const newOrder = await fetch('https://api.omnisales.com/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customerId: 'cus_123',
    items: [
      { productId: 'prod_456', quantity: 2, price: 99.99 }
    ]
  })
});
```

### Python

```python
import requests

# Set up headers
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get orders
response = requests.get(
    'https://api.omnisales.com/api/orders',
    headers=headers
)
orders = response.json()

# Create an order
new_order = requests.post(
    'https://api.omnisales.com/api/orders',
    headers=headers,
    json={
        'customerId': 'cus_123',
        'items': [
            {'productId': 'prod_456', 'quantity': 2, 'price': 99.99}
        ]
    }
)
```

### cURL

```bash
# Get orders
curl -X GET "https://api.omnisales.com/api/orders" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create an order
curl -X POST "https://api.omnisales.com/api/orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_123",
    "items": [
      {"productId": "prod_456", "quantity": 2, "price": 99.99}
    ]
  }'
```

## Webhooks

Configure webhooks to receive real-time notifications about events in your account.

### Available Webhook Events

- `order.created` - New order created
- `order.updated` - Order status updated
- `payment.succeeded` - Payment completed successfully
- `payment.failed` - Payment failed
- `subscription.created` - New subscription
- `subscription.updated` - Subscription status changed
- `inventory.low_stock` - Product stock below threshold

### Webhook Payload Format

```json
{
  "event": "order.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "orderId": "ord_123",
    "customerId": "cus_456",
    "total": 199.99
  }
}
```

## FAQ

### How do I get started?

1. Sign up for an account at [https://omnisales.com](https://omnisales.com)
2. Generate an API key from Settings > API Keys
3. Start making API requests using the examples above

### Is there a sandbox environment?

Yes, use `http://localhost:3000` for local development and testing.

### What are the rate limits?

- Read operations: 1000 requests/hour
- Write operations: 100 requests/hour

### How do I report bugs or request features?

Contact us at support@omnisales.com or create an issue in our GitHub repository.

### Can I use the API for commercial purposes?

Yes, the API is available for commercial use according to our terms of service.

## Support

### Resources

- **Interactive API Explorer:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI Specification:** [/swagger.json](/swagger.json)
- **Postman Collection:** [/postman-collection.json](/postman-collection.json)

### Contact

- **Email:** support@omnisales.com
- **Documentation:** [https://docs.omnisales.com](https://docs.omnisales.com)
- **Status Page:** [https://status.omnisales.com](https://status.omnisales.com)

---

**Last Updated:** 2024-01-15
**API Version:** 1.0.0
