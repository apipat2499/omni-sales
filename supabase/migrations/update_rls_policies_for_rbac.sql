-- Migration: Update RLS Policies for RBAC
-- Description: Updates RLS policies on products, orders, and customers tables to enforce role-based access

-- ========================================
-- PRODUCTS TABLE RLS POLICIES
-- ========================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

-- All authenticated users can read products (viewer, staff, manager, owner)
CREATE POLICY "products_select_policy" ON products
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Staff, Manager, and Owner can create products
CREATE POLICY "products_insert_policy" ON products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager', 'staff')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- Staff, Manager, and Owner can update products
CREATE POLICY "products_update_policy" ON products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager', 'staff')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- Only Owner and Manager can delete products
CREATE POLICY "products_delete_policy" ON products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- ========================================
-- ORDERS TABLE RLS POLICIES
-- ========================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON orders;

-- All authenticated users can read orders
CREATE POLICY "orders_select_policy" ON orders
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Staff, Manager, and Owner can create orders
CREATE POLICY "orders_insert_policy" ON orders
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager', 'staff')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- Staff, Manager, and Owner can update orders
CREATE POLICY "orders_update_policy" ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager', 'staff')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- Only Owner and Manager can delete orders
CREATE POLICY "orders_delete_policy" ON orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- ========================================
-- CUSTOMERS TABLE RLS POLICIES
-- ========================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- All authenticated users can read customers
CREATE POLICY "customers_select_policy" ON customers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Staff, Manager, and Owner can create customers
CREATE POLICY "customers_insert_policy" ON customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager', 'staff')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- Staff, Manager, and Owner can update customers
CREATE POLICY "customers_update_policy" ON customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager', 'staff')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- Only Owner and Manager can delete customers
CREATE POLICY "customers_delete_policy" ON customers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('owner', 'manager')
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    )
  );

-- ========================================
-- HELPER VIEWS
-- ========================================

-- Create a view for easy access to user permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT
  ur.user_id,
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP;

-- Grant access to the view
GRANT SELECT ON user_permissions_view TO authenticated;
