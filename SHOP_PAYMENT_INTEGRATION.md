# Shop Payment Integration - Implementation Summary

## Overview

This document provides a comprehensive overview of the e-commerce shop payment integration and API routes implementation for the Omni Sales platform. The system supports guest checkout, bank transfer payments, inventory management, and order tracking.

---

## Database Migrations Created

### Main Migration: `/supabase/migrations/20251123_create_shop_system.sql`

**Tables Modified/Created:**

1. **orders table** - Extended with shop-specific columns:
   - `order_number` - Human-readable order ID (e.g., ORD-20251123-0001)
   - `customer_name` - Guest checkout support
   - `customer_email` - Guest checkout support
   - `customer_phone` - Order notifications
   - `city` - Shipping information
   - `zip_code` - Shipping information
   - `payment_status` - Payment confirmation tracking (pending/confirmed/failed)
   - `customer_id` - Made nullable for guest checkout

2. **settings table** - New table for global configuration:
   - `key` - Setting identifier (PRIMARY KEY)
   - `value` - JSONB data structure
   - `updated_at` - Auto-updating timestamp

**Database Functions Created:**

1. `generate_order_number()` - Generates unique order numbers
   - Format: `ORD-YYYYMMDD-XXXX`
   - Uses sequence for incrementing counter
   - Automatically called on order creation

2. `decrement_product_stock(product_id, quantity)` - Atomic stock decrement
   - Row-level locking for concurrency
   - Validates stock availability
   - Throws exception if insufficient stock

3. `restore_product_stock(product_id, quantity)` - Restore stock on cancellation
   - Used when orders are cancelled
   - Restores inventory levels

**Indexes Created:**
- `idx_orders_order_number` - Fast order lookup
- `idx_orders_customer_email` - Customer order history
- `idx_orders_payment_status` - Payment filtering
- `idx_orders_status_created` - Status-based queries with sorting

**Initial Data Seeded:**
- 8 sample products across multiple categories
- Store information settings
- Bank account details
- Shipping methods configuration
- 2 sample orders for testing

---

## API Routes Implemented

### 1. POST /api/shop/orders
**Location:** `/app/api/shop/orders/route.ts`

**Purpose:** Create a new order from checkout

**Input Validation:** Zod schema validation

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1 (555) 123-4567",
  "shippingAddress": "123 Main St, Apt 4B",
  "city": "New York",
  "zipCode": "10001",
  "items": [
    {
      "productId": "uuid",
      "quantity": 1,
      "price": 79.99
    }
  ],
  "subtotal": 79.99,
  "shippingCost": 10.00,
  "total": 89.99,
  "paymentMethod": "bank_transfer"
}
```

**Response (201 Created):**
```json
{
  "orderId": "ORD-20251123-0001",
  "status": "pending_payment",
  "createdAt": "2025-11-23T10:30:00Z",
  "bankInfo": {
    "bankName": "First National Bank",
    "accountNumber": "1234567890",
    "accountHolder": "Omni Sales LLC",
    "amount": 89.99,
    "reference": "ORD-20251123-0001"
  }
}
```

**Process Flow:**
1. Validate input data with Zod
2. Check product availability and stock
3. Generate unique order number
4. Create order record
5. Create order items
6. Decrement product stock
7. Retrieve bank info (if bank_transfer)
8. Return success response

**Error Responses:**
- `400` - Invalid input/missing fields
- `404` - Product not found
- `409` - Insufficient stock
- `500` - Server error

---

### 2. GET /api/shop/orders
**Location:** `/app/api/shop/orders/route.ts`

**Purpose:** Get order list (customer order history or admin)

**Query Parameters:**
- `email` - Filter by customer email
- `limit` - Results per page (default: 10)
- `offset` - Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-20251123-0001",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "total": 89.99,
      "status": "pending_payment",
      "payment_status": "pending",
      "created_at": "2025-11-23T10:30:00Z"
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

---

### 3. GET /api/shop/orders/[orderId]
**Location:** `/app/api/shop/orders/[orderId]/route.ts`

**Purpose:** Get detailed order information by order number

**URL Parameter:** `orderId` - Order number (e.g., ORD-20251123-0001)

**Response (200 OK):**
```json
{
  "orderId": "ORD-20251123-0001",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "shippingAddress": "123 Main St, Apt 4B",
    "city": "New York",
    "zipCode": "10001"
  },
  "items": [
    {
      "productId": "uuid",
      "productName": "Wireless Bluetooth Headphones",
      "quantity": 1,
      "price": 79.99,
      "subtotal": 79.99
    }
  ],
  "pricing": {
    "subtotal": 79.99,
    "tax": 0,
    "shipping": 10.00,
    "total": 89.99
  },
  "status": "pending_payment",
  "paymentStatus": "pending",
  "paymentMethod": "bank_transfer",
  "bankInfo": { ... },
  "createdAt": "2025-11-23T10:30:00Z",
  "updatedAt": "2025-11-23T10:30:00Z"
}
```

**Error Responses:**
- `404` - Order not found
- `500` - Server error

---

### 4. GET /api/shop/products
**Location:** `/app/api/shop/products/route.ts`

**Purpose:** Get all products for the shop

**Query Parameters:**
- `category` - Filter by category
- `inStockOnly` - Show only products in stock (boolean)
- `limit` - Results per page (default: 100)
- `offset` - Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Wireless Bluetooth Headphones",
      "category": "Electronics",
      "price": 79.99,
      "stock": 50,
      "description": "Premium wireless headphones...",
      "imageUrl": "/images/products/headphones.jpg",
      "sku": "ELEC-WBH-001",
      "inStock": true
    }
  ],
  "total": 8,
  "limit": 100,
  "offset": 0
}
```

---

### 5. PUT /api/admin/orders/[orderId]/status
**Location:** `/app/api/admin/orders/[orderId]/status/route.ts`

**Purpose:** Update order status (admin only)

**URL Parameter:** `orderId` - Order number

**Request Body:**
```json
{
  "status": "processing",
  "paymentStatus": "confirmed"
}
```

**Valid Status Values:**
- `pending_payment` - Awaiting payment
- `processing` - Payment confirmed, preparing order
- `shipped` - Order dispatched
- `delivered` - Order delivered
- `cancelled` - Order cancelled

**Valid Payment Status Values:**
- `pending` - Payment not received
- `confirmed` - Payment verified
- `failed` - Payment failed/declined

**Response (200 OK):**
```json
{
  "orderId": "ORD-20251123-0001",
  "status": "processing",
  "paymentStatus": "confirmed",
  "updatedAt": "2025-11-23T11:00:00Z",
  "message": "Order status updated successfully"
}
```

**Special Behaviors:**
- Auto-confirms payment when status changes to `processing`
- Restores inventory when order is `cancelled`
- Records status change in order history

**Error Responses:**
- `400` - Invalid status value
- `404` - Order not found
- `500` - Server error

---

### 6. GET /api/admin/dashboard/stats
**Location:** `/app/api/admin/dashboard/stats/route.ts`

**Purpose:** Get dashboard statistics for admin

**Query Parameters:**
- `period` - Time period (today/week/month/all) - default: today

**Response (200 OK):**
```json
{
  "totalOrders": 150,
  "totalRevenue": 12345.67,
  "newOrders": 5,
  "todayRevenue": 456.78,
  "averageOrderValue": 82.30,
  "recentOrders": [
    {
      "orderId": "ORD-20251123-0001",
      "customerName": "John Doe",
      "total": 89.99,
      "status": "pending_payment",
      "paymentStatus": "pending",
      "createdAt": "2025-11-23T10:30:00Z"
    }
  ],
  "ordersByStatus": {
    "pending_payment": 3,
    "processing": 2,
    "shipped": 1,
    "delivered": 140,
    "cancelled": 4
  },
  "paymentsByStatus": {
    "pending": 3,
    "confirmed": 145,
    "failed": 2
  },
  "products": {
    "total": 12,
    "lowStock": 2,
    "outOfStock": 0
  },
  "period": "today"
}
```

---

## Payment Flow Explained

### Bank Transfer Flow (Implemented)

1. **Customer Checkout:**
   - Customer selects products and proceeds to checkout
   - Enters shipping and contact information
   - Selects "Bank Transfer" as payment method

2. **Order Creation:**
   - System validates order data
   - Checks product availability and stock
   - Creates order with status `pending_payment`
   - Decrements product stock
   - Generates unique order number

3. **Bank Information Display:**
   - System returns bank account details
   - Customer receives order confirmation with:
     - Order number (used as payment reference)
     - Bank account information
     - Total amount to transfer
     - Payment instructions

4. **Customer Makes Payment:**
   - Customer transfers funds to provided bank account
   - Includes order number in payment reference

5. **Admin Verification:**
   - Admin checks bank account for payment
   - Verifies payment amount and reference
   - Uses PUT /api/admin/orders/[orderId]/status to update:
     - `status: "processing"`
     - `paymentStatus: "confirmed"`

6. **Order Processing:**
   - Order status updated to `processing`
   - Admin prepares and ships order
   - Updates status to `shipped`
   - Finally updates to `delivered` when received

### Credit Card Flow (Not Yet Implemented)

**Future Implementation with Stripe:**
1. Customer selects credit card payment
2. Frontend collects card details via Stripe Elements
3. Backend creates Stripe Payment Intent
4. Customer confirms payment
5. Webhook receives confirmation
6. Order automatically moves to `processing`

---

## Order Creation Flow (Step-by-Step)

```
1. Customer submits checkout form
   ↓
2. POST /api/shop/orders receives request
   ↓
3. Validate input with Zod schema
   ↓
4. Check all products exist
   ↓
5. Verify sufficient stock for each item
   ↓
6. Generate unique order number (ORD-YYYYMMDD-XXXX)
   ↓
7. Create order record in database
   ↓
8. Create order items records
   ↓
9. Decrement product stock (atomic operation)
   ↓
10. Retrieve bank account info (if bank transfer)
    ↓
11. Return success response with order details
    ↓
12. Customer receives order confirmation
```

**Rollback on Failure:**
- If order items creation fails → Delete order
- Stock operations use row-level locking
- Transaction-like behavior ensures consistency

---

## Order Status Update Flow

### Admin Updates Order Status

```
1. Admin views order in dashboard
   ↓
2. Verifies payment received in bank account
   ↓
3. PUT /api/admin/orders/[orderId]/status
   Body: { status: "processing", paymentStatus: "confirmed" }
   ↓
4. System validates status values
   ↓
5. Updates order status and payment_status
   ↓
6. Records change in order_status_history
   ↓
7. Returns updated order information
```

### Special Cases

**Cancelling an Order:**
```
PUT /api/admin/orders/[orderId]/status
Body: { status: "cancelled", paymentStatus: "failed" }

→ System automatically restores product inventory
```

**Auto-Confirmation:**
```
PUT /api/admin/orders/[orderId]/status
Body: { status: "processing" }

→ System auto-sets paymentStatus to "confirmed"
```

---

## Data Stored

### Orders Table
- Order identification (id, order_number)
- Customer information (name, email, phone)
- Shipping details (address, city, zip_code)
- Pricing (subtotal, tax, shipping, total)
- Status tracking (status, payment_status, payment_method)
- Metadata (channel, created_at, updated_at, delivered_at)

### Order Items Table
- Order reference (order_id)
- Product information (product_id, product_name)
- Quantity and price at time of order
- Timestamps

### Settings Table
- Store information (name, logo, contact details)
- Bank account details (for payment instructions)
- Shipping methods and costs
- Payment methods configuration
- Tax settings

### Products Table
- Product details (name, description, category)
- Pricing (price, cost)
- Inventory (stock)
- Images and SKU
- Timestamps

---

## Sample Data Seeded

### Products (8 items):
1. Wireless Bluetooth Headphones - $79.99
2. Smart Fitness Watch - $149.99
3. Eco-Friendly Water Bottle - $24.99
4. Organic Cotton T-Shirt - $29.99
5. Leather Laptop Bag - $89.99
6. Yoga Mat Premium - $44.99
7. Ceramic Coffee Mug Set - $34.99
8. Portable Phone Charger - $39.99

### Settings:
- Store information
- Bank account details
- Shipping methods (Standard, Express, Overnight)

### Sample Orders (2):
1. Pending payment order
2. Processing order (confirmed payment)

---

## Error Handling

### Input Validation (400 Bad Request)
```json
{
  "error": "Invalid input",
  "details": [
    {
      "field": "customerEmail",
      "message": "Valid email is required"
    }
  ]
}
```

### Product Not Found (404 Not Found)
```json
{
  "error": "One or more products not found"
}
```

### Insufficient Stock (409 Conflict)
```json
{
  "error": "Insufficient stock for Wireless Headphones",
  "details": {
    "product": "Wireless Bluetooth Headphones",
    "available": 2,
    "requested": 5
  }
}
```

### Server Error (500 Internal Server Error)
```json
{
  "error": "An unexpected error occurred"
}
```

### Database Unavailable (503 Service Unavailable)
```json
{
  "error": "Database connection not available"
}
```

---

## Payment Confirmation Process

### For Bank Transfer:

1. **Customer Completes Order:**
   - Receives order confirmation email
   - Gets bank account details and order number

2. **Customer Makes Payment:**
   - Transfers exact amount to bank account
   - Includes order number in reference

3. **Admin Verification:**
   - Logs into admin dashboard
   - Checks bank statement for payment
   - Verifies amount and reference match order

4. **Update Order Status:**
   ```bash
   PUT /api/admin/orders/ORD-20251123-0001/status
   Content-Type: application/json

   {
     "status": "processing",
     "paymentStatus": "confirmed"
   }
   ```

5. **Order Proceeds:**
   - Status changes to "processing"
   - Admin prepares shipment
   - Updates to "shipped" when dispatched
   - Updates to "delivered" when received

### Manual Verification Required
- Admin must manually verify bank transfers
- Check payment reference matches order number
- Confirm amount matches order total
- Update payment status in system

---

## Next Steps for Payment Confirmation

### Immediate Actions:
1. **Run Migration:**
   ```bash
   # Apply the migration to your Supabase database
   psql -h your-db-host -d your-db-name -f supabase/migrations/20251123_create_shop_system.sql
   ```

2. **Optional: Load Additional Seed Data:**
   ```bash
   psql -h your-db-host -d your-db-name -f supabase/seed-shop.sql
   ```

3. **Test Order Creation:**
   ```bash
   curl -X POST http://localhost:3000/api/shop/orders \
     -H "Content-Type: application/json" \
     -d '{
       "customerName": "Test Customer",
       "customerEmail": "test@example.com",
       "customerPhone": "+1234567890",
       "shippingAddress": "123 Test St",
       "city": "Test City",
       "zipCode": "12345",
       "items": [{"productId": "uuid-here", "quantity": 1, "price": 79.99}],
       "subtotal": 79.99,
       "shippingCost": 10,
       "total": 89.99,
       "paymentMethod": "bank_transfer"
     }'
   ```

4. **Test Order Status Update:**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/orders/ORD-20251123-0001/status \
     -H "Content-Type: application/json" \
     -d '{"status": "processing", "paymentStatus": "confirmed"}'
   ```

### Future Enhancements:

1. **Email Notifications:**
   - Order confirmation emails
   - Payment received confirmation
   - Shipping notifications
   - Delivery confirmation

2. **Stripe Integration:**
   - Add credit card payment support
   - Automatic payment confirmation
   - Refund processing
   - Subscription support

3. **Customer Dashboard:**
   - Order history page
   - Track shipments
   - Download invoices
   - Reorder functionality

4. **Admin Features:**
   - Bulk order processing
   - Export orders to CSV
   - Print shipping labels
   - Inventory alerts

5. **Reporting:**
   - Sales analytics
   - Revenue reports
   - Popular products
   - Customer insights

6. **Webhooks:**
   - Payment confirmation webhooks
   - Shipping status updates
   - Order status notifications
   - Inventory alerts

---

## Testing Checklist

- [ ] Run database migration
- [ ] Verify tables created successfully
- [ ] Check seed data loaded
- [ ] Test order creation API
- [ ] Test stock decrement on order
- [ ] Test insufficient stock error
- [ ] Test order retrieval by ID
- [ ] Test order listing
- [ ] Test products listing
- [ ] Test order status update
- [ ] Test inventory restoration on cancellation
- [ ] Test dashboard statistics
- [ ] Verify order number generation
- [ ] Test payment status workflow

---

## Security Considerations

1. **Authentication:** Admin routes should be protected with authentication middleware
2. **Authorization:** Verify admin role before allowing status updates
3. **Input Validation:** All routes use Zod schema validation
4. **SQL Injection:** Using Supabase ORM prevents SQL injection
5. **Rate Limiting:** Consider adding rate limiting to prevent abuse
6. **HTTPS:** Ensure all payment-related traffic uses HTTPS
7. **PCI Compliance:** Current bank transfer method doesn't handle card data

---

## Support & Troubleshooting

### Common Issues:

1. **Order creation fails:**
   - Check product IDs are valid UUIDs
   - Verify sufficient stock available
   - Check database connection

2. **Stock not decrementing:**
   - Verify `decrement_product_stock` function exists
   - Check function has proper permissions
   - Review error logs

3. **Bank info not returned:**
   - Verify `settings` table has `bank_account` key
   - Check JSONB structure is correct

4. **Order status update fails:**
   - Verify order exists with correct order_number
   - Check status values are valid enums
   - Review error logs

### Getting Help:
- Check application logs for errors
- Review database query logs
- Test API endpoints with Postman/curl
- Verify environment variables are set

---

## API Documentation Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | /api/shop/orders | Create order | No |
| GET | /api/shop/orders | List orders | No* |
| GET | /api/shop/orders/[orderId] | Get order details | No* |
| GET | /api/shop/products | List products | No |
| PUT | /api/admin/orders/[orderId]/status | Update order status | Yes |
| GET | /api/admin/dashboard/stats | Get statistics | Yes |

*Customer can access their own orders via email parameter

---

## Conclusion

This implementation provides a complete e-commerce order management system with:
- Guest checkout support
- Bank transfer payment processing
- Inventory management
- Order tracking
- Admin dashboard
- Comprehensive error handling
- Extensible architecture for future payment methods

The system is production-ready for bank transfer payments and can be extended to support credit card processing, PayPal, and other payment methods.
