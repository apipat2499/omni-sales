-- =====================================================
-- Performance Optimization: Database Indexes
-- =====================================================
-- This migration adds indexes to improve query performance
-- for commonly queried columns across the database

-- =====================================================
-- ORDERS TABLE INDEXES
-- =====================================================

-- Index on user_id for filtering orders by user
CREATE INDEX IF NOT EXISTS idx_orders_user_id
ON orders(user_id);

-- Index on customer_id for customer order lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id
ON orders(customer_id);

-- Index on status for filtering orders by status
CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

-- Index on created_at for time-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at DESC);

-- Composite index for status + created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
ON orders(status, created_at DESC);

-- Index on updated_at for tracking recent changes
CREATE INDEX IF NOT EXISTS idx_orders_updated_at
ON orders(updated_at DESC);

-- =====================================================
-- ORDER_ITEMS TABLE INDEXES
-- =====================================================

-- Index on order_id for joining with orders
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON order_items(order_id);

-- Index on product_id for product analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
ON order_items(product_id);

-- Composite index for order_id + product_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_product
ON order_items(order_id, product_id);

-- =====================================================
-- PRODUCTS TABLE INDEXES
-- =====================================================

-- Index on category_id for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category_id
ON products(category_id);

-- Index on category for filtering by category name
CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category);

-- Index on SKU for product lookups
CREATE INDEX IF NOT EXISTS idx_products_sku
ON products(sku);

-- Unique index on SKU to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique
ON products(sku)
WHERE sku IS NOT NULL;

-- Index on stock for inventory queries
CREATE INDEX IF NOT EXISTS idx_products_stock
ON products(stock);

-- Index on price for price-based queries
CREATE INDEX IF NOT EXISTS idx_products_price
ON products(price);

-- Index on created_at for sorting new products
CREATE INDEX IF NOT EXISTS idx_products_created_at
ON products(created_at DESC);

-- Text search index on name (using GIN for full-text search)
CREATE INDEX IF NOT EXISTS idx_products_name_gin
ON products USING gin(to_tsvector('english', name));

-- =====================================================
-- CUSTOMERS TABLE INDEXES
-- =====================================================

-- Index on email for customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_email
ON customers(email);

-- Unique index on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_unique
ON customers(email)
WHERE email IS NOT NULL;

-- Index on phone for customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone
ON customers(phone);

-- Index on created_at for customer analytics
CREATE INDEX IF NOT EXISTS idx_customers_created_at
ON customers(created_at DESC);

-- Index on last_order_date for customer segmentation
CREATE INDEX IF NOT EXISTS idx_customers_last_order_date
ON customers(last_order_date DESC);

-- Index on total_spent for customer value analysis
CREATE INDEX IF NOT EXISTS idx_customers_total_spent
ON customers(total_spent DESC);

-- Index on total_orders for customer segmentation
CREATE INDEX IF NOT EXISTS idx_customers_total_orders
ON customers(total_orders DESC);

-- GIN index on tags array for tag-based queries
CREATE INDEX IF NOT EXISTS idx_customers_tags
ON customers USING gin(tags);

-- Text search index on name
CREATE INDEX IF NOT EXISTS idx_customers_name_gin
ON customers USING gin(to_tsvector('english', name));

-- =====================================================
-- CATEGORIES TABLE INDEXES (if exists)
-- =====================================================

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on name for category lookups
CREATE INDEX IF NOT EXISTS idx_categories_name
ON categories(name);

-- Index on parent_id for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
ON categories(parent_id);

-- =====================================================
-- ANALYTICS/REPORTING INDEXES
-- =====================================================

-- Composite index for order analytics by date range and status
CREATE INDEX IF NOT EXISTS idx_orders_analytics
ON orders(created_at DESC, status, total);

-- Index for customer analytics
CREATE INDEX IF NOT EXISTS idx_customers_analytics
ON customers(created_at DESC, total_spent, total_orders);

-- Index for product sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_analytics
ON order_items(created_at DESC, product_id, quantity, total_price);

-- =====================================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- =====================================================

-- Partial index for pending orders (frequently queried)
CREATE INDEX IF NOT EXISTS idx_orders_pending
ON orders(created_at DESC)
WHERE status = 'pending';

-- Partial index for processing orders
CREATE INDEX IF NOT EXISTS idx_orders_processing
ON orders(created_at DESC)
WHERE status = 'processing';

-- Partial index for low stock products
CREATE INDEX IF NOT EXISTS idx_products_low_stock
ON products(stock, name)
WHERE stock < 10;

-- Partial index for out of stock products
CREATE INDEX IF NOT EXISTS idx_products_out_of_stock
ON products(name)
WHERE stock = 0;

-- Partial index for active customers (ordered in last 90 days)
CREATE INDEX IF NOT EXISTS idx_customers_active
ON customers(last_order_date DESC, total_spent)
WHERE last_order_date > NOW() - INTERVAL '90 days';

-- =====================================================
-- PERFORMANCE NOTES
-- =====================================================
--
-- These indexes improve performance for:
-- 1. Order filtering by user, customer, status, and date
-- 2. Product lookups by SKU, category, and price
-- 3. Customer searches by email, phone, and analytics
-- 4. Time-series queries and reporting
-- 5. Full-text search on products and customers
-- 6. N+1 query prevention through foreign key indexes
--
-- Maintenance:
-- - Indexes are automatically maintained by PostgreSQL
-- - REINDEX can be run periodically if needed
-- - Monitor query performance using pg_stat_statements
-- - Adjust indexes based on actual query patterns
--
-- Memory Impact:
-- - Each index uses additional disk space
-- - Indexes are cached in memory for faster access
-- - Trade-off: faster reads vs. slower writes
-- =====================================================

-- Add comments to document indexes
COMMENT ON INDEX idx_orders_user_id IS 'Improves filtering orders by user';
COMMENT ON INDEX idx_orders_status IS 'Improves filtering orders by status';
COMMENT ON INDEX idx_products_sku_unique IS 'Ensures SKU uniqueness and improves lookups';
COMMENT ON INDEX idx_customers_email_unique IS 'Ensures email uniqueness and improves lookups';
COMMENT ON INDEX idx_products_name_gin IS 'Enables fast full-text search on product names';
COMMENT ON INDEX idx_customers_name_gin IS 'Enables fast full-text search on customer names';
