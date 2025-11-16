-- Multi-Tenant Architecture Migration
-- Creates tables and RLS policies for multi-tenant support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  custom_domain VARCHAR(255) UNIQUE,
  domain_verification_token VARCHAR(255),
  domain_verified BOOLEAN DEFAULT FALSE,

  -- Subscription & Billing
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),

  -- Branding (JSONB for flexibility)
  branding JSONB NOT NULL DEFAULT '{
    "logo": null,
    "favicon": null,
    "primaryColor": "#3b82f6",
    "accentColor": "#8b5cf6",
    "companyName": "",
    "customNavLabels": {},
    "customPageTitles": {},
    "customFonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "removeBranding": false
  }',

  -- Email Branding
  email_branding JSONB NOT NULL DEFAULT '{
    "senderName": "",
    "replyTo": "",
    "customTemplates": false,
    "footerText": ""
  }',

  -- Features & Limits
  features JSONB NOT NULL DEFAULT '{
    "maxUsers": 5,
    "maxStorage": 1024,
    "maxOrders": 1000,
    "advancedAnalytics": false,
    "apiAccess": false,
    "customIntegrations": false,
    "prioritySupport": false,
    "whiteLabel": false,
    "customDomain": false,
    "sso": false,
    "multiCurrency": false
  }',

  -- Usage Tracking
  usage JSONB NOT NULL DEFAULT '{
    "currentUsers": 0,
    "currentStorage": 0,
    "currentOrders": 0
  }',

  -- Database Isolation Strategy
  isolation_strategy VARCHAR(50) NOT NULL DEFAULT 'shared_with_rls',

  -- Metadata
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_subscription_plan CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'inactive')),
  CONSTRAINT valid_isolation_strategy CHECK (isolation_strategy IN ('shared_with_rls', 'database_per_tenant', 'schema_per_tenant'))
);

-- Index for performance
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TENANT USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member')),
  CONSTRAINT unique_tenant_user UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON tenant_users(role);

-- ============================================
-- TENANT CONTEXT FUNCTION (for RLS)
-- ============================================
-- Store current tenant ID in session
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current tenant ID from session
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', TRUE)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if user belongs to tenant
CREATE OR REPLACE FUNCTION user_has_tenant_access(user_id UUID, tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_users.user_id = user_id
    AND tenant_users.tenant_id = tenant_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ADD TENANT_ID TO EXISTING TABLES
-- ============================================
-- Add tenant_id column to key tables for multi-tenant isolation

-- Orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);

-- Products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

-- Customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);

-- Inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants: Users can see their own tenants
CREATE POLICY tenant_select_policy ON tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Tenants: Only owners can update
CREATE POLICY tenant_update_policy ON tenants
  FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Tenants: Only system admins can delete (implement via application layer)
CREATE POLICY tenant_delete_policy ON tenants
  FOR DELETE
  USING (FALSE); -- Prevent direct deletion

-- Enable RLS on tenant_users table
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Tenant Users: Can see users in their tenant
CREATE POLICY tenant_users_select_policy ON tenant_users
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Tenant Users: Owners and admins can insert
CREATE POLICY tenant_users_insert_policy ON tenant_users
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Tenant Users: Owners and admins can update
CREATE POLICY tenant_users_update_policy ON tenant_users
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Tenant Users: Only owners can delete
CREATE POLICY tenant_users_delete_policy ON tenant_users
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- RLS POLICIES FOR TENANT DATA ISOLATION
-- ============================================

-- Orders: Users can only see orders from their tenant
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant_isolation_policy ON orders
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Products: Tenant isolation
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_isolation_policy ON products
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Customers: Tenant isolation
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_tenant_isolation_policy ON customers
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- Inventory: Tenant isolation
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_tenant_isolation_policy ON inventory
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TENANT INVITATION SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_invitation_role CHECK (role IN ('admin', 'member'))
);

CREATE INDEX idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX idx_tenant_invitations_email ON tenant_invitations(email);

-- ============================================
-- TENANT BILLING HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_billing_status CHECK (status IN ('pending', 'paid', 'failed', 'refunded'))
);

CREATE INDEX idx_tenant_billing_tenant_id ON tenant_billing_history(tenant_id);
CREATE INDEX idx_tenant_billing_status ON tenant_billing_history(status);

-- ============================================
-- TENANT ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenant_activity_tenant_id ON tenant_activity_log(tenant_id);
CREATE INDEX idx_tenant_activity_user_id ON tenant_activity_log(user_id);
CREATE INDEX idx_tenant_activity_created_at ON tenant_activity_log(created_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's tenants
CREATE OR REPLACE FUNCTION get_user_tenants(user_id UUID)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name VARCHAR,
  role VARCHAR,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    tu.role,
    tu.joined_at
  FROM tenants t
  INNER JOIN tenant_users tu ON t.id = tu.tenant_id
  WHERE tu.user_id = user_id
  AND t.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

-- Update tenant usage
CREATE OR REPLACE FUNCTION update_tenant_usage(
  tenant_id UUID,
  usage_type VARCHAR,
  increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE tenants
  SET usage = jsonb_set(
    usage,
    ARRAY[usage_type],
    to_jsonb((usage->>usage_type)::INTEGER + increment)
  ),
  updated_at = NOW()
  WHERE id = tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Log tenant activity
CREATE OR REPLACE FUNCTION log_tenant_activity(
  p_tenant_id UUID,
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tenant_activity_log (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON tenant_users TO authenticated;
GRANT ALL ON tenant_invitations TO authenticated;
GRANT ALL ON tenant_billing_history TO authenticated;
GRANT ALL ON tenant_activity_log TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION set_tenant_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_id TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_tenant_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tenants TO authenticated;
GRANT EXECUTE ON FUNCTION update_tenant_usage TO authenticated;
GRANT EXECUTE ON FUNCTION log_tenant_activity TO authenticated;

COMMENT ON TABLE tenants IS 'Multi-tenant configuration and settings';
COMMENT ON TABLE tenant_users IS 'Users belonging to tenants with their roles';
COMMENT ON TABLE tenant_invitations IS 'Pending invitations to join tenants';
COMMENT ON TABLE tenant_billing_history IS 'Billing and invoice history per tenant';
COMMENT ON TABLE tenant_activity_log IS 'Activity and audit log per tenant';
