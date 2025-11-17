-- ======================================
-- MIGRATION: Add New Features
-- Date: 2025-11-15
-- Features: Analytics, CRM, Barcode, Discounts, Suppliers, Notifications
-- ======================================

-- ======================================
-- 1. ENHANCED PRODUCT FEATURES
-- ======================================

-- Add new columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10;

-- Create index for barcode
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);

-- Product Search History
CREATE TABLE IF NOT EXISTS product_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_term VARCHAR(255) NOT NULL,
  result_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_searches_term ON product_searches(search_term);
CREATE INDEX IF NOT EXISTS idx_product_searches_created_at ON product_searches(created_at);

-- ======================================
-- 2. DISCOUNT & PROMOTION SYSTEM
-- ======================================

-- Promotions Table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping'
  value DECIMAL(10, 2) NOT NULL, -- percentage (0-100) or fixed amount
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER, -- null = unlimited
  usage_count INTEGER DEFAULT 0,
  applicable_to VARCHAR(50) DEFAULT 'all', -- 'all', 'products', 'categories', 'customers'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Promotion Rules (which products/categories/customers eligible)
CREATE TABLE IF NOT EXISTS promotion_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- 'product', 'category', 'customer_tag'
  rule_value TEXT NOT NULL, -- product_id, category name, or customer tag
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  usage_limit INTEGER, -- null = unlimited
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Promotion Usage Tracking
CREATE TABLE IF NOT EXISTS promotion_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add discount fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- Create indexes for promotions
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_promotion_rules_promotion ON promotion_rules(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_customer ON promotion_usage(customer_id);

-- ======================================
-- 3. SUPPLIER MANAGEMENT
-- ======================================

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  tax_id VARCHAR(100),
  payment_terms TEXT,
  notes TEXT,
  rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Products (catalog with supplier prices)
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(100),
  cost DECIMAL(10, 2) NOT NULL,
  min_order_qty INTEGER DEFAULT 1,
  lead_time_days INTEGER,
  is_preferred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(supplier_id, product_id)
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS po_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  cost DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Communications Log
CREATE TABLE IF NOT EXISTS supplier_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'meeting', 'note'
  subject VARCHAR(255),
  content TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_supplier_comms_supplier ON supplier_communications(supplier_id);

-- ======================================
-- 4. CUSTOMER MANAGEMENT (CRM)
-- ======================================

-- Customer Communications
CREATE TABLE IF NOT EXISTS customer_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'phone', 'meeting', 'note'
  subject VARCHAR(255),
  content TEXT,
  direction VARCHAR(20) DEFAULT 'outbound', -- 'inbound', 'outbound'
  status VARCHAR(50) DEFAULT 'sent', -- 'draft', 'sent', 'delivered', 'failed'
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Activities Timeline
CREATE TABLE IF NOT EXISTS customer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'order', 'communication', 'note', 'status_change'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Segments
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rules JSONB NOT NULL, -- Segment rules in JSON format
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Segment Membership
CREATE TABLE IF NOT EXISTS customer_segment_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, segment_id)
);

-- RFM Analysis (Recency, Frequency, Monetary)
CREATE TABLE IF NOT EXISTS rfm_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
  recency_score INTEGER CHECK (recency_score >= 1 AND recency_score <= 5),
  frequency_score INTEGER CHECK (frequency_score >= 1 AND frequency_score <= 5),
  monetary_score INTEGER CHECK (monetary_score >= 1 AND monetary_score <= 5),
  rfm_segment VARCHAR(50), -- 'Champions', 'Loyal', 'At Risk', etc.
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add CRM fields to customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS lifecycle_stage VARCHAR(50) DEFAULT 'new', -- 'new', 'active', 'at_risk', 'dormant', 'vip'
ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(50) DEFAULT 'email', -- 'email', 'sms', 'phone'
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for CRM
CREATE INDEX IF NOT EXISTS idx_customer_comms_customer ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_comms_type ON customer_communications(type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_type ON customer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_segments_active ON customer_segments(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_segment_members_customer ON customer_segment_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_members_segment ON customer_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_rfm_scores_customer ON rfm_scores(customer_id);
CREATE INDEX IF NOT EXISTS idx_rfm_scores_segment ON rfm_scores(rfm_segment);

-- ======================================
-- 5. NOTIFICATIONS SYSTEM
-- ======================================

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'email', 'sms'
  event VARCHAR(100) NOT NULL, -- 'order_created', 'order_shipped', 'low_stock', etc.
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables JSONB, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Sent Log
CREATE TABLE IF NOT EXISTS notifications_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'email', 'sms'
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  body TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  low_stock_alerts BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Queue
CREATE TABLE IF NOT EXISTS notification_queues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  data JSONB,
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'sent', 'failed'
  retry_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notification_templates_event ON notification_templates(event);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_status ON notifications_sent(status);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_created ON notifications_sent(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queues_status ON notification_queues(status);
CREATE INDEX IF NOT EXISTS idx_notification_queues_scheduled ON notification_queues(scheduled_at);

-- ======================================
-- 6. REPORTS & ANALYTICS
-- ======================================

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'sales', 'inventory', 'customer', 'financial'
  config JSONB NOT NULL, -- Report configuration (filters, columns, etc.)
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Schedules (for automated report generation)
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
  recipients TEXT[], -- Email addresses
  format VARCHAR(20) DEFAULT 'pdf', -- 'pdf', 'excel', 'csv'
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(type);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_template ON report_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run);

-- ======================================
-- 7. ANALYTICS VIEWS
-- ======================================

-- Sales Analytics View
CREATE OR REPLACE VIEW sales_analytics AS
SELECT
  DATE(o.created_at) as sale_date,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.subtotal) as subtotal,
  SUM(o.tax) as tax,
  SUM(o.shipping) as shipping,
  SUM(o.discount_amount) as discounts,
  SUM(o.total) as revenue,
  COUNT(DISTINCT o.customer_id) as unique_customers,
  AVG(o.total) as avg_order_value,
  o.channel,
  o.status
FROM orders o
GROUP BY DATE(o.created_at), o.channel, o.status;

-- Product Performance View
CREATE OR REPLACE VIEW product_performance AS
SELECT
  p.id,
  p.name,
  p.category,
  p.price,
  p.cost,
  p.stock,
  p.rating,
  p.view_count,
  COUNT(DISTINCT oi.order_id) as times_ordered,
  COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
  COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
  COALESCE(SUM(oi.quantity * (oi.price - p.cost)), 0) as total_profit
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.category, p.price, p.cost, p.stock, p.rating, p.view_count;

-- Customer Lifetime Value View
CREATE OR REPLACE VIEW customer_lifetime_value AS
SELECT
  c.id,
  c.name,
  c.email,
  c.lifecycle_stage,
  c.tags,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as lifetime_value,
  COALESCE(AVG(o.total), 0) as avg_order_value,
  MAX(o.created_at) as last_order_date,
  MIN(o.created_at) as first_order_date,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(o.created_at))) as days_since_last_order
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.email, c.lifecycle_stage, c.tags;

-- ======================================
-- 8. TRIGGERS
-- ======================================

-- Update triggers for new tables
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at BEFORE UPDATE ON supplier_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfm_scores_updated_at BEFORE UPDATE ON rfm_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- 9. ROW LEVEL SECURITY
-- ======================================

-- Enable RLS for all new tables
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfm_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_searches ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for now)
CREATE POLICY "Allow all for promotions" ON promotions FOR ALL USING (true);
CREATE POLICY "Allow all for promotion_rules" ON promotion_rules FOR ALL USING (true);
CREATE POLICY "Allow all for coupons" ON coupons FOR ALL USING (true);
CREATE POLICY "Allow all for promotion_usage" ON promotion_usage FOR ALL USING (true);
CREATE POLICY "Allow all for suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all for supplier_products" ON supplier_products FOR ALL USING (true);
CREATE POLICY "Allow all for purchase_orders" ON purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow all for po_items" ON po_items FOR ALL USING (true);
CREATE POLICY "Allow all for supplier_communications" ON supplier_communications FOR ALL USING (true);
CREATE POLICY "Allow all for customer_communications" ON customer_communications FOR ALL USING (true);
CREATE POLICY "Allow all for customer_activities" ON customer_activities FOR ALL USING (true);
CREATE POLICY "Allow all for customer_segments" ON customer_segments FOR ALL USING (true);
CREATE POLICY "Allow all for customer_segment_members" ON customer_segment_members FOR ALL USING (true);
CREATE POLICY "Allow all for rfm_scores" ON rfm_scores FOR ALL USING (true);
CREATE POLICY "Allow all for notification_templates" ON notification_templates FOR ALL USING (true);
CREATE POLICY "Allow all for notifications_sent" ON notifications_sent FOR ALL USING (true);
CREATE POLICY "Allow all for user_preferences" ON user_preferences FOR ALL USING (true);
CREATE POLICY "Allow all for notification_queues" ON notification_queues FOR ALL USING (true);
CREATE POLICY "Allow all for report_templates" ON report_templates FOR ALL USING (true);
CREATE POLICY "Allow all for report_schedules" ON report_schedules FOR ALL USING (true);
CREATE POLICY "Allow all for product_searches" ON product_searches FOR ALL USING (true);
