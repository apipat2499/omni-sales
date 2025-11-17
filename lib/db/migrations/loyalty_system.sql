-- Loyalty points system
CREATE TABLE IF NOT EXISTS loyalty_points (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_redeemed INTEGER NOT NULL DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'Bronze', -- Bronze, Silver, Gold, Platinum
  tier_progress DECIMAL(5,2) DEFAULT 0.00, -- Progress to next tier (0-100%)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id)
);

-- Points transaction history
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'earn', 'redeem', 'expire', 'bonus', 'adjustment'
  points INTEGER NOT NULL, -- Positive for earning, negative for redeeming
  balance_after INTEGER NOT NULL,
  reference_type VARCHAR(50), -- 'order', 'promotion', 'manual', etc.
  reference_id INTEGER,
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE, -- For earned points
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty tiers configuration
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  min_points INTEGER NOT NULL,
  max_points INTEGER, -- NULL for highest tier
  earn_multiplier DECIMAL(3,2) DEFAULT 1.00, -- Point earning multiplier
  benefits JSONB, -- JSON array of benefits
  color VARCHAR(20), -- UI color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer ON loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expires ON loyalty_transactions(expires_at);

-- Triggers
CREATE OR REPLACE FUNCTION update_loyalty_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_loyalty_points_updated_at
  BEFORE UPDATE ON loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_points_updated_at();

CREATE TRIGGER trigger_loyalty_tiers_updated_at
  BEFORE UPDATE ON loyalty_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_points_updated_at();

-- Insert default tiers
INSERT INTO loyalty_tiers (name, min_points, max_points, earn_multiplier, benefits, color) VALUES
  ('Bronze', 0, 999, 1.00, '["ส่วนลด 5% ในวันเกิด"]', '#CD7F32'),
  ('Silver', 1000, 4999, 1.25, '["ส่วนลด 10% ในวันเกิด", "แต้มเพิ่ม 25%"]', '#C0C0C0'),
  ('Gold', 5000, 14999, 1.50, '["ส่วนลด 15% ในวันเกิด", "แต้มเพิ่ม 50%", "จัดส่งฟรีทุกออเดอร์"]', '#FFD700'),
  ('Platinum', 15000, NULL, 2.00, '["ส่วนลด 20% ในวันเกิด", "แต้มเพิ่ม 100%", "จัดส่งฟรีทุกออเดอร์", "บริการ VIP ลูกค้าพิเศษ"]', '#E5E4E2')
ON CONFLICT (name) DO NOTHING;

-- Function to calculate tier from points
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(points INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
  tier_name VARCHAR(50);
BEGIN
  SELECT name INTO tier_name
  FROM loyalty_tiers
  WHERE points >= min_points
    AND (max_points IS NULL OR points <= max_points)
  ORDER BY min_points DESC
  LIMIT 1;

  RETURN COALESCE(tier_name, 'Bronze');
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE loyalty_points IS 'Customer loyalty points balance and tier information';
COMMENT ON TABLE loyalty_transactions IS 'History of all loyalty points transactions';
COMMENT ON TABLE loyalty_tiers IS 'Configuration of loyalty tier levels and benefits';
