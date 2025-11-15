# Supabase Database Setup

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project

## Setup Instructions

### 1. Get Your Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon/Public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service Role key (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`

### 3. Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Click "Run" to execute the migration

### 4. Seed Database (Optional)

1. In SQL Editor
2. Copy and paste the contents of `seed.sql`
3. Click "Run" to populate with sample data

## Database Schema

### Tables

- **products** - Product catalog
  - id (UUID, PK)
  - name, category, price, cost, stock, sku
  - description, image
  - created_at, updated_at

- **customers** - Customer information
  - id (UUID, PK)
  - name, email, phone, address
  - tags (array of strings)
  - created_at, updated_at

- **orders** - Order records
  - id (UUID, PK)
  - customer_id (FK)
  - subtotal, tax, shipping, total
  - status, channel, payment_method
  - shipping_address, notes
  - created_at, updated_at, delivered_at

- **order_items** - Order line items
  - id (UUID, PK)
  - order_id (FK)
  - product_id (FK)
  - product_name, quantity, price
  - created_at

### Views

- **customer_stats** - Aggregated customer statistics including:
  - total_orders
  - total_spent
  - last_order_date

## Features

- ✅ Automatic timestamps (created_at, updated_at)
- ✅ UUID primary keys
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) enabled
- ✅ Triggers for auto-updating timestamps
- ✅ Materialized view for customer stats

## Next Steps

After setting up the database:

1. Test the connection in your Next.js app
2. Implement API routes using Supabase client
3. Replace mock data with real database queries
4. Set up authentication
5. Configure RLS policies based on user roles
