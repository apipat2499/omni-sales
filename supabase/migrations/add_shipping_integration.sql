-- Thai Shipping Providers Integration
-- Supports Kerry Express, Flash Express, and Thailand Post

-- ============================================
-- Shipping Providers Configuration Table
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_code VARCHAR(50) NOT NULL UNIQUE,
  provider_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  api_credentials JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  service_types JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_shipping_providers_enabled ON shipping_providers(enabled);
CREATE INDEX idx_shipping_providers_code ON shipping_providers(provider_code);

-- Insert default providers
INSERT INTO shipping_providers (provider_code, provider_name, enabled, features, service_types) VALUES
('kerry', 'Kerry Express', true,
  '{"tracking": true, "label_printing": true, "cod": true, "insurance": true}'::jsonb,
  '["standard", "express", "same_day"]'::jsonb),
('flash', 'Flash Express', true,
  '{"tracking": true, "label_printing": true, "cod": true, "insurance": true}'::jsonb,
  '["standard", "express", "economy"]'::jsonb),
('thailand-post', 'Thailand Post', true,
  '{"tracking": true, "label_printing": true, "cod": true, "insurance": true}'::jsonb,
  '["ems", "registered", "parcel", "express"]'::jsonb)
ON CONFLICT (provider_code) DO NOTHING;

-- ============================================
-- Shipments Table
-- ============================================

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  tracking_number VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  service_type VARCHAR(50),

  -- Sender information
  sender_name VARCHAR(255),
  sender_phone VARCHAR(50),
  sender_address TEXT,
  sender_district VARCHAR(100),
  sender_province VARCHAR(100),
  sender_postal_code VARCHAR(20),

  -- Recipient information
  recipient_name VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(50) NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_district VARCHAR(100) NOT NULL,
  recipient_province VARCHAR(100) NOT NULL,
  recipient_postal_code VARCHAR(20) NOT NULL,

  -- Parcel information
  weight_kg DECIMAL(10, 2),
  width_cm DECIMAL(10, 2),
  height_cm DECIMAL(10, 2),
  length_cm DECIMAL(10, 2),
  cod_amount DECIMAL(10, 2),
  insurance_value DECIMAL(10, 2),
  description TEXT,

  -- Shipping details
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,

  -- Label and documentation
  label_url TEXT,
  label_printed BOOLEAN DEFAULT false,
  label_printed_at TIMESTAMP WITH TIME ZONE,

  -- Additional data
  metadata JSONB DEFAULT '{}',
  reference_number VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  UNIQUE(provider, tracking_number)
);

-- Add indexes
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_provider ON shipments(provider);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX idx_shipments_reference ON shipments(reference_number);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_shipments_updated_at();

-- ============================================
-- Shipment Tracking History Table
-- ============================================

CREATE TABLE IF NOT EXISTS shipment_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_shipment_tracking_shipment_id ON shipment_tracking(shipment_id);
CREATE INDEX idx_shipment_tracking_timestamp ON shipment_tracking(timestamp DESC);
CREATE INDEX idx_shipment_tracking_status ON shipment_tracking(status);

-- ============================================
-- Shipping Rates Cache Table
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_rates_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_postal_code VARCHAR(20) NOT NULL,
  destination_postal_code VARCHAR(20) NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  rates JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_rates_cache_lookup ON shipping_rates_cache(
  origin_postal_code,
  destination_postal_code,
  weight,
  expires_at
);
CREATE INDEX idx_rates_cache_expires ON shipping_rates_cache(expires_at);

-- Auto-cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_rates_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM shipping_rates_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE shipping_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates_cache ENABLE ROW LEVEL SECURITY;

-- Shipping Providers Policies
CREATE POLICY "Public can view enabled providers"
  ON shipping_providers FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins can manage providers"
  ON shipping_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin')
    )
  );

-- Shipments Policies
CREATE POLICY "Users can view their order shipments"
  ON shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipments.order_id
      AND orders.customer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'manager', 'staff')
    )
  );

CREATE POLICY "Staff can create shipments"
  ON shipments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'manager', 'staff')
    )
  );

CREATE POLICY "Staff can update shipments"
  ON shipments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'manager', 'staff')
    )
  );

-- Shipment Tracking Policies
CREATE POLICY "Users can view their shipment tracking"
  ON shipment_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments s
      JOIN orders o ON o.id = s.order_id
      WHERE s.id = shipment_tracking.shipment_id
      AND o.customer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'manager', 'staff')
    )
  );

CREATE POLICY "Staff can create tracking entries"
  ON shipment_tracking FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin', 'manager', 'staff')
    )
  );

-- Rates Cache Policies (Public read for performance)
CREATE POLICY "Public can view rates cache"
  ON shipping_rates_cache FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "System can manage rates cache"
  ON shipping_rates_cache FOR ALL
  USING (true);

-- ============================================
-- Helper Views
-- ============================================

-- View for active shipments with order details
CREATE OR REPLACE VIEW active_shipments AS
SELECT
  s.*,
  o.order_number,
  o.customer_id,
  o.status as order_status,
  o.total as order_total,
  sp.provider_name,
  sp.features as provider_features
FROM shipments s
LEFT JOIN orders o ON o.id = s.order_id
LEFT JOIN shipping_providers sp ON sp.provider_code = s.provider
WHERE s.status NOT IN ('delivered', 'cancelled')
ORDER BY s.created_at DESC;

-- View for shipment summary
CREATE OR REPLACE VIEW shipment_summary AS
SELECT
  provider,
  COUNT(*) as total_shipments,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
  AVG(CASE
    WHEN delivered_at IS NOT NULL AND shipped_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (delivered_at - shipped_at))/86400
  END) as avg_delivery_days
FROM shipments
GROUP BY provider;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE shipping_providers IS 'Configuration and credentials for shipping providers';
COMMENT ON TABLE shipments IS 'Shipment records for orders';
COMMENT ON TABLE shipment_tracking IS 'Tracking history for shipments';
COMMENT ON TABLE shipping_rates_cache IS 'Cache for shipping rate quotes';

COMMENT ON COLUMN shipments.provider IS 'Shipping provider code (kerry, flash, thailand-post)';
COMMENT ON COLUMN shipments.tracking_number IS 'Tracking number from provider';
COMMENT ON COLUMN shipments.status IS 'Shipment status (created, picked_up, in_transit, out_for_delivery, delivered, cancelled)';
COMMENT ON COLUMN shipments.cod_amount IS 'Cash on Delivery amount in THB';
COMMENT ON COLUMN shipments.insurance_value IS 'Insurance value in THB';
COMMENT ON COLUMN shipments.metadata IS 'Additional provider-specific data (consignment number, PNO, barcode, etc.)';
