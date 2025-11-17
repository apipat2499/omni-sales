-- Comprehensive audit logging system
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER, -- Future: track which user performed the action
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view', 'export', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'product', 'order', 'customer', etc.
  entity_id INTEGER, -- ID of the affected entity
  old_values JSONB, -- Previous values (for updates)
  new_values JSONB, -- New values (for updates/creates)
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT, -- Browser/client information
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id INTEGER,
  p_action VARCHAR(50),
  p_entity_type VARCHAR(50),
  p_entity_id INTEGER,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  log_id INTEGER;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    ip_address,
    metadata
  )
  VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_metadata
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to audit product changes
CREATE OR REPLACE FUNCTION audit_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit(
      NULL,
      'create',
      'product',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      NULL,
      jsonb_build_object('trigger', TG_NAME)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit(
      NULL,
      'update',
      'product',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NULL,
      jsonb_build_object('trigger', TG_NAME)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit(
      NULL,
      'delete',
      'product',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      NULL,
      jsonb_build_object('trigger', TG_NAME)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Audit triggers for key tables
CREATE TRIGGER trigger_audit_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION audit_product_changes();

-- Trigger for customers
CREATE OR REPLACE FUNCTION audit_customer_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit(NULL, 'create', 'customer', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit(NULL, 'update', 'customer', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit(NULL, 'delete', 'customer', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION audit_customer_changes();

-- Trigger for orders
CREATE OR REPLACE FUNCTION audit_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit(NULL, 'create', 'order', NEW.id, NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit(NULL, 'update', 'order', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit(NULL, 'delete', 'order', OLD.id, to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION audit_order_changes();

-- Cleanup old audit logs (optional - for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system changes';
COMMENT ON FUNCTION log_audit IS 'Helper function to log audit events programmatically';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Cleanup audit logs older than specified days';
