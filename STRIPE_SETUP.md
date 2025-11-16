# Stripe Integration Setup Guide

This guide will help you set up Stripe billing for the Omni Sales application.

## Overview

The Stripe integration adds the following features:

- **Subscription Management**: Create and manage recurring billing
- **Payment Processing**: Secure payment handling via Stripe
- **Webhook Handling**: Real-time subscription event processing
- **Usage Tracking**: Track product usage against plan limits
- **Invoice Management**: Automatic invoice generation and tracking

## Prerequisites

1. A Stripe account (https://stripe.com)
2. Your Stripe API keys
3. The application running locally or on a server

## Step 1: Set Up Stripe Account

1. Go to https://stripe.com and create an account
2. Verify your email
3. Complete the account setup process

## Step 2: Get Your API Keys

1. Log in to your Stripe Dashboard
2. Navigate to Developers → API Keys
3. Copy:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)
4. Set up a Webhook Endpoint:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Select events to listen to:
     - `checkout.session.completed`
     - `invoice.paid`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the **Webhook Signing Secret** (starts with `whsec_`)

## Step 3: Update Environment Variables

Edit `.env.local` and add:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Create Subscription Plans

You need to create subscription plans in Stripe first, then add them to the database.

### In Stripe Dashboard:

1. Go to Product Catalog → Products
2. Create a new product for each plan (e.g., "Starter", "Pro", "Enterprise")
3. For each product, add a price:
   - Set the amount (in cents)
   - Select billing interval (Monthly, Yearly, etc.)
4. Copy the Product ID and Price ID

### In Your Database:

Run the following SQL to add plans:

```sql
INSERT INTO subscription_plans (
  name,
  stripe_product_id,
  stripe_price_id,
  amount_cents,
  currency,
  billing_interval,
  product_limit,
  features,
  description,
  is_active
) VALUES
(
  'Starter',
  'prod_xxxx',
  'price_xxxx',
  2999,
  'USD',
  'month',
  10,
  ARRAY['Up to 10 products', 'Basic analytics', 'Email support'],
  'Perfect for getting started',
  true
),
(
  'Pro',
  'prod_yyyy',
  'price_yyyy',
  9999,
  'USD',
  'month',
  100,
  ARRAY['Up to 100 products', 'Advanced analytics', 'Priority support', 'Custom branding'],
  'For growing businesses',
  true
);
```

## Step 5: Test the Integration

### Local Testing with Stripe CLI:

1. Download Stripe CLI: https://stripe.com/docs/stripe-cli
2. Install and authenticate:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. The CLI will output your webhook signing secret - use this in `.env.local`

### Test Payment:

1. Start your app: `npm run dev`
2. Go to `/billing/plans`
3. Select a plan and complete checkout
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

## API Endpoints

### Checkout

- **POST** `/api/billing/checkout`
- Creates a Stripe checkout session
- Body: `{ planId, userId, email }`

### Subscription Plans

- **GET** `/api/billing/plans`
- Returns all active subscription plans

### User Subscriptions

- **GET** `/api/billing/user-subscriptions?userId={id}`
- Returns all subscriptions for a user

### Manage Subscription

- **GET** `/api/billing/subscriptions/{subscriptionId}`
- Get subscription details

- **PUT** `/api/billing/subscriptions/{subscriptionId}`
- Actions: `cancel`, `reactivate`, `update_payment_method`

## Usage Tracking

The system includes usage tracking to enforce plan limits:

```typescript
import { enforceProductLimit } from '@/lib/billing/usage';

// Check if user can add a new product
const { allowed, message } = await enforceProductLimit(userId, currentProductCount);

if (!allowed) {
  // User has exceeded their product limit
  // Show upgrade prompt
}
```

## Webhook Events

The system automatically handles:

1. **checkout.session.completed** - Save new subscription to database
2. **invoice.paid** - Update subscription status and record payment
3. **customer.subscription.updated** - Update subscription status
4. **customer.subscription.deleted** - Mark subscription as canceled

## Going Live

When you're ready to go live:

1. Switch to Live API Keys in Stripe Dashboard
2. Update `.env.local` with live keys:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   STRIPE_SECRET_KEY=sk_live_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_secret
   ```
3. Update webhook endpoint in Stripe Dashboard to your production URL
4. Test with real payments using your own test cards

## Troubleshooting

### Webhook Not Working

- Check Stripe Dashboard → Developers → Webhooks for delivery logs
- Ensure webhook URL is correct and publicly accessible
- Verify webhook signing secret matches `.env.local`

### Checkout Not Creating Subscription

- Verify plan IDs exist in the database
- Check browser console for errors
- Check Stripe Dashboard → Developers → Logs for API errors

### Payment Declined

- Verify API keys are correct
- Check Stripe Dashboard → Payments for decline reasons
- Ensure webhook endpoint is working properly

## Database Schema

The integration adds these tables:

- `subscription_plans` - Plan definitions
- `subscriptions` - Active/inactive subscriptions
- `subscription_items` - Items in subscriptions
- `invoices` - Generated invoices
- `payments` - Payment records
- `billing_usage` - Usage tracking per subscription

## Security Notes

- All secret keys should be stored in environment variables only
- Webhook signature verification is enforced
- Database Row Level Security (RLS) policies are enabled
- Payment data flows directly through Stripe (PCI compliance)

## Support

For issues or questions:

1. Check Stripe Documentation: https://stripe.com/docs
2. Review error logs in browser console
3. Check Stripe Dashboard → Developers → Logs for API errors
