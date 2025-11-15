-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER, -- Future: for multi-user support
  type VARCHAR(20) NOT NULL, -- 'info', 'success', 'warning', 'error'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500), -- Optional link to related resource
  read BOOLEAN DEFAULT false,
  metadata JSONB, -- Additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration
);

-- Notification triggers/rules
CREATE TABLE IF NOT EXISTS notification_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'low_stock', 'new_order', 'high_value_order', etc.
  enabled BOOLEAN DEFAULT true,
  conditions JSONB, -- Conditions for triggering notification
  notification_template JSONB, -- Template for notification content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notification_rules_event ON notification_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled ON notification_rules(enabled);

-- Function to delete expired notifications
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_type VARCHAR(20),
  p_title VARCHAR(255),
  p_message TEXT,
  p_link VARCHAR(500) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  notification_id INTEGER;
  expires_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  IF p_expires_hours IS NOT NULL THEN
    expires_timestamp := CURRENT_TIMESTAMP + (p_expires_hours || ' hours')::INTERVAL;
  END IF;

  INSERT INTO notifications (type, title, message, link, metadata, expires_at)
  VALUES (p_type, p_title, p_message, p_link, p_metadata, expires_timestamp)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification when product stock is low
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock <= 10 AND (OLD.stock IS NULL OR OLD.stock > 10) THEN
    PERFORM create_notification(
      'warning',
      'สินค้าใกล้หมด',
      format('สินค้า "%s" เหลือเพียง %s ชิ้น', NEW.name, NEW.stock),
      '/products',
      jsonb_build_object('product_id', NEW.id, 'stock', NEW.stock),
      72 -- Expire after 72 hours
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_low_stock
  AFTER INSERT OR UPDATE OF stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();

-- Insert default notification rules
INSERT INTO notification_rules (name, event_type, enabled, conditions, notification_template) VALUES
  ('Low Stock Alert', 'low_stock', true, '{"threshold": 10}', '{"type": "warning", "title": "สินค้าใกล้หมด", "expires_hours": 72}'),
  ('New Order', 'new_order', true, '{}', '{"type": "success", "title": "ออเดอร์ใหม่", "expires_hours": 24}'),
  ('High Value Order', 'high_value_order', true, '{"min_amount": 10000}', '{"type": "info", "title": "ออเดอร์มูลค่าสูง", "expires_hours": 48}'),
  ('Payment Received', 'payment_received', true, '{}', '{"type": "success", "title": "ได้รับชำระเงิน", "expires_hours": 24}')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for important events';
COMMENT ON TABLE notification_rules IS 'Rules for automatically generating notifications';
COMMENT ON FUNCTION delete_expired_notifications() IS 'Cleanup function to remove expired notifications';
COMMENT ON FUNCTION create_notification IS 'Helper function to create a new notification';
