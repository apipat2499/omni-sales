-- Order activity log / timeline
CREATE TABLE IF NOT EXISTS order_activities (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'note_added', 'payment_received', 'shipped', etc.
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  user_id INTEGER, -- Future: track who made the change
  metadata JSONB, -- Additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order notes (internal comments)
CREATE TABLE IF NOT EXISTS order_notes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- Internal notes vs customer-visible
  user_id INTEGER, -- Future: track who added the note
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'processed', 'rejected'
  payment_method VARCHAR(50), -- How refund was issued
  reference_number VARCHAR(100), -- External refund reference
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_activities_order ON order_activities(order_id);
CREATE INDEX IF NOT EXISTS idx_order_activities_type ON order_activities(type);
CREATE INDEX IF NOT EXISTS idx_order_activities_created ON order_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_notes_order ON order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_created ON order_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- Triggers
CREATE OR REPLACE FUNCTION update_order_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_notes_updated_at
  BEFORE UPDATE ON order_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_order_notes_updated_at();

CREATE TRIGGER trigger_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_order_notes_updated_at();

-- Auto-create activity when order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_activities (order_id, type, description, old_value, new_value)
    VALUES (
      NEW.id,
      'status_changed',
      'สถานะเปลี่ยนจาก ' || OLD.status || ' เป็น ' || NEW.status,
      OLD.status,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Comments
COMMENT ON TABLE order_activities IS 'Timeline of all activities and changes for orders';
COMMENT ON TABLE order_notes IS 'Internal notes and comments on orders';
COMMENT ON TABLE refunds IS 'Order refund records and processing status';
