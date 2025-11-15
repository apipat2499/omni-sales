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

-- Original Policies
CREATE POLICY "Allow all for products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for order_items" ON order_items FOR ALL USING (true);
