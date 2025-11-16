# Stripe Integration Documentation

Complete Stripe payment and subscription integration for the Omni-Sales platform.

## Features

- **Payment Processing**: Create payment intents for orders and subscriptions
- **Subscription Management**: Full lifecycle management for recurring billing
- **Customer Management**: Automatic customer creation and synchronization with Supabase users
- **Webhook Handling**: Secure webhook processing with idempotency and logging
- **Security**:
  - Webhook signature verification
  - Sensitive data encryption (AES-256-GCM)
  - Error message sanitization
  - PCI compliance considerations
- **Database Integration**: Full Supabase integration with RLS policies

## Table of Contents

1. [Setup](#setup)
2. [Environment Variables](#environment-variables)
3. [Database Schema](#database-schema)
4. [Usage Examples](#usage-examples)
5. [API Endpoints](#api-endpoints)
6. [Webhook Events](#webhook-events)
7. [Security](#security)
8. [Testing](#testing)

## Setup

### 1. Install Dependencies

Dependencies are already included in package.json:
- `stripe` - Server-side Stripe SDK
- `@stripe/stripe-js` - Client-side Stripe SDK

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Stripe credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `STRIPE_SECRET_KEY` - Get from Stripe Dashboard > Developers > API keys
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Get from Stripe Dashboard > Developers > API keys
- `STRIPE_WEBHOOK_SECRET` - Get from Stripe Dashboard > Developers > Webhooks
- `ENCRYPTION_KEY` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Run Database Migration

Apply the Stripe integration migration to your Supabase database:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute:
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/stripe_integration.sql
```

### 4. Configure Stripe Webhook

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Server-side Stripe API key (sk_test_... or sk_live_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Client-side Stripe API key (pk_test_... or pk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret (whsec_...) |
| `ENCRYPTION_KEY` | Yes | 64-character hex key for AES-256 encryption |
| `NEXT_PUBLIC_APP_URL` | Yes | Application URL for webhooks |

## Database Schema

The integration creates the following tables:

- **stripe_customers**: Maps Supabase users to Stripe customers
- **stripe_payments**: Stores payment intent records
- **stripe_refunds**: Stores refund records
- **stripe_subscriptions**: Stores subscription records
- **stripe_webhook_logs**: Logs webhook events for idempotency

All tables have Row Level Security (RLS) enabled.

## Usage Examples

### 1. Create a Payment Intent for an Order

```typescript
// Client-side
const response = await fetch('/api/payments/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 99.99, // Amount in dollars
    currency: 'usd',
    metadata: {
      type: 'order',
      orderId: 'order_123',
      userId: 'user_456',
      description: 'Order #123'
    }
  })
});

const { clientSecret, paymentIntentId } = await response.json();

// Use clientSecret with Stripe Elements
const stripe = await getStripe();
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'John Doe' }
  }
});
```

### 2. Create a Subscription

```typescript
// Server-side or API route
import { createSubscription } from '@/lib/stripe/subscription-manager';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customer-manager';

// Get or create customer
const { customerId } = await getOrCreateStripeCustomer(userId, {
  email: 'customer@example.com',
  name: 'John Doe',
  metadata: { userId }
});

// Create subscription
const subscription = await createSubscription({
  customerId,
  priceId: 'price_123', // Your Stripe price ID
  quantity: 1,
  trialPeriodDays: 14, // Optional
  metadata: { userId, plan: 'premium' }
});
```

### 3. Manage Subscriptions

```typescript
// Client-side - Get user's subscriptions
const response = await fetch(`/api/subscriptions/manage?userId=${userId}`);
const { subscriptions } = await response.json();

// Cancel subscription at period end
await fetch('/api/subscriptions/manage', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionId: 'sub_123',
    action: 'cancel'
  })
});

// Cancel subscription immediately
await fetch('/api/subscriptions/manage', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionId: 'sub_123',
    action: 'cancel_now'
  })
});

// Reactivate subscription
await fetch('/api/subscriptions/manage', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriptionId: 'sub_123',
    action: 'reactivate'
  })
});
```

### 4. Customer Management

```typescript
import {
  getOrCreateStripeCustomer,
  updateStripeCustomer,
  getCustomerPaymentMethods
} from '@/lib/stripe/customer-manager';

// Get or create customer
const { customerId, isNew } = await getOrCreateStripeCustomer(userId, {
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  address: {
    line1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94105',
    country: 'US'
  }
});

// Update customer
await updateStripeCustomer(customerId, {
  name: 'John Smith',
  phone: '+9876543210'
});

// Get payment methods
const paymentMethods = await getCustomerPaymentMethods(customerId);
```

## API Endpoints

### POST /api/payments/create-payment-intent

Creates a payment intent for orders or subscriptions.

**Request:**
```json
{
  "amount": 99.99,
  "currency": "usd",
  "customerId": "cus_123",
  "metadata": {
    "type": "order",
    "orderId": "order_123",
    "userId": "user_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_123_secret_456",
  "paymentIntentId": "pi_123",
  "amount": 9999,
  "currency": "usd"
}
```

### POST /api/subscriptions/create

Creates a new subscription.

**Request:**
```json
{
  "userId": "user_123",
  "priceId": "price_123",
  "email": "customer@example.com",
  "name": "John Doe",
  "trialPeriodDays": 14
}
```

### GET /api/subscriptions/manage?userId=xxx

Gets user's active subscriptions.

### PUT /api/subscriptions/manage

Manages subscription (update, cancel, reactivate).

**Request:**
```json
{
  "subscriptionId": "sub_123",
  "action": "cancel"
}
```

### POST /api/webhooks/stripe

Handles Stripe webhook events. Automatically processes:
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted

## Webhook Events

All webhook events are:
1. **Verified** - Signature verification prevents spoofing
2. **Logged** - Stored in `stripe_webhook_logs` table
3. **Idempotent** - Duplicate events are detected and skipped
4. **Retried** - Failed events return 500 to trigger Stripe retry

## Security

### 1. Webhook Signature Verification

All webhook requests are verified using Stripe's signature:

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

### 2. Sensitive Data Encryption

Payment-related data is encrypted using AES-256-GCM:

```typescript
import { encrypt, decrypt } from '@/lib/stripe/encryption';

const encrypted = encrypt('sensitive data');
const decrypted = decrypt(encrypted);
```

### 3. Error Message Sanitization

Error messages are sanitized to prevent leaking sensitive information:

```typescript
import { sanitizeErrorMessage } from '@/lib/stripe/encryption';

const sanitized = sanitizeErrorMessage(error);
// Removes API keys, card numbers, CVV, etc.
```

### 4. Row Level Security (RLS)

All database tables have RLS policies:
- Users can only view their own data
- Service role has full access
- Webhook logs are service-role only

### 5. PCI Compliance

- Never store full card numbers
- Never store CVV codes
- Use Stripe Elements for card input
- All sensitive data is encrypted at rest

## Testing

### Test Mode

Use Stripe test keys for development:
- Secret: `sk_test_...`
- Publishable: `pk_test_...`

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### Test Webhooks Locally

Use Stripe CLI to forward webhooks to localhost:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal
stripe trigger payment_intent.succeeded
```

## Troubleshooting

### Webhook signature verification fails

- Ensure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint
- Check that you're using the raw request body (not parsed)
- Verify the webhook URL in Stripe Dashboard

### Encryption errors

- Ensure `ENCRYPTION_KEY` is exactly 64 hex characters
- Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Database connection errors

- Verify Supabase credentials are correct
- Run the migration: `supabase db push`
- Check RLS policies are enabled

## Support

For issues or questions:
1. Check Stripe Dashboard > Logs for API errors
2. Check `stripe_webhook_logs` table for webhook issues
3. Review server logs for detailed error messages
4. Consult [Stripe API Documentation](https://stripe.com/docs/api)
