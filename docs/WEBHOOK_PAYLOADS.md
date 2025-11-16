# Webhook Payload Examples

Complete reference for all webhook event payloads.

## Order Events

### order.created

```json
{
  "id": "evt_550e8400e29b41d4a716446655440000",
  "event": "order.created",
  "created_at": "2025-01-16T10:30:00Z",
  "data": {
    "order_id": "ord_789abc",
    "customer_id": "cus_456def",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "total": 199.98,
    "currency": "USD",
    "status": "pending",
    "items": [
      {
        "product_id": "prod_123",
        "product_name": "Premium Widget",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "shipping_address": "123 Main Street, Apt 4B, New York, NY 10001",
    "payment_method": "credit_card",
    "created_at": "2025-01-16T10:30:00Z",
    "updated_at": "2025-01-16T10:30:00Z"
  }
}
```

### order.updated

```json
{
  "id": "evt_550e8400e29b41d4a716446655440001",
  "event": "order.updated",
  "created_at": "2025-01-16T11:15:00Z",
  "data": {
    "order_id": "ord_789abc",
    "customer_id": "cus_456def",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "total": 199.98,
    "currency": "USD",
    "status": "processing",
    "items": [
      {
        "product_id": "prod_123",
        "product_name": "Premium Widget",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "shipping_address": "123 Main Street, Apt 4B, New York, NY 10001",
    "payment_method": "credit_card",
    "created_at": "2025-01-16T10:30:00Z",
    "updated_at": "2025-01-16T11:15:00Z"
  }
}
```

### order.shipped

```json
{
  "id": "evt_550e8400e29b41d4a716446655440002",
  "event": "order.shipped",
  "created_at": "2025-01-17T09:00:00Z",
  "data": {
    "order_id": "ord_789abc",
    "customer_id": "cus_456def",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "total": 199.98,
    "currency": "USD",
    "status": "shipped",
    "items": [
      {
        "product_id": "prod_123",
        "product_name": "Premium Widget",
        "quantity": 2,
        "price": 99.99
      }
    ],
    "shipping_address": "123 Main Street, Apt 4B, New York, NY 10001",
    "payment_method": "credit_card",
    "tracking_number": "1Z999AA10123456784",
    "carrier": "UPS",
    "created_at": "2025-01-16T10:30:00Z",
    "updated_at": "2025-01-17T09:00:00Z"
  }
}
```

## Payment Events

### payment.received

```json
{
  "id": "evt_payment_001",
  "event": "payment.received",
  "created_at": "2025-01-16T10:31:00Z",
  "data": {
    "payment_id": "pay_789xyz",
    "order_id": "ord_789abc",
    "amount": 199.98,
    "currency": "USD",
    "payment_method": "credit_card",
    "status": "completed",
    "transaction_id": "txn_ch_1A2B3C4D5E6F",
    "paid_at": "2025-01-16T10:31:00Z",
    "created_at": "2025-01-16T10:31:00Z"
  }
}
```

### payment.failed

```json
{
  "id": "evt_payment_002",
  "event": "payment.failed",
  "created_at": "2025-01-16T10:31:00Z",
  "data": {
    "payment_id": "pay_789xyz",
    "order_id": "ord_789abc",
    "amount": 199.98,
    "currency": "USD",
    "payment_method": "credit_card",
    "status": "failed",
    "error_code": "card_declined",
    "error_message": "Your card was declined",
    "created_at": "2025-01-16T10:31:00Z"
  }
}
```

## Customer Events

### customer.created

```json
{
  "id": "evt_customer_001",
  "event": "customer.created",
  "created_at": "2025-01-16T09:00:00Z",
  "data": {
    "customer_id": "cus_456def",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0123",
    "address": "456 Oak Avenue, Los Angeles, CA 90001",
    "tags": ["new", "newsletter"],
    "created_at": "2025-01-16T09:00:00Z",
    "updated_at": "2025-01-16T09:00:00Z"
  }
}
```

### customer.updated

```json
{
  "id": "evt_customer_002",
  "event": "customer.updated",
  "created_at": "2025-01-17T14:30:00Z",
  "data": {
    "customer_id": "cus_456def",
    "name": "Jane Smith-Johnson",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0124",
    "address": "789 Pine Street, Los Angeles, CA 90002",
    "tags": ["vip", "newsletter", "loyal"],
    "created_at": "2025-01-16T09:00:00Z",
    "updated_at": "2025-01-17T14:30:00Z"
  }
}
```

## Product Events

### product.inventory_low

```json
{
  "id": "evt_product_001",
  "event": "product.inventory_low",
  "created_at": "2025-01-16T16:45:00Z",
  "data": {
    "product_id": "prod_123",
    "name": "Premium Widget",
    "sku": "WDG-PRM-001",
    "price": 99.99,
    "stock": 8,
    "category": "Electronics",
    "low_stock_threshold": 10,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-16T16:45:00Z"
  }
}
```

### product.inventory_out

```json
{
  "id": "evt_product_002",
  "event": "product.inventory_out",
  "created_at": "2025-01-16T18:00:00Z",
  "data": {
    "product_id": "prod_456",
    "name": "Deluxe Gadget",
    "sku": "GDG-DLX-002",
    "price": 149.99,
    "stock": 0,
    "category": "Electronics",
    "low_stock_threshold": 5,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-16T18:00:00Z"
  }
}
```

## Refund Events

### refund.processed

```json
{
  "id": "evt_refund_001",
  "event": "refund.processed",
  "created_at": "2025-01-18T10:00:00Z",
  "data": {
    "refund_id": "ref_789",
    "order_id": "ord_789abc",
    "amount": 199.98,
    "currency": "USD",
    "reason": "Customer requested cancellation",
    "status": "completed",
    "processed_at": "2025-01-18T10:00:00Z",
    "created_at": "2025-01-17T15:00:00Z"
  }
}
```

## Email Events

### email.sent

```json
{
  "id": "evt_email_001",
  "event": "email.sent",
  "created_at": "2025-01-16T10:35:00Z",
  "data": {
    "email_id": "eml_123",
    "to": "customer@example.com",
    "from": "noreply@omnisales.com",
    "subject": "Order Confirmation #789abc",
    "status": "sent",
    "sent_at": "2025-01-16T10:35:00Z"
  }
}
```

### email.delivered

```json
{
  "id": "evt_email_002",
  "event": "email.delivered",
  "created_at": "2025-01-16T10:36:00Z",
  "data": {
    "email_id": "eml_123",
    "to": "customer@example.com",
    "from": "noreply@omnisales.com",
    "subject": "Order Confirmation #789abc",
    "status": "delivered",
    "sent_at": "2025-01-16T10:35:00Z",
    "delivered_at": "2025-01-16T10:36:00Z"
  }
}
```

## Support/Chat Events

### chat.escalated

```json
{
  "id": "evt_chat_001",
  "event": "chat.escalated",
  "created_at": "2025-01-16T14:20:00Z",
  "data": {
    "ticket_id": "tkt_456",
    "customer_id": "cus_789",
    "customer_name": "Mike Johnson",
    "customer_email": "mike@example.com",
    "subject": "Issue with order delivery",
    "status": "escalated",
    "priority": "high",
    "assigned_to": "agent_123",
    "escalated_at": "2025-01-16T14:20:00Z",
    "created_at": "2025-01-16T13:00:00Z",
    "updated_at": "2025-01-16T14:20:00Z"
  }
}
```

### ticket.created

```json
{
  "id": "evt_ticket_001",
  "event": "ticket.created",
  "created_at": "2025-01-16T13:00:00Z",
  "data": {
    "ticket_id": "tkt_456",
    "customer_id": "cus_789",
    "customer_name": "Mike Johnson",
    "customer_email": "mike@example.com",
    "subject": "Issue with order delivery",
    "status": "open",
    "priority": "normal",
    "created_at": "2025-01-16T13:00:00Z",
    "updated_at": "2025-01-16T13:00:00Z"
  }
}
```

## Using Webhooks in Your Application

### Order Processing Example

```javascript
// Automatically update inventory when order is shipped
app.post('/webhooks', verifyWebhook, async (req, res) => {
  const { event, data } = req.body;

  if (event === 'order.shipped') {
    // Update your external inventory system
    await updateInventorySystem({
      orderId: data.order_id,
      items: data.items,
      status: 'shipped'
    });

    // Send tracking info to customer
    await sendTrackingEmail({
      email: data.customer_email,
      trackingNumber: data.tracking_number,
      carrier: data.carrier
    });
  }

  res.status(200).json({ received: true });
});
```

### Customer Lifecycle Example

```javascript
// Add new customers to your CRM
app.post('/webhooks', verifyWebhook, async (req, res) => {
  const { event, data } = req.body;

  if (event === 'customer.created') {
    // Add to CRM
    await addToCRM({
      id: data.customer_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      tags: data.tags
    });

    // Send welcome email
    await sendWelcomeEmail(data.email, data.name);

    // Add to newsletter if tagged
    if (data.tags.includes('newsletter')) {
      await addToNewsletterList(data.email);
    }
  }

  res.status(200).json({ received: true });
});
```

### Inventory Alerts Example

```javascript
// Alert when inventory is low
app.post('/webhooks', verifyWebhook, async (req, res) => {
  const { event, data } = req.body;

  if (event === 'product.inventory_low') {
    // Send alert to inventory manager
    await sendSlackMessage({
      channel: '#inventory-alerts',
      message: `⚠️ Low stock alert: ${data.name} (${data.sku}) - Only ${data.stock} left!`
    });

    // Create reorder task
    await createReorderTask({
      productId: data.product_id,
      currentStock: data.stock,
      threshold: data.low_stock_threshold
    });
  }

  if (event === 'product.inventory_out') {
    // Send urgent alert
    await sendSlackMessage({
      channel: '#inventory-alerts',
      message: `🚨 OUT OF STOCK: ${data.name} (${data.sku})`
    });
  }

  res.status(200).json({ received: true });
});
```

## Event Sequencing

Typical order flow webhooks:

1. `customer.created` (if new customer)
2. `order.created`
3. `payment.received` or `payment.failed`
4. `email.sent` (order confirmation)
5. `order.updated` (status changed to processing)
6. `order.shipped`
7. `email.sent` (shipping notification)
8. `order.completed`

If refund occurs:
1. `refund.created`
2. `refund.processed` or `refund.failed`
3. `order.refunded`

## Error Responses

Your webhook endpoint can return specific error codes:

- `200-299`: Success (no retry)
- `400-499`: Client error (no retry except 429)
- `429`: Rate limited (will retry)
- `500-599`: Server error (will retry)

Example error handling:

```javascript
app.post('/webhooks', verifyWebhook, async (req, res) => {
  try {
    await processWebhook(req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    if (error.type === 'TEMPORARY') {
      // Return 500 to trigger retry
      res.status(500).json({ error: error.message });
    } else {
      // Return 400 for permanent errors (no retry)
      res.status(400).json({ error: error.message });
    }
  }
});
```
