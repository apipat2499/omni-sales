# Webhooks System - Complete Guide

## Overview

The OmniSales webhook system allows you to receive real-time HTTP notifications when events occur in your store. This guide covers everything you need to know about setting up, testing, and implementing webhooks.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Webhook Events](#webhook-events)
3. [Security & Authentication](#security--authentication)
4. [Webhook Payload Format](#webhook-payload-format)
5. [Implementation Examples](#implementation-examples)
6. [Testing Webhooks](#testing-webhooks)
7. [Error Handling & Retries](#error-handling--retries)
8. [Best Practices](#best-practices)

## Getting Started

### Creating a Webhook

#### Via Admin UI

1. Navigate to `/webhooks` in your admin dashboard
2. Click "Create Webhook"
3. Fill in the required information:
   - **Name**: A descriptive name for your webhook
   - **URL**: Your endpoint that will receive the webhook POSTs
   - **Events**: Select the events you want to subscribe to
4. Click "Create Webhook"
5. Save the webhook secret provided - you'll need it for signature verification

#### Via API

```bash
curl -X POST https://your-domain.com/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Notifications",
    "url": "https://your-app.com/webhooks/orders",
    "events": ["order.created", "order.updated", "order.shipped"],
    "description": "Receive order events in real-time"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Order Notifications",
    "url": "https://your-app.com/webhooks/orders",
    "secret": "whsec_abc123...",
    "events": ["order.created", "order.updated", "order.shipped"],
    "is_active": true,
    "created_at": "2025-01-16T10:30:00Z"
  }
}
```

## Webhook Events

### Available Events

#### Order Events
- `order.created` - New order placed
- `order.updated` - Order details modified
- `order.shipped` - Order marked as shipped
- `order.completed` - Order completed
- `order.cancelled` - Order cancelled
- `order.refunded` - Order refunded

#### Payment Events
- `payment.received` - Payment successfully received
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded
- `payment.pending` - Payment pending

#### Customer Events
- `customer.created` - New customer registered
- `customer.updated` - Customer details updated
- `customer.deleted` - Customer deleted

#### Product Events
- `product.created` - New product added
- `product.updated` - Product details updated
- `product.deleted` - Product removed
- `product.inventory_low` - Inventory below threshold
- `product.inventory_out` - Out of stock
- `product.inventory_restocked` - Product restocked

#### Refund Events
- `refund.created` - Refund requested
- `refund.processed` - Refund completed
- `refund.failed` - Refund failed

#### Email Events
- `email.sent` - Email sent
- `email.delivered` - Email delivered
- `email.failed` - Email delivery failed
- `email.bounced` - Email bounced
- `email.opened` - Email opened by recipient
- `email.clicked` - Link in email clicked

#### Support/Chat Events
- `chat.escalated` - Chat escalated to agent
- `chat.assigned` - Chat assigned to agent
- `chat.resolved` - Chat resolved
- `ticket.created` - Support ticket created
- `ticket.updated` - Ticket updated
- `ticket.closed` - Ticket closed

## Security & Authentication

### HMAC Signature Verification

Every webhook request includes a signature in the `X-Webhook-Signature` header. You must verify this signature to ensure the request came from OmniSales.

#### Headers Sent

```
Content-Type: application/json
X-Webhook-Signature: sha256_hash
X-Webhook-Timestamp: 1705401000
X-Webhook-ID: webhook_id
User-Agent: OmniSales-Webhook/1.0
```

#### Verifying the Signature

**Node.js Example:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret, timestamp) {
  // Check timestamp is recent (within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    return false;
  }

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js middleware
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, YOUR_WEBHOOK_SECRET, timestamp)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  console.log('Webhook verified:', req.body);
  res.status(200).json({ received: true });
});
```

**Python Example:**

```python
import hmac
import hashlib
import time

def verify_webhook_signature(payload: str, signature: str, secret: str, timestamp: int) -> bool:
    # Check timestamp
    current_time = int(time.time())
    if abs(current_time - timestamp) > 300:  # 5 minutes
        return False

    # Compute expected signature
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Timing-safe comparison
    return hmac.compare_digest(signature, expected_signature)

# Flask example
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhooks', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Webhook-Signature')
    timestamp = int(request.headers.get('X-Webhook-Timestamp'))
    payload = request.data.decode('utf-8')

    if not verify_webhook_signature(payload, signature, YOUR_SECRET, timestamp):
        return jsonify({'error': 'Invalid signature'}), 401

    # Process webhook
    data = request.json
    print(f'Webhook received: {data}')

    return jsonify({'received': True}), 200
```

### IP Whitelist

For additional security, you can configure IP whitelisting when creating a webhook:

```json
{
  "name": "My Webhook",
  "url": "https://your-app.com/webhook",
  "events": ["order.created"],
  "ip_whitelist": ["192.168.1.100", "203.0.113.0/24"]
}
```

## Webhook Payload Format

All webhooks follow a standard JSON format:

```json
{
  "id": "evt_550e8400e29b41d4a716446655440000",
  "event": "order.created",
  "created_at": "2025-01-16T10:30:00Z",
  "data": {
    // Event-specific payload
  }
}
```

### Event Payload Examples

#### Order Created

```json
{
  "id": "evt_123",
  "event": "order.created",
  "created_at": "2025-01-16T10:30:00Z",
  "data": {
    "order_id": "ord_789",
    "customer_id": "cus_456",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "total": 99.99,
    "currency": "USD",
    "status": "pending",
    "items": [
      {
        "product_id": "prod_123",
        "product_name": "Widget",
        "quantity": 2,
        "price": 49.99
      }
    ],
    "shipping_address": "123 Main St, City, State 12345",
    "payment_method": "credit_card",
    "created_at": "2025-01-16T10:30:00Z",
    "updated_at": "2025-01-16T10:30:00Z"
  }
}
```

#### Payment Received

```json
{
  "id": "evt_124",
  "event": "payment.received",
  "created_at": "2025-01-16T10:31:00Z",
  "data": {
    "payment_id": "pay_789",
    "order_id": "ord_789",
    "amount": 99.99,
    "currency": "USD",
    "payment_method": "credit_card",
    "status": "completed",
    "transaction_id": "txn_abc123",
    "paid_at": "2025-01-16T10:31:00Z",
    "created_at": "2025-01-16T10:31:00Z"
  }
}
```

#### Customer Created

```json
{
  "id": "evt_125",
  "event": "customer.created",
  "created_at": "2025-01-16T10:32:00Z",
  "data": {
    "customer_id": "cus_456",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "tags": ["vip", "newsletter"],
    "created_at": "2025-01-16T10:32:00Z",
    "updated_at": "2025-01-16T10:32:00Z"
  }
}
```

#### Product Inventory Low

```json
{
  "id": "evt_126",
  "event": "product.inventory_low",
  "created_at": "2025-01-16T10:33:00Z",
  "data": {
    "product_id": "prod_123",
    "name": "Widget",
    "sku": "WDG-001",
    "price": 49.99,
    "stock": 5,
    "category": "Electronics",
    "low_stock_threshold": 10,
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-01-16T10:33:00Z"
  }
}
```

## Implementation Examples

### Node.js (Express)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Middleware to verify webhook signature
function verifyWebhook(req, res, next) {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = parseInt(req.headers['x-webhook-timestamp']);
  const payload = JSON.stringify(req.body);

  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    return res.status(401).json({ error: 'Request too old' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}

// Webhook endpoint
app.post('/webhooks/omni', verifyWebhook, async (req, res) => {
  const { event, data } = req.body;

  console.log(`Received webhook: ${event}`);

  try {
    switch (event) {
      case 'order.created':
        await handleOrderCreated(data);
        break;
      case 'payment.received':
        await handlePaymentReceived(data);
        break;
      case 'customer.created':
        await handleCustomerCreated(data);
        break;
      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

async function handleOrderCreated(data) {
  // Your business logic
  console.log(`New order: ${data.order_id} for ${data.customer_email}`);
  // Send confirmation email, update inventory, etc.
}

async function handlePaymentReceived(data) {
  console.log(`Payment received: ${data.payment_id} for order ${data.order_id}`);
  // Update order status, send receipt, etc.
}

async function handleCustomerCreated(data) {
  console.log(`New customer: ${data.customer_id} - ${data.email}`);
  // Add to CRM, send welcome email, etc.
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Python (FastAPI)

```python
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
import hmac
import hashlib
import time
from typing import Optional, Any, Dict

app = FastAPI()

WEBHOOK_SECRET = "your_webhook_secret"

class WebhookPayload(BaseModel):
    id: str
    event: str
    created_at: str
    data: Dict[str, Any]

def verify_signature(payload: str, signature: str, timestamp: int) -> bool:
    current_time = int(time.time())
    if abs(current_time - timestamp) > 300:
        return False

    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

@app.post("/webhooks/omni")
async def handle_webhook(request: Request):
    # Get headers
    signature = request.headers.get("x-webhook-signature")
    timestamp = int(request.headers.get("x-webhook-timestamp", 0))

    # Get raw body for signature verification
    body = await request.body()
    payload_str = body.decode()

    # Verify signature
    if not verify_signature(payload_str, signature, timestamp):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse payload
    payload = await request.json()
    event = payload["event"]
    data = payload["data"]

    # Handle events
    if event == "order.created":
        await handle_order_created(data)
    elif event == "payment.received":
        await handle_payment_received(data)
    elif event == "customer.created":
        await handle_customer_created(data)

    return {"received": True}

async def handle_order_created(data: dict):
    print(f"New order: {data['order_id']} for {data['customer_email']}")
    # Your business logic

async def handle_payment_received(data: dict):
    print(f"Payment received: {data['payment_id']}")
    # Your business logic

async def handle_customer_created(data: dict):
    print(f"New customer: {data['customer_id']}")
    # Your business logic
```

## Testing Webhooks

### Using the Admin UI

1. Go to `/webhooks` in your dashboard
2. Click on a webhook
3. Click "Send Test" button
4. Check your endpoint to verify it received the test payload

### Using the API

```bash
curl -X POST https://your-domain.com/api/webhooks/{webhook_id}/test
```

### Local Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your local server
node server.js

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL as your webhook URL
# Example: https://abc123.ngrok.io/webhooks/omni
```

## Error Handling & Retries

### Retry Logic

- Failed webhooks are automatically retried with **exponential backoff**
- Default retry configuration:
  - Initial delay: 1 second
  - Maximum delay: 60 seconds
  - Maximum attempts: 3
  - Backoff multiplier: 2x

### Retry Schedule

- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds
- Attempt 4: After 4 seconds (if max_retries > 3)

### Dead Letter Queue

After all retry attempts are exhausted, failed deliveries are moved to a dead letter queue. You can:

1. View failed deliveries in the admin UI
2. Manually replay failed events
3. Query the API for failure details

```bash
# Get failed deliveries
GET /api/webhooks/{webhook_id}/replay

# Replay a failed event
POST /api/webhooks/{webhook_id}/replay
{
  "failure_id": "fail_abc123"
}
```

### Expected Response

Your webhook endpoint should:
- Respond with HTTP 2xx status code (200-299) for success
- Respond within 30 seconds (configurable)
- Return quickly (process asynchronously if needed)

```javascript
// Good - Quick response
app.post('/webhook', async (req, res) => {
  // Acknowledge receipt immediately
  res.status(200).json({ received: true });

  // Process asynchronously
  processWebhookAsync(req.body);
});

// Bad - Slow response
app.post('/webhook', async (req, res) => {
  await slowDatabaseOperation(); // This might timeout!
  res.status(200).json({ received: true });
});
```

## Best Practices

### 1. Verify Signatures

Always verify the HMAC signature to ensure webhooks are authentic.

### 2. Respond Quickly

Return a 200 response as fast as possible. Process webhooks asynchronously.

### 3. Handle Duplicates

Webhooks may be delivered more than once. Use the event `id` to deduplicate.

```javascript
const processedEvents = new Set();

app.post('/webhook', (req, res) => {
  const eventId = req.body.id;

  if (processedEvents.has(eventId)) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  processedEvents.add(eventId);
  // Process event...
  res.status(200).json({ received: true });
});
```

### 4. Monitor Webhook Health

- Check delivery logs regularly
- Set up alerts for high failure rates
- Monitor average response times

### 5. Use Event Filtering

Only subscribe to events you need to reduce unnecessary traffic.

### 6. Implement Logging

Log all webhook receipts for debugging and audit purposes.

```javascript
app.post('/webhook', (req, res) => {
  logger.info('Webhook received', {
    event: req.body.event,
    id: req.body.id,
    timestamp: new Date().toISOString()
  });

  // Process webhook...
});
```

### 7. Handle Errors Gracefully

```javascript
app.post('/webhook', async (req, res) => {
  try {
    await processWebhook(req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error', { error, body: req.body });
    // Still return 200 if you don't want retry
    // Return 500 if you want retry
    res.status(200).json({ received: true, error: error.message });
  }
});
```

## API Reference

### List Webhooks
```
GET /api/webhooks
```

### Create Webhook
```
POST /api/webhooks
```

### Get Webhook
```
GET /api/webhooks/:id
```

### Update Webhook
```
PUT /api/webhooks/:id
```

### Delete Webhook
```
DELETE /api/webhooks/:id
```

### Get Webhook Logs
```
GET /api/webhooks/:id/logs
```

### Get Webhook Stats
```
GET /api/webhooks/:id/stats
```

### Send Test Event
```
POST /api/webhooks/:id/test
```

### Get Failed Deliveries
```
GET /api/webhooks/:id/replay
```

### Replay Failed Event
```
POST /api/webhooks/:id/replay
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook is active: `GET /api/webhooks/:id`
2. Verify URL is accessible from the internet
3. Check firewall settings
4. Review delivery logs for errors

### Signature Verification Failing

1. Ensure you're using the correct secret
2. Verify timestamp is being checked
3. Check you're hashing the raw request body
4. Use timing-safe comparison

### Timeouts

1. Ensure your endpoint responds within 30 seconds
2. Process webhooks asynchronously
3. Return 200 response immediately

### High Failure Rate

1. Check endpoint availability
2. Review error logs
3. Verify response codes
4. Check for rate limiting

## Support

For additional help:
- Email: support@omnisales.com
- Documentation: https://docs.omnisales.com/webhooks
- Community Forum: https://community.omnisales.com
