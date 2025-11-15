# Order Management System Documentation

## Overview

The Order Management System provides complete order lifecycle management including creation, status tracking, payments, shipping, returns, refunds, and fulfillment tracking. Built with multi-tenancy support for secure data isolation.

## Database Schema

### Core Tables

#### `orders`
Main orders table with core order information.

**Columns:**
- `id` (uuid, PK) - Unique order identifier
- `user_id` (uuid, FK) - Owner/merchant ID for multi-tenancy
- `customer_id` (text) - Reference to customer
- `order_number` (text) - Human-readable order number
- `status` (enum) - Current order status (pending, paid, shipped, delivered, cancelled)
- `total` (decimal) - Order total amount
- `subtotal` (decimal) - Subtotal before tax/shipping
- `tax_amount` (decimal) - Tax amount
- `shipping_cost` (decimal) - Shipping cost
- `discount_amount` (decimal) - Total discounts applied
- `currency` (text, default: 'USD') - Order currency
- `notes` (text) - Internal notes
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

**Indexes:**
- `orders_user_id_idx` - For filtering by merchant
- `orders_customer_id_idx` - For customer lookups
- `orders_status_idx` - For status filtering
- `orders_created_at_idx` - For date range queries

#### `order_items`
Line items for orders.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK) - Merchant ID
- `order_id` (uuid, FK) - Reference to order
- `product_id` (text) - Reference to product
- `product_name` (text) - Product name (denormalized)
- `quantity` (integer) - Quantity ordered
- `unit_price` (decimal) - Price per unit
- `total_price` (decimal) - Quantity × Unit Price
- `sku` (text) - Product SKU (denormalized)
- `created_at` (timestamp)

**Indexes:**
- `order_items_order_id_idx` - For order detail lookups
- `order_items_product_id_idx` - For inventory tracking

#### `order_status_history`
Audit trail for order status changes.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK) - Merchant ID
- `order_id` (uuid, FK) - Reference to order
- `status` (text) - New status
- `reason` (text) - Reason for change
- `notes` (text) - Additional notes
- `changed_by` (text) - User who made the change
- `created_at` (timestamp)

**Indexes:**
- `order_status_history_order_id_idx` - For retrieving order history
- `order_status_history_created_at_idx` - For timeline queries

#### `order_payments`
Payment records for orders.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK) - Merchant ID
- `order_id` (uuid, FK) - Reference to order
- `payment_method` (text) - Payment method (card, bank_transfer, etc)
- `amount` (decimal) - Payment amount
- `currency` (text, default: 'USD')
- `payment_status` (enum) - Status (pending, completed, failed, refunded)
- `transaction_id` (text) - External transaction ID
- `gateway_response` (jsonb) - Full payment gateway response
- `paid_at` (timestamp) - Payment completion time
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `order_payments_order_id_idx` - For payment history
- `order_payments_transaction_id_idx` - For external lookups

#### `order_shipping`
Shipping information and tracking.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `order_id` (uuid, FK)
- `shipping_method` (text) - Shipping method (standard, express, etc)
- `carrier` (text) - Shipping carrier (FedEx, UPS, etc)
- `tracking_number` (text) - Carrier tracking number
- `shipping_address` (text) - Full shipping address
- `weight_kg` (decimal) - Package weight
- `dimensions_cm` (text) - Package dimensions (LxWxH)
- `shipping_status` (enum) - Status (pending, picked, packed, shipped, in_transit, delivered, failed)
- `signature_required` (boolean) - Signature required on delivery
- `special_instructions` (text) - Special handling instructions
- `shipped_at` (timestamp) - When shipped
- `delivered_at` (timestamp) - When delivered
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `order_shipping_order_id_idx` - For order lookups
- `order_shipping_tracking_number_idx` - For carrier lookups

#### `order_returns`
Return request tracking.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `order_id` (uuid, FK)
- `return_number` (text, unique) - Return RMA number
- `return_reason` (text) - Reason for return
- `reason_details` (text) - Detailed reason
- `return_status` (enum) - Status (pending, approved, rejected, received, processed)
- `refund_amount` (decimal) - Amount to refund
- `notes` (text) - Internal notes
- `approved_at` (timestamp)
- `received_at` (timestamp)
- `processed_at` (timestamp)
- `created_at` (timestamp)

**Indexes:**
- `order_returns_order_id_idx`
- `order_returns_return_number_idx`

#### `return_items`
Items included in a return.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `return_id` (uuid, FK)
- `product_id` (text)
- `product_name` (text)
- `quantity` (integer)
- `unit_price` (decimal)
- `condition` (text) - Item condition (new, like_new, used, damaged)
- `created_at` (timestamp)

**Indexes:**
- `return_items_return_id_idx`

#### `refunds`
Refund processing and tracking.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `order_id` (uuid, FK)
- `return_id` (uuid, FK)
- `amount` (decimal) - Refund amount
- `reason` (text) - Reason for refund
- `refund_method` (text) - Method (original_payment, store_credit, etc)
- `refund_status` (enum) - Status (pending, processing, completed, failed)
- `transaction_id` (text) - External transaction ID
- `gateway_response` (jsonb) - Payment gateway response
- `completed_at` (timestamp)
- `created_at` (timestamp)

**Indexes:**
- `refunds_order_id_idx`
- `refunds_transaction_id_idx`

#### `fulfillment_tasks`
Fulfillment workflow tasks (pick, pack, ship).

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `order_id` (uuid, FK)
- `task_type` (text) - Type (pick, pack, ship, verify)
- `task_status` (enum) - Status (pending, in_progress, completed, failed)
- `priority` (text, default: 'medium') - Priority level
- `assigned_to` (text) - Assigned user/team
- `notes` (text) - Task notes
- `completed_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `fulfillment_tasks_order_id_idx`
- `fulfillment_tasks_status_idx`

#### `order_discounts`
Discount tracking for orders.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `order_id` (uuid, FK)
- `code` (text) - Discount/coupon code
- `discount_type` (text) - Type (percentage, fixed)
- `discount_value` (decimal) - Amount or percentage
- `amount_applied` (decimal) - Actual amount discounted
- `created_at` (timestamp)

**Indexes:**
- `order_discounts_order_id_idx`
- `order_discounts_code_idx`

## TypeScript Types

### Order Types

```typescript
export interface Order {
  id: string;
  userId: string;
  customerId: string;
  orderNumber: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetails extends Order {
  orderItems?: OrderItem[];
  orderPayments?: OrderPayment[];
  orderShipping?: OrderShipping[];
  orderReturns?: OrderReturn[];
  refunds?: Refund[];
  orderDiscounts?: OrderDiscount[];
  orderStatusHistory?: OrderStatusHistory[];
  fulfillmentTasks?: FulfillmentTask[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  paidAt?: Date;
  createdAt: Date;
}

export interface OrderShipping {
  id: string;
  orderId: string;
  shippingMethod?: string;
  carrier?: string;
  trackingNumber?: string;
  shippingAddress: string;
  weightKg?: number;
  dimensionsCm?: string;
  shippingStatus: 'pending' | 'picked' | 'packed' | 'shipped' | 'in_transit' | 'delivered' | 'failed';
  signatureRequired?: boolean;
  specialInstructions?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  returnNumber: string;
  returnReason: string;
  reasonDetails?: string;
  returnStatus: 'pending' | 'approved' | 'rejected' | 'received' | 'processed';
  refundAmount?: number;
  notes?: string;
  approvedAt?: Date;
  processedAt?: Date;
  createdAt: Date;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  condition?: 'new' | 'like_new' | 'used' | 'damaged';
}

export interface Refund {
  id: string;
  orderId?: string;
  returnId?: string;
  amount: number;
  reason: string;
  refundMethod: 'original_payment' | 'store_credit' | 'manual';
  refundStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  completedAt?: Date;
  createdAt: Date;
}

export interface FulfillmentTask {
  id: string;
  orderId: string;
  taskType: 'pick' | 'pack' | 'ship' | 'verify';
  taskStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: string;
  reason?: string;
  notes?: string;
  changedBy?: string;
  createdAt: Date;
}
```

## Service Functions

### Core Order Functions

#### `getOrderWithDetails(orderId: string): Promise<OrderWithDetails | null>`
Fetches complete order with all related data (items, payments, shipping, etc).

```typescript
const order = await getOrderWithDetails('order-123');
console.log(order?.orderItems); // Order items
console.log(order?.orderPayments); // Payments
console.log(order?.orderShipping); // Shipping info
```

#### `updateOrderStatus(orderId, newStatus, reason?, notes?, changedBy?): Promise<boolean>`
Updates order status and creates audit history record.

```typescript
await updateOrderStatus(
  'order-123',
  'shipped',
  'Ready for shipment',
  'Packed and labeled',
  'warehouse-staff'
);
```

### Payment Functions

#### `recordOrderPayment(orderId, payment): Promise<OrderPayment | null>`
Records payment for an order and updates status if fully paid.

```typescript
const payment = await recordOrderPayment('order-123', {
  paymentMethod: 'credit_card',
  amount: 299.99,
  currency: 'USD',
  transactionId: 'txn_123456',
  gatewayResponse: { approved: true }
});
```

### Shipping Functions

#### `createShipping(orderId, shipping): Promise<OrderShipping | null>`
Creates shipping record for an order.

```typescript
const shipping = await createShipping('order-123', {
  shippingMethod: 'express',
  carrier: 'FedEx',
  shippingAddress: '123 Main St, City, ST 12345',
  weightKg: 2.5,
  specialInstructions: 'Fragile items - handle with care'
});
```

#### `updateShippingStatus(shippingId, status, trackingNumber?): Promise<boolean>`
Updates shipping status and tracking information.

```typescript
await updateShippingStatus('ship-123', 'shipped', 'FDX123456789');
```

### Return/Refund Functions

#### `createReturn(orderId, returnData): Promise<OrderReturn | null>`
Creates return request with return items.

```typescript
const ret = await createReturn('order-123', {
  returnReason: 'defective',
  reasonDetails: 'Screen has dead pixels',
  items: [
    {
      productId: 'prod-123',
      productName: 'Monitor',
      quantity: 1,
      condition: 'damaged'
    }
  ]
});
```

#### `approveReturn(returnId, refundAmount?): Promise<boolean>`
Approves return and initiates refund process.

```typescript
await approveReturn('return-123', 299.99);
```

#### `processRefund(refundId, transactionId?, gatewayResponse?): Promise<Refund | null>`
Completes refund processing.

```typescript
const refund = await processRefund('refund-123', 'txn_refund_123');
```

### Fulfillment Functions

#### `createFulfillmentTask(orderId, task): Promise<FulfillmentTask | null>`
Creates fulfillment task (pick, pack, ship, verify).

```typescript
const task = await createFulfillmentTask('order-123', {
  taskType: 'pick',
  priority: 'high',
  assignedTo: 'warehouse-1'
});
```

#### `updateFulfillmentTask(taskId, status, notes?): Promise<boolean>`
Updates fulfillment task status.

```typescript
await updateFulfillmentTask('task-123', 'completed', 'Items picked and verified');
```

### Query Functions

#### `getPendingOrders(limit?, offset?): Promise<{orders, count}>`
Retrieves all pending orders (not delivered or cancelled).

```typescript
const { orders, count } = await getPendingOrders(50, 0);
```

#### `getOrderMetrics(customerId): Promise<metrics | null>`
Calculates order metrics for a customer.

```typescript
const metrics = await getOrderMetrics('cust-123');
console.log(metrics?.totalOrders); // Total orders
console.log(metrics?.totalSpent); // Total spent
console.log(metrics?.averageOrderValue);
```

#### `getOrdersByStatus(status, limit?): Promise<Order[]>`
Retrieves orders filtered by status.

```typescript
const shippedOrders = await getOrdersByStatus('shipped', 100);
```

## API Endpoints

### Orders List
**GET** `/api/orders`

**Query Parameters:**
- `customerId` (optional) - Filter by customer
- `status` (optional) - Filter by status
- `limit` (default: 50) - Results per page
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "data": [
    {
      "id": "order-123",
      "customerId": "cust-123",
      "status": "shipped",
      "total": 299.99,
      "createdAt": "2024-01-15T10:30:00Z",
      "order_items": [...],
      "order_shipping": [...]
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### Get Order Details
**GET** `/api/orders/[orderId]`

**Response:**
```json
{
  "id": "order-123",
  "customerId": "cust-123",
  "status": "shipped",
  "total": 299.99,
  "order_items": [...],
  "order_payments": [...],
  "order_shipping": [...],
  "order_returns": [...],
  "refunds": [...],
  "fulfillment_tasks": [...]
}
```

### Update Order Status
**PATCH** `/api/orders/[orderId]/status`

**Request Body:**
```json
{
  "status": "shipped",
  "reason": "Ready for shipment",
  "notes": "All items packed",
  "changedBy": "warehouse-staff"
}
```

### Record Payment
**POST** `/api/orders/[orderId]/payments`

**Request Body:**
```json
{
  "paymentMethod": "credit_card",
  "amount": 299.99,
  "currency": "USD",
  "transactionId": "txn_123456",
  "gatewayResponse": {}
}
```

### Get Payments
**GET** `/api/orders/[orderId]/payments`

### Create Shipping
**POST** `/api/orders/[orderId]/shipping`

**Request Body:**
```json
{
  "shippingMethod": "express",
  "carrier": "FedEx",
  "shippingAddress": "123 Main St",
  "weightKg": 2.5,
  "signatureRequired": false
}
```

### Update Shipping Status
**PATCH** `/api/orders/[orderId]/shipping`

**Request Body:**
```json
{
  "shippingId": "ship-123",
  "status": "shipped",
  "trackingNumber": "FDX123456789"
}
```

### Get Returns
**GET** `/api/orders/[orderId]/returns`

### Create Return
**POST** `/api/orders/[orderId]/returns`

**Request Body:**
```json
{
  "returnReason": "defective",
  "reasonDetails": "Screen damage",
  "items": [
    {
      "productId": "prod-123",
      "productName": "Monitor",
      "quantity": 1,
      "condition": "damaged"
    }
  ]
}
```

### Approve Return
**PUT** `/api/orders/[orderId]/returns`

**Request Body:**
```json
{
  "returnId": "return-123",
  "action": "approve",
  "refundAmount": 299.99
}
```

### Get Refunds
**GET** `/api/orders/[orderId]/refunds`

### Process Refund
**POST** `/api/orders/[orderId]/refunds`

**Request Body:**
```json
{
  "refundId": "refund-123",
  "transactionId": "txn_refund_123"
}
```

### Get Fulfillment Tasks
**GET** `/api/orders/[orderId]/fulfillment`

### Create Fulfillment Task
**POST** `/api/orders/[orderId]/fulfillment`

**Request Body:**
```json
{
  "taskType": "pick",
  "priority": "high",
  "assignedTo": "warehouse-1",
  "notes": "Priority order"
}
```

### Update Fulfillment Task
**PATCH** `/api/orders/[orderId]/fulfillment`

**Request Body:**
```json
{
  "taskId": "task-123",
  "status": "completed",
  "notes": "Items picked and verified"
}
```

## Order Lifecycle

### Typical Flow

1. **Order Created** - Status: `pending`
   - Order items added
   - Customer information recorded

2. **Payment Received** - Status: `paid`
   - Payment recorded via `recordOrderPayment()`
   - Status updated automatically if full payment

3. **Fulfillment Tasks** - Status: `processing` (implicit)
   - Pick task created
   - Pack task created
   - Ship task created

4. **Order Shipped** - Status: `shipped`
   - Shipping record created
   - Tracking number added
   - Shipping status: `shipped`

5. **In Transit** - Status: `shipped`
   - Shipping status: `in_transit`
   - Tracking updates from carrier

6. **Delivered** - Status: `delivered`
   - Shipping status: `delivered`
   - Order fulfilled

### Return Flow (Optional)

1. **Return Requested** - Status: `return_requested`
   - Return record created
   - Return items specified

2. **Return Approved**
   - Return status: `approved`
   - Refund initiated

3. **Refund Processing**
   - Refund status: `processing`
   - Payment gateway processes

4. **Refund Completed**
   - Refund status: `completed`
   - Return status: `processed`

## Best Practices

### Data Integrity
- Always use service functions instead of raw Supabase queries
- Service functions handle status history audit trails automatically
- Refunds are only created after return approval

### Performance
- Use pagination for list endpoints (limit 50 default)
- Indexes on `user_id`, `status`, and `created_at` optimize queries
- Join operations are handled efficiently via Supabase

### Security
- All queries filtered by `user_id` for multi-tenancy
- RLS policies enforce row-level security
- Sensitive data (gateway responses) stored in JSONB

### Error Handling
- All service functions return null on error
- API endpoints return appropriate HTTP status codes
- Errors are logged to console for debugging

## Testing Order Operations

### Create Complete Order Flow

```typescript
// 1. Create order with items (via API)
const orderRes = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 'cust-123',
    items: [{ productId: 'prod-1', quantity: 2, price: 50 }],
    shippingAddress: '123 Main St'
  })
});
const order = await orderRes.json();

// 2. Record payment
await fetch(`/api/orders/${order.id}/payments`, {
  method: 'POST',
  body: JSON.stringify({
    paymentMethod: 'card',
    amount: 100
  })
});

// 3. Create shipping
await fetch(`/api/orders/${order.id}/shipping`, {
  method: 'POST',
  body: JSON.stringify({
    shippingMethod: 'standard',
    carrier: 'FedEx',
    shippingAddress: '123 Main St'
  })
});

// 4. Update status to shipped
await fetch(`/api/orders/${order.id}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status: 'shipped' })
});
```

## Integration Points

- **Inventory System**: Decrements stock when order items are added
- **Billing System**: Integrates with Stripe for payment processing
- **Customer Management**: Links to customer profiles for analytics
- **Email Notifications**: Sends updates on status changes
- **Analytics Dashboard**: Provides order metrics and reports

## Migration Notes

If migrating from legacy system:
1. Run migration script to populate `orders` table
2. Create status history for each order with current status
3. Migrate payment records to `order_payments`
4. Migrate shipping info to `order_shipping`
5. Verify data integrity with order metrics

## Support & Troubleshooting

### Common Issues

**Orders not appearing in list**
- Verify `user_id` is correctly set
- Check RLS policies are enabled
- Ensure customer_id exists

**Payment not updating status**
- Verify full amount matches order total
- Check payment gateway response is valid
- Review service logs for errors

**Shipping tracking not updating**
- Ensure tracking number format is correct
- Verify carrier is supported
- Check shipping status is valid

For more issues, check server logs and Supabase dashboard.
