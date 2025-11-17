-- =====================================================
-- DISCOUNT & PROMOTION SYSTEM
-- =====================================================

-- Discounts Table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
  value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER, -- null = unlimited
  usage_count INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  applies_to VARCHAR(20) DEFAULT 'all', -- 'all', 'category', 'product'
  applies_to_value TEXT, -- category name or product IDs (JSON array)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discount Usages Table (Track who used which discount)
CREATE TABLE IF NOT EXISTS discount_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add discount column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================

-- Notifications Table (for inventory alerts, system notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'low_stock', 'out_of_stock', 'order_created', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  related_id UUID, -- product_id, order_id, etc.
  related_type VARCHAR(50), -- 'product', 'order', 'customer'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- null for system-wide settings
  email_enabled BOOLEAN DEFAULT true,
  email_on_order_created BOOLEAN DEFAULT true,
  email_on_order_shipped BOOLEAN DEFAULT true,
  email_on_order_delivered BOOLEAN DEFAULT true,
  email_on_low_stock BOOLEAN DEFAULT true,
  email_on_out_of_stock BOOLEAN DEFAULT true,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default notification preferences
INSERT INTO notification_preferences (user_id, email_enabled, low_stock_threshold)
VALUES (null, true, 10)
ON CONFLICT DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(active);
CREATE INDEX IF NOT EXISTS idx_discounts_dates ON discounts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_discount_usages_discount_id ON discount_usages(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usages_order_id ON discount_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_usages_customer_id ON discount_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at for discounts
CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for discounts" ON discounts FOR ALL USING (true);
CREATE POLICY "Allow all for discount_usages" ON discount_usages FOR ALL USING (true);
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all for notification_preferences" ON notification_preferences FOR ALL USING (true);
