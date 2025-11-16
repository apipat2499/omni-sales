-- Seed script for RBAC (Role-Based Access Control)
-- This script populates default roles, permissions, and role-permission mappings

-- ========================================
-- SEED ROLES
-- ========================================

INSERT INTO roles (name, description, permissions) VALUES
  ('owner', 'Full system access with all permissions', '["*:*"]'::jsonb),
  ('manager', 'Management-level access with most permissions except critical system operations', '["products:*", "orders:*", "customers:*", "reports:read"]'::jsonb),
  ('staff', 'Standard staff access for daily operations', '["products:create", "products:read", "products:update", "orders:create", "orders:read", "orders:update", "customers:create", "customers:read", "customers:update"]'::jsonb),
  ('viewer', 'Read-only access to all resources', '["products:read", "orders:read", "customers:read", "reports:read"]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- ========================================
-- SEED PERMISSIONS
-- ========================================

-- Products permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('products:create', 'products', 'create', 'Create new products'),
  ('products:read', 'products', 'read', 'View products'),
  ('products:update', 'products', 'update', 'Update existing products'),
  ('products:delete', 'products', 'delete', 'Delete products'),
  ('products:bulk_edit', 'products', 'bulk_edit', 'Perform bulk operations on products')
ON CONFLICT (resource, action) DO UPDATE SET
  description = EXCLUDED.description;

-- Orders permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('orders:create', 'orders', 'create', 'Create new orders'),
  ('orders:read', 'orders', 'read', 'View orders'),
  ('orders:update', 'orders', 'update', 'Update existing orders'),
  ('orders:delete', 'orders', 'delete', 'Delete orders'),
  ('orders:bulk_edit', 'orders', 'bulk_edit', 'Perform bulk operations on orders')
ON CONFLICT (resource, action) DO UPDATE SET
  description = EXCLUDED.description;

-- Customers permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('customers:create', 'customers', 'create', 'Create new customers'),
  ('customers:read', 'customers', 'read', 'View customers'),
  ('customers:update', 'customers', 'update', 'Update existing customers'),
  ('customers:delete', 'customers', 'delete', 'Delete customers'),
  ('customers:bulk_edit', 'customers', 'bulk_edit', 'Perform bulk operations on customers')
ON CONFLICT (resource, action) DO UPDATE SET
  description = EXCLUDED.description;

-- Users permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('users:create', 'users', 'create', 'Create new users'),
  ('users:read', 'users', 'read', 'View users'),
  ('users:update', 'users', 'update', 'Update existing users'),
  ('users:delete', 'users', 'delete', 'Delete users'),
  ('users:bulk_edit', 'users', 'bulk_edit', 'Perform bulk operations on users')
ON CONFLICT (resource, action) DO UPDATE SET
  description = EXCLUDED.description;

-- Settings permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('settings:create', 'settings', 'create', 'Create settings'),
  ('settings:read', 'settings', 'read', 'View settings'),
  ('settings:update', 'settings', 'update', 'Update settings'),
  ('settings:delete', 'settings', 'delete', 'Delete settings')
ON CONFLICT (resource, action) DO UPDATE SET
  description = EXCLUDED.description;

-- Reports permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('reports:read', 'reports', 'read', 'View reports and analytics')
ON CONFLICT (resource, action) DO UPDATE SET
  description = EXCLUDED.description;

-- Wildcard permission (for owner role)
INSERT INTO permissions (name, resource, action, description) VALUES
  ('*:*', '*', '*', 'Full system access (all permissions)')
ON CONFLICT (resource, action) DO UPDATE SET
  description = EXCLUDED.description;

-- ========================================
-- MAP PERMISSIONS TO ROLES
-- ========================================

-- Owner role: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager role: All except user management and critical operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.name IN (
    'products:create', 'products:read', 'products:update', 'products:delete', 'products:bulk_edit',
    'orders:create', 'orders:read', 'orders:update', 'orders:delete', 'orders:bulk_edit',
    'customers:create', 'customers:read', 'customers:update', 'customers:delete', 'customers:bulk_edit',
    'reports:read',
    'settings:read', 'settings:update'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff role: Create, read, update (no delete, no bulk edit)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'staff'
  AND p.name IN (
    'products:create', 'products:read', 'products:update',
    'orders:create', 'orders:read', 'orders:update',
    'customers:create', 'customers:read', 'customers:update',
    'settings:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer role: Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.name IN (
    'products:read',
    'orders:read',
    'customers:read',
    'reports:read',
    'settings:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ========================================
-- CREATE DEFAULT ADMIN USER (Optional)
-- ========================================

-- Note: This section should be customized based on your needs
-- You can assign the owner role to the first user or a specific user
-- Uncomment and modify as needed:

-- Example: Assign owner role to a specific user by email
-- DO $$
-- DECLARE
--   v_user_id UUID;
--   v_role_id UUID;
-- BEGIN
--   -- Get user ID by email
--   SELECT id INTO v_user_id
--   FROM auth.users
--   WHERE email = 'admin@example.com'
--   LIMIT 1;
--
--   -- Get owner role ID
--   SELECT id INTO v_role_id
--   FROM roles
--   WHERE name = 'owner'
--   LIMIT 1;
--
--   -- Assign owner role if user exists
--   IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
--     INSERT INTO user_roles (user_id, role_id)
--     VALUES (v_user_id, v_role_id)
--     ON CONFLICT (user_id, role_id) DO NOTHING;
--   END IF;
-- END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- View all roles
-- SELECT * FROM roles ORDER BY name;

-- View all permissions
-- SELECT * FROM permissions ORDER BY resource, action;

-- View role-permission mappings
-- SELECT
--   r.name as role_name,
--   p.name as permission_name,
--   p.resource,
--   p.action
-- FROM role_permissions rp
-- JOIN roles r ON rp.role_id = r.id
-- JOIN permissions p ON rp.permission_id = p.id
-- ORDER BY r.name, p.resource, p.action;
