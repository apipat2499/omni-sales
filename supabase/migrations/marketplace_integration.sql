-- Marketplace Integration Tables
-- This migration creates tables for managing marketplace connections, orders, products, and sync logs

-- ============================================
-- Table: marketplace_connections
-- Stores API credentials and connection info for marketplace integrations
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_type VARCHAR(50) NOT NULL CHECK (marketplace_type IN ('shopee', 'lazada', 'facebook')),
  shop_id VARCHAR(255) NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token
  credentials JSONB NOT NULL DEFAULT '{}', -- Encrypted API keys and other credentials
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(marketplace_type, shop_id)
);

CREATE INDEX idx_marketplace_connections_type ON marketplace_connections(marketplace_type);
CREATE INDEX idx_marketplace_connections_active ON marketplace_connections(is_active);
CREATE INDEX idx_marketplace_connections_last_sync ON marketplace_connections(last_sync_at);

COMMENT ON TABLE marketplace_connections IS 'Stores marketplace connection credentials and settings';
COMMENT ON COLUMN marketplace_connections.credentials IS 'JSON object containing partner_id, partner_key, app_key, app_secret, region, etc.';

-- ============================================
-- Table: marketplace_orders
-- Stores orders imported from marketplaces
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_type VARCHAR(50) NOT NULL CHECK (marketplace_type IN ('shopee', 'lazada', 'facebook')),
  marketplace_connection_id UUID NOT NULL REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  marketplace_order_id VARCHAR(255) NOT NULL,
  marketplace_order_number VARCHAR(255) NOT NULL,
  omni_sales_order_id UUID, -- Reference to orders table (if exists)
  status VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'THB',
  payment_method VARCHAR(100),
  shipping_address JSONB,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  marketplace_created_at TIMESTAMP WITH TIME ZONE,
  marketplace_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(marketplace_type, marketplace_order_id)
);

CREATE INDEX idx_marketplace_orders_type ON marketplace_orders(marketplace_type);
CREATE INDEX idx_marketplace_orders_connection ON marketplace_orders(marketplace_connection_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_marketplace_id ON marketplace_orders(marketplace_order_id);
CREATE INDEX idx_marketplace_orders_omni_sales ON marketplace_orders(omni_sales_order_id);
CREATE INDEX idx_marketplace_orders_created ON marketplace_orders(marketplace_created_at);
CREATE INDEX idx_marketplace_orders_updated ON marketplace_orders(marketplace_updated_at);

COMMENT ON TABLE marketplace_orders IS 'Stores orders synced from marketplace platforms';
COMMENT ON COLUMN marketplace_orders.items IS 'JSON array of order items with product details';
COMMENT ON COLUMN marketplace_orders.metadata IS 'Additional marketplace-specific data (tracking, notes, etc.)';

-- ============================================
-- Table: marketplace_products
-- Maps local products to marketplace products
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL, -- Reference to products table
  marketplace_connection_id UUID NOT NULL REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  marketplace_type VARCHAR(50) NOT NULL CHECK (marketplace_type IN ('shopee', 'lazada', 'facebook')),
  marketplace_product_id VARCHAR(255) NOT NULL,
  marketplace_sku VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, marketplace_connection_id)
);

CREATE INDEX idx_marketplace_products_product ON marketplace_products(product_id);
CREATE INDEX idx_marketplace_products_connection ON marketplace_products(marketplace_connection_id);
CREATE INDEX idx_marketplace_products_type ON marketplace_products(marketplace_type);
CREATE INDEX idx_marketplace_products_marketplace_id ON marketplace_products(marketplace_product_id);
CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_products_last_sync ON marketplace_products(last_synced_at);

COMMENT ON TABLE marketplace_products IS 'Maps local products to marketplace platform product IDs';
COMMENT ON COLUMN marketplace_products.sync_errors IS 'Array of error messages from failed sync attempts';

-- ============================================
-- Table: marketplace_sync_logs
-- Logs all sync operations
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_type VARCHAR(50) NOT NULL,
  shop_id VARCHAR(255) NOT NULL,
  sync_type VARCHAR(50) DEFAULT 'order' CHECK (sync_type IN ('order', 'product', 'inventory')),
  success BOOLEAN NOT NULL,
  orders_synced INTEGER DEFAULT 0,
  orders_failed INTEGER DEFAULT 0,
  products_synced INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  errors TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketplace_sync_logs_type ON marketplace_sync_logs(marketplace_type);
CREATE INDEX idx_marketplace_sync_logs_shop ON marketplace_sync_logs(shop_id);
CREATE INDEX idx_marketplace_sync_logs_sync_type ON marketplace_sync_logs(sync_type);
CREATE INDEX idx_marketplace_sync_logs_success ON marketplace_sync_logs(success);
CREATE INDEX idx_marketplace_sync_logs_synced_at ON marketplace_sync_logs(synced_at);

COMMENT ON TABLE marketplace_sync_logs IS 'Audit log of all marketplace synchronization operations';

-- ============================================
-- Table: marketplace_webhooks
-- Stores incoming webhook events from marketplaces
-- ============================================

CREATE TABLE IF NOT EXISTS marketplace_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_type VARCHAR(50) NOT NULL,
  shop_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketplace_webhooks_type ON marketplace_webhooks(marketplace_type);
CREATE INDEX idx_marketplace_webhooks_shop ON marketplace_webhooks(shop_id);
CREATE INDEX idx_marketplace_webhooks_event ON marketplace_webhooks(event_type);
CREATE INDEX idx_marketplace_webhooks_processed ON marketplace_webhooks(processed);
CREATE INDEX idx_marketplace_webhooks_created ON marketplace_webhooks(created_at);

COMMENT ON TABLE marketplace_webhooks IS 'Stores webhook events from marketplace platforms for processing';

-- ============================================
-- Functions and Triggers
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_marketplace_connections_updated_at BEFORE UPDATE ON marketplace_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_orders_updated_at BEFORE UPDATE ON marketplace_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON marketplace_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_webhooks ENABLE ROW LEVEL SECURITY;

-- Policies for marketplace_connections
CREATE POLICY "Users can view their marketplace connections"
  ON marketplace_connections FOR SELECT
  USING (true); -- Adjust based on your auth structure

CREATE POLICY "Users can insert their marketplace connections"
  ON marketplace_connections FOR INSERT
  WITH CHECK (true); -- Adjust based on your auth structure

CREATE POLICY "Users can update their marketplace connections"
  ON marketplace_connections FOR UPDATE
  USING (true); -- Adjust based on your auth structure

CREATE POLICY "Users can delete their marketplace connections"
  ON marketplace_connections FOR DELETE
  USING (true); -- Adjust based on your auth structure

-- Policies for marketplace_orders
CREATE POLICY "Users can view marketplace orders"
  ON marketplace_orders FOR SELECT
  USING (true); -- Adjust based on your auth structure

CREATE POLICY "System can insert marketplace orders"
  ON marketplace_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update marketplace orders"
  ON marketplace_orders FOR UPDATE
  USING (true);

-- Policies for marketplace_products
CREATE POLICY "Users can view marketplace products"
  ON marketplace_products FOR SELECT
  USING (true);

CREATE POLICY "Users can manage marketplace products"
  ON marketplace_products FOR ALL
  USING (true);

-- Policies for marketplace_sync_logs
CREATE POLICY "Users can view sync logs"
  ON marketplace_sync_logs FOR SELECT
  USING (true);

CREATE POLICY "System can insert sync logs"
  ON marketplace_sync_logs FOR INSERT
  WITH CHECK (true);

-- Policies for marketplace_webhooks
CREATE POLICY "System can manage webhooks"
  ON marketplace_webhooks FOR ALL
  USING (true);

-- ============================================
-- Seed Data (Optional)
-- ============================================

-- Example: Insert a test connection (commented out)
-- INSERT INTO marketplace_connections (marketplace_type, shop_id, shop_name, access_token, credentials)
-- VALUES (
--   'shopee',
--   '12345',
--   'Test Shop',
--   'encrypted_token_here',
--   '{"partner_id": 1000000, "partner_key": "test_key", "region": "TH"}'::jsonb
-- );

-- ============================================
-- Helpful Views
-- ============================================

-- View: Active marketplace connections summary
CREATE OR REPLACE VIEW active_marketplace_connections AS
SELECT
  id,
  marketplace_type,
  shop_id,
  shop_name,
  is_active,
  last_sync_at,
  CASE
    WHEN last_sync_at IS NULL THEN 'Never synced'
    WHEN last_sync_at < NOW() - INTERVAL '1 hour' THEN 'Sync overdue'
    ELSE 'Recently synced'
  END as sync_status,
  created_at
FROM marketplace_connections
WHERE is_active = true
ORDER BY last_sync_at DESC NULLS LAST;

COMMENT ON VIEW active_marketplace_connections IS 'Shows all active marketplace connections with sync status';

-- View: Recent sync activity
CREATE OR REPLACE VIEW recent_sync_activity AS
SELECT
  marketplace_type,
  shop_id,
  sync_type,
  success,
  orders_synced,
  orders_failed,
  products_synced,
  products_failed,
  synced_at,
  duration_ms
FROM marketplace_sync_logs
ORDER BY synced_at DESC
LIMIT 100;

COMMENT ON VIEW recent_sync_activity IS 'Shows the 100 most recent sync operations';

-- View: Marketplace order summary
CREATE OR REPLACE VIEW marketplace_order_summary AS
SELECT
  marketplace_type,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  COUNT(DISTINCT marketplace_connection_id) as connected_shops,
  MIN(marketplace_created_at) as first_order_date,
  MAX(marketplace_created_at) as last_order_date
FROM marketplace_orders
GROUP BY marketplace_type;

COMMENT ON VIEW marketplace_order_summary IS 'Summary statistics for marketplace orders by platform';
