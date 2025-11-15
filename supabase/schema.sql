-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  channel VARCHAR(50) NOT NULL,
  payment_method VARCHAR(100),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Create Views for Statistics
CREATE OR REPLACE VIEW customer_stats AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.tags,
  c.created_at,
  c.updated_at,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_spent,
  MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.email, c.phone, c.address, c.tags, c.created_at, c.updated_at;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  stripe_product_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'month',
  product_limit INTEGER NOT NULL DEFAULT 10,
  features TEXT[] DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Items Table
CREATE TABLE IF NOT EXISTS subscription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_subscription_item_id VARCHAR(255) UNIQUE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_invoice_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  description TEXT,
  pdf_url VARCHAR(500),
  hosted_invoice_url VARCHAR(500),
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_charge_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(100),
  receipt_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing Usage Table (for tracking product usage)
CREATE TABLE IF NOT EXISTS billing_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_charge_id ON payments(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_billing_usage_subscription_id ON billing_usage(subscription_id);

-- Create triggers for subscription timestamps
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_items_updated_at BEFORE UPDATE ON subscription_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_usage_updated_at BEFORE UPDATE ON billing_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for subscription tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_usage ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow all for now - adjust based on auth requirements)
CREATE POLICY "Allow all for subscription_plans" ON subscription_plans FOR ALL USING (true);
CREATE POLICY "Allow all for subscriptions" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all for subscription_items" ON subscription_items FOR ALL USING (true);
CREATE POLICY "Allow all for invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all for payments" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all for billing_usage" ON billing_usage FOR ALL USING (true);

-- Marketplace Integrations Tables

-- Marketplace Platforms (Shopee, Lazada, Facebook)
CREATE TABLE IF NOT EXISTS marketplace_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  icon_url VARCHAR(500),
  api_base_url VARCHAR(500),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Connections (User's API credentials per platform)
CREATE TABLE IF NOT EXISTS marketplace_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  platform_id UUID REFERENCES marketplace_platforms(id),
  platform_code VARCHAR(50) NOT NULL,
  shop_id VARCHAR(255),
  shop_name VARCHAR(255),
  access_token VARCHAR(500),
  refresh_token VARCHAR(500),
  shop_authorization_token VARCHAR(500),
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  webhook_secret VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Products (Sync from marketplace)
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  marketplace_product_id VARCHAR(255) NOT NULL,
  platform_code VARCHAR(50) NOT NULL,
  local_product_id UUID REFERENCES products(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  quantity_available INTEGER,
  image_url VARCHAR(500),
  marketplace_url VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform_code, marketplace_product_id, user_id)
);

-- Marketplace Orders (Orders from all platforms)
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  local_order_id UUID REFERENCES orders(id),
  marketplace_order_id VARCHAR(255) NOT NULL,
  platform_code VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  order_status VARCHAR(50),
  payment_status VARCHAR(50),
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'THB',
  shipping_address TEXT,
  items_count INTEGER,
  raw_data JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform_code, marketplace_order_id, user_id)
);

-- Marketplace Order Items
CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace_order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  marketplace_product_id VARCHAR(255),
  product_name VARCHAR(255),
  quantity INTEGER,
  price DECIMAL(10, 2),
  variation_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Sync Logs
CREATE TABLE IF NOT EXISTS marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_duration_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Webhooks (For real-time updates)
CREATE TABLE IF NOT EXISTS marketplace_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  webhook_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_user_id ON marketplace_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_platform_code ON marketplace_connections(platform_code);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_user_id ON marketplace_products(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_connection_id ON marketplace_products(connection_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_local_product_id ON marketplace_products(local_product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_user_id ON marketplace_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_connection_id ON marketplace_orders(connection_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_local_order_id ON marketplace_orders(local_order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_platform_code ON marketplace_orders(platform_code);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_marketplace_order_id ON marketplace_order_items(marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_user_id ON marketplace_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_webhooks_connection_id ON marketplace_webhooks(connection_id);

-- Create Triggers for Marketplace
CREATE TRIGGER update_marketplace_platforms_updated_at BEFORE UPDATE ON marketplace_platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_connections_updated_at BEFORE UPDATE ON marketplace_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON marketplace_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_orders_updated_at BEFORE UPDATE ON marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_webhooks_updated_at BEFORE UPDATE ON marketplace_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for marketplace tables
ALTER TABLE marketplace_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_webhooks ENABLE ROW LEVEL SECURITY;

-- Create Policies for marketplace tables
CREATE POLICY "Allow all for marketplace_platforms" ON marketplace_platforms FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_connections" ON marketplace_connections FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_products" ON marketplace_products FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_orders" ON marketplace_orders FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_order_items" ON marketplace_order_items FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_sync_logs" ON marketplace_sync_logs FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_webhooks" ON marketplace_webhooks FOR ALL USING (true);

-- Analytics Tables

-- Daily Sales Metrics (for fast query performance)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_profit DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  returned_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Product Performance Metrics
CREATE TABLE IF NOT EXISTS product_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  date DATE NOT NULL,
  units_sold INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2) DEFAULT 0,
  returns INTEGER DEFAULT 0,
  rating_avg DECIMAL(3, 2),
  rank_by_revenue INTEGER,
  trend DECIMAL(5, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id, date)
);

-- Customer Analytics
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id),
  lifetime_value DECIMAL(12, 2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  first_purchase_date TIMESTAMP WITH TIME ZONE,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  days_since_purchase INTEGER,
  purchase_frequency DECIMAL(5, 2),
  segment VARCHAR(50),
  churn_risk DECIMAL(3, 2),
  rfm_score VARCHAR(10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Channel Performance (Marketplace, Online, Offline, etc)
CREATE TABLE IF NOT EXISTS channel_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  orders INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  conversion_rate DECIMAL(5, 2),
  cost_per_acquisition DECIMAL(10, 2),
  roi DECIMAL(5, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, channel, date)
);

-- Category Performance
CREATE TABLE IF NOT EXISTS category_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  orders INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2) DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  average_price DECIMAL(10, 2) DEFAULT 0,
  margin_percent DECIMAL(5, 2),
  trend DECIMAL(5, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, date)
);

-- Sales Forecast (AI/ML predictions)
CREATE TABLE IF NOT EXISTS sales_forecast (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  forecast_date DATE NOT NULL,
  predicted_orders INTEGER,
  predicted_revenue DECIMAL(12, 2),
  predicted_profit DECIMAL(12, 2),
  confidence_score DECIMAL(3, 2),
  model_version VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, forecast_date)
);

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  filters JSONB DEFAULT '{}',
  metrics TEXT[] DEFAULT '{}',
  date_range_start DATE,
  date_range_end DATE,
  is_scheduled BOOLEAN DEFAULT false,
  schedule_interval VARCHAR(50),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  export_format VARCHAR(20) DEFAULT 'pdf',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Storage
CREATE TABLE IF NOT EXISTS report_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_url VARCHAR(500),
  format VARCHAR(20),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly Detection
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  anomaly_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  detected_value DECIMAL(12, 2),
  expected_value DECIMAL(12, 2),
  deviation_percent DECIMAL(5, 2),
  affected_metric VARCHAR(100),
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_product_performance_user_date ON product_performance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_product_performance_product ON product_performance(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_user ON customer_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_segment ON customer_analytics(user_id, segment);
CREATE INDEX IF NOT EXISTS idx_channel_performance_user_date ON channel_performance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_category_performance_user_date ON category_performance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_forecast_user ON sales_forecast(user_id, forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_custom_reports_user ON custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_files_report ON report_files(report_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_user ON anomalies(user_id, created_at DESC);

-- Create Triggers for Analytics
CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_performance_updated_at BEFORE UPDATE ON product_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_analytics_updated_at BEFORE UPDATE ON customer_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_performance_updated_at BEFORE UPDATE ON channel_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_performance_updated_at BEFORE UPDATE ON category_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_forecast_updated_at BEFORE UPDATE ON sales_forecast
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Analytics
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

-- Create Policies for Analytics
CREATE POLICY "Allow all for daily_metrics" ON daily_metrics FOR ALL USING (true);
CREATE POLICY "Allow all for product_performance" ON product_performance FOR ALL USING (true);
CREATE POLICY "Allow all for customer_analytics" ON customer_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for channel_performance" ON channel_performance FOR ALL USING (true);
CREATE POLICY "Allow all for category_performance" ON category_performance FOR ALL USING (true);
CREATE POLICY "Allow all for sales_forecast" ON sales_forecast FOR ALL USING (true);
CREATE POLICY "Allow all for custom_reports" ON custom_reports FOR ALL USING (true);
CREATE POLICY "Allow all for report_files" ON report_files FOR ALL USING (true);
CREATE POLICY "Allow all for anomalies" ON anomalies FOR ALL USING (true);

-- Original Policies
-- Email & Notification Tables

-- Email Templates (Order confirmation, payment receipt, etc)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  preview_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, template_type)
);

-- Email Logs (Track all sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  template_type VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  provider VARCHAR(50),
  provider_id VARCHAR(255),
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced BOOLEAN DEFAULT false,
  bounced_reason TEXT,
  related_order_id UUID REFERENCES orders(id),
  related_customer_id UUID REFERENCES customers(id),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Triggers (When to send emails)
CREATE TABLE IF NOT EXISTS email_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  trigger_name VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  is_enabled BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0,
  recipient_type VARCHAR(50) NOT NULL,
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Queue (For sending emails asynchronously)
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  template_id UUID REFERENCES email_templates(id),
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  related_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Preferences (User settings for notifications)
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  daily_summary_enabled BOOLEAN DEFAULT true,
  daily_summary_time VARCHAR(5) DEFAULT '08:00',
  new_order_notification BOOLEAN DEFAULT true,
  payment_confirmation BOOLEAN DEFAULT true,
  low_stock_alert BOOLEAN DEFAULT true,
  low_stock_threshold INTEGER DEFAULT 10,
  customer_emails_enabled BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  weekly_analytics BOOLEAN DEFAULT true,
  monthly_report BOOLEAN DEFAULT true,
  promotional_emails BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Subscriptions (For customers to manage their preferences)
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  subscription_type VARCHAR(100) NOT NULL,
  is_subscribed BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, subscription_type)
);

-- Email Bounces & Complaints (For list management)
CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  bounce_type VARCHAR(50) NOT NULL,
  bounce_reason TEXT,
  is_permanent BOOLEAN DEFAULT false,
  first_bounce_at TIMESTAMP WITH TIME ZONE,
  last_bounce_at TIMESTAMP WITH TIME ZONE,
  bounce_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email)
);

-- Create Indexes for Email Tables
CREATE INDEX IF NOT EXISTS idx_email_templates_user_type ON email_templates(user_id, template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_status ON email_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_triggers_user_event ON email_triggers(user_id, trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_customer ON email_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_bounces_email ON email_bounces(email);

-- Create Triggers for Email Tables
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_triggers_updated_at BEFORE UPDATE ON email_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscriptions_updated_at BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_bounces_updated_at BEFORE UPDATE ON email_bounces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Email Tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_bounces ENABLE ROW LEVEL SECURITY;

-- Create Policies for Email Tables
CREATE POLICY "Allow all for email_templates" ON email_templates FOR ALL USING (true);
CREATE POLICY "Allow all for email_logs" ON email_logs FOR ALL USING (true);
CREATE POLICY "Allow all for email_triggers" ON email_triggers FOR ALL USING (true);
CREATE POLICY "Allow all for email_queue" ON email_queue FOR ALL USING (true);
CREATE POLICY "Allow all for email_preferences" ON email_preferences FOR ALL USING (true);
CREATE POLICY "Allow all for email_subscriptions" ON email_subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all for email_bounces" ON email_bounces FOR ALL USING (true);

CREATE POLICY "Allow all for products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for order_items" ON order_items FOR ALL USING (true);
