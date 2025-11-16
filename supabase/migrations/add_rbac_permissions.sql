-- Migration: Add Permissions Table
-- Description: Defines granular permissions for RBAC system
-- Permissions: create, read, update, delete, bulk_edit

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique permission per resource-action combination
  UNIQUE(resource, action)
);

-- Create indexes for permission lookups
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique permission per role
  UNIQUE(role_id, permission_id)
);

-- Create indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Enable RLS on permissions table
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on role_permissions table
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions table
-- All authenticated users can read permissions
CREATE POLICY "Allow authenticated users to read permissions" ON permissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only owners can manage permissions
CREATE POLICY "Only owners can manage permissions" ON permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'owner'
    )
  );

-- RLS Policies for role_permissions table
-- All authenticated users can read role permissions
CREATE POLICY "Allow authenticated users to read role permissions" ON role_permissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only owners can manage role permissions
CREATE POLICY "Only owners can manage role permissions" ON role_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'owner'
    )
  );

-- Add trigger to permissions table
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(
  user_id UUID,
  required_permission VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = has_permission.user_id
    AND p.name = required_permission
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TABLE(role_name VARCHAR, role_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.id
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = get_user_role.user_id
  AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
  ORDER BY
    CASE r.name
      WHEN 'owner' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'staff' THEN 3
      WHEN 'viewer' THEN 4
      ELSE 5
    END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
