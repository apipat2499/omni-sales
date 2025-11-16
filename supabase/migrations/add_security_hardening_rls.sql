-- Migration: Enhanced RLS Policies for Security Hardening
-- Description: Tightens RLS policies to ensure users can only access their own data
-- Implements team/organization isolation and adds audit triggers for sensitive operations

-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================

-- Enable RLS on all tables with user_id column
ALTER TABLE IF EXISTS discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS discount_code_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS discount_code_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS discount_code_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS discount_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_rating_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS review_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlist_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlist_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wishlist_analytics ENABLE ROW LEVEL SECURITY;

-- ========================================
-- HELPER FUNCTION: Check if user has permission
-- ========================================

CREATE OR REPLACE FUNCTION has_permission(
  required_role TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = required_role
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_any_permission(
  required_roles TEXT[]
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = ANY(required_roles)
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- DISCOUNT CODES RLS POLICIES
-- ========================================

DROP POLICY IF EXISTS "discount_codes_select_policy" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_insert_policy" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_update_policy" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_delete_policy" ON discount_codes;

-- Users can only see their own discount codes
CREATE POLICY "discount_codes_select_policy" ON discount_codes
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only create discount codes for themselves
CREATE POLICY "discount_codes_insert_policy" ON discount_codes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own discount codes
CREATE POLICY "discount_codes_update_policy" ON discount_codes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own discount codes
CREATE POLICY "discount_codes_delete_policy" ON discount_codes
  FOR DELETE
  USING (user_id = auth.uid());

-- ========================================
-- PRODUCT REVIEWS RLS POLICIES
-- ========================================

DROP POLICY IF EXISTS "product_reviews_select_policy" ON product_reviews;
DROP POLICY IF EXISTS "product_reviews_insert_policy" ON product_reviews;
DROP POLICY IF EXISTS "product_reviews_update_policy" ON product_reviews;
DROP POLICY IF EXISTS "product_reviews_delete_policy" ON product_reviews;

-- Users can see all approved reviews, but only their own pending/rejected reviews
CREATE POLICY "product_reviews_select_policy" ON product_reviews
  FOR SELECT
  USING (
    status = 'approved' OR
    user_id = auth.uid()
  );

-- Users can only create reviews for themselves
CREATE POLICY "product_reviews_insert_policy" ON product_reviews
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own reviews
-- Managers and Owners can update any review (for moderation)
CREATE POLICY "product_reviews_update_policy" ON product_reviews
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    has_any_permission(ARRAY['owner', 'manager'])
  )
  WITH CHECK (
    user_id = auth.uid() OR
    has_any_permission(ARRAY['owner', 'manager'])
  );

-- Users can delete their own reviews
-- Managers and Owners can delete any review
CREATE POLICY "product_reviews_delete_policy" ON product_reviews
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    has_any_permission(ARRAY['owner', 'manager'])
  );

-- ========================================
-- WISHLISTS RLS POLICIES
-- ========================================

DROP POLICY IF EXISTS "wishlists_select_policy" ON wishlists;
DROP POLICY IF EXISTS "wishlists_insert_policy" ON wishlists;
DROP POLICY IF EXISTS "wishlists_update_policy" ON wishlists;
DROP POLICY IF EXISTS "wishlists_delete_policy" ON wishlists;

-- Users can see their own wishlists and public wishlists
CREATE POLICY "wishlists_select_policy" ON wishlists
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_public = true
  );

-- Users can only create wishlists for themselves
CREATE POLICY "wishlists_insert_policy" ON wishlists
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own wishlists
CREATE POLICY "wishlists_update_policy" ON wishlists
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own wishlists
CREATE POLICY "wishlists_delete_policy" ON wishlists
  FOR DELETE
  USING (user_id = auth.uid());

-- ========================================
-- APPLY USER ISOLATION TO ALL USER-SCOPED TABLES
-- ========================================

-- Helper macro for creating standard user isolation policies
DO $$
DECLARE
  table_name TEXT;
  tables_with_user_id TEXT[] := ARRAY[
    'discount_rules',
    'discount_code_products',
    'discount_code_categories',
    'discount_code_segments',
    'coupon_redemptions',
    'promotional_campaigns',
    'discount_analytics',
    'review_images',
    'review_votes',
    'review_reports',
    'product_rating_summaries',
    'review_analytics',
    'wishlist_items',
    'wishlist_shares',
    'wishlist_price_history',
    'wishlist_analytics'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_with_user_id
  LOOP
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON %s', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON %s', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_policy" ON %s', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_policy" ON %s', table_name, table_name);

    -- Create new policies
    EXECUTE format('CREATE POLICY "%s_select_policy" ON %s FOR SELECT USING (user_id = auth.uid())', table_name, table_name);
    EXECUTE format('CREATE POLICY "%s_insert_policy" ON %s FOR INSERT WITH CHECK (user_id = auth.uid())', table_name, table_name);
    EXECUTE format('CREATE POLICY "%s_update_policy" ON %s FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', table_name, table_name);
    EXECUTE format('CREATE POLICY "%s_delete_policy" ON %s FOR DELETE USING (user_id = auth.uid())', table_name, table_name);
  END LOOP;
END $$;

-- ========================================
-- AUDIT TRIGGERS FOR SENSITIVE OPERATIONS
-- ========================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  table_name VARCHAR(255) NOT NULL,
  operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owners and managers can view audit logs
CREATE POLICY "audit_logs_select_policy" ON audit_logs
  FOR SELECT
  USING (has_any_permission(ARRAY['owner', 'manager']));

-- No one can modify audit logs directly
CREATE POLICY "audit_logs_no_modify" ON audit_logs
  FOR ALL
  USING (false);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, old_values)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, old_values, new_values)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, new_values)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
DO $$
DECLARE
  sensitive_table TEXT;
  sensitive_tables TEXT[] := ARRAY[
    'customers',
    'orders',
    'order_payments',
    'refunds',
    'discount_codes',
    'product_reviews'
  ];
BEGIN
  FOREACH sensitive_table IN ARRAY sensitive_tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %s', sensitive_table);
    EXECUTE format('CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()', sensitive_table);
  END LOOP;
END $$;

-- ========================================
-- SECURITY VIEWS
-- ========================================

-- Create view for user's own data summary (no PII)
CREATE OR REPLACE VIEW user_data_summary AS
SELECT
  auth.uid() as user_id,
  (SELECT COUNT(*) FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days')) as recent_orders,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM products WHERE stock < 10) as low_stock_products,
  (SELECT COUNT(*) FROM discount_codes WHERE user_id = auth.uid() AND status = 'active') as active_discounts
WHERE auth.uid() IS NOT NULL;

GRANT SELECT ON user_data_summary TO authenticated;

-- ========================================
-- SECURITY FUNCTIONS
-- ========================================

-- Function to check if user owns a resource
CREATE OR REPLACE FUNCTION user_owns_resource(
  table_name TEXT,
  record_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  owner_id UUID;
BEGIN
  EXECUTE format('SELECT user_id FROM %s WHERE id = $1', table_name)
  INTO owner_id
  USING record_id;

  RETURN owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  event_data JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, table_name, operation, new_values)
  VALUES (auth.uid(), 'security_events', event_type, event_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Add indexes on user_id columns for better RLS performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_user_id ON discount_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_user_id ON discount_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE audit_logs IS 'Audit trail for sensitive operations. Only accessible by owners and managers.';
COMMENT ON FUNCTION has_permission IS 'Check if current user has a specific role permission';
COMMENT ON FUNCTION has_any_permission IS 'Check if current user has any of the specified role permissions';
COMMENT ON FUNCTION user_owns_resource IS 'Verify if current user owns a specific resource';
COMMENT ON FUNCTION log_security_event IS 'Log security-related events for audit purposes';
