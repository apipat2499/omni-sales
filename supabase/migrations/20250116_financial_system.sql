-- Financial System Database Schema
-- This migration creates all necessary tables and views for advanced financial reporting
-- Includes: Expenses, Categories, Vendors, and Financial Views

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Expense Categories Table
-- Categorize expenses for better tracking and reporting
-- ============================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category_type VARCHAR(50) NOT NULL, -- 'operating', 'cogs', 'capital', 'tax', 'other'
  parent_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Indexes for expense_categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_type ON expense_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);

-- Insert default expense categories
INSERT INTO expense_categories (name, description, category_type) VALUES
  ('Cost of Goods Sold', 'Direct costs of producing goods', 'cogs'),
  ('Inventory Purchases', 'Raw materials and inventory', 'cogs'),
  ('Shipping & Fulfillment', 'Delivery and shipping costs', 'cogs'),
  ('Payment Processing', 'Credit card and payment fees', 'cogs'),

  ('Salaries & Wages', 'Employee compensation', 'operating'),
  ('Rent & Utilities', 'Office and warehouse expenses', 'operating'),
  ('Marketing & Advertising', 'Promotional expenses', 'operating'),
  ('Software & Subscriptions', 'SaaS and tools', 'operating'),
  ('Insurance', 'Business insurance', 'operating'),
  ('Professional Services', 'Legal, accounting, consulting', 'operating'),
  ('Office Supplies', 'General office expenses', 'operating'),
  ('Travel & Entertainment', 'Business travel', 'operating'),
  ('Telecommunications', 'Phone and internet', 'operating'),

  ('Equipment', 'Computers, furniture, machinery', 'capital'),
  ('Property', 'Real estate purchases', 'capital'),

  ('Income Tax', 'Corporate income tax', 'tax'),
  ('Sales Tax', 'Sales tax collected and paid', 'tax'),
  ('Payroll Tax', 'Employer payroll taxes', 'tax'),

  ('Interest Expense', 'Loan and credit interest', 'other'),
  ('Bank Fees', 'Banking charges', 'other'),
  ('Miscellaneous', 'Other expenses', 'other')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Vendors Table
-- Track vendors/suppliers for expense management
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(100),
  payment_terms VARCHAR(100), -- 'Net 30', 'Net 60', 'Due on receipt', etc.
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vendors
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);

-- ============================================
-- Expenses Table
-- Record all business expenses
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  reference_number VARCHAR(100), -- Invoice number, receipt number
  payment_method VARCHAR(50), -- 'credit_card', 'bank_transfer', 'cash', 'check'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  paid_date DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(50), -- 'monthly', 'quarterly', 'annually'
  next_occurrence_date DATE,
  is_tax_deductible BOOLEAN DEFAULT TRUE,
  tax_category VARCHAR(100), -- For tax reporting
  attachments JSONB, -- Store file URLs/paths
  notes TEXT,
  created_by UUID, -- Reference to user who created
  approved_by UUID, -- Reference to user who approved
  approved_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID, -- Multi-tenancy support
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(is_recurring);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);

-- ============================================
-- Revenue Summary View
-- Aggregated revenue data for financial reporting
-- ============================================
CREATE OR REPLACE VIEW revenue_summary_view AS
SELECT
  DATE_TRUNC('month', o.created_at) as period_month,
  DATE_TRUNC('quarter', o.created_at) as period_quarter,
  DATE_TRUNC('year', o.created_at) as period_year,
  o.status as order_status,
  o.payment_status,
  COUNT(DISTINCT o.id) as order_count,
  COUNT(DISTINCT o.user_id) as customer_count,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value,
  SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN o.payment_status = 'pending' THEN o.total_amount ELSE 0 END) as pending_revenue,
  SUM(CASE WHEN o.payment_status = 'failed' THEN o.total_amount ELSE 0 END) as failed_revenue
FROM orders o
GROUP BY
  DATE_TRUNC('month', o.created_at),
  DATE_TRUNC('quarter', o.created_at),
  DATE_TRUNC('year', o.created_at),
  o.status,
  o.payment_status;

-- ============================================
-- Expense Summary View
-- Aggregated expense data for financial reporting
-- ============================================
CREATE OR REPLACE VIEW expense_summary_view AS
SELECT
  DATE_TRUNC('month', e.expense_date) as period_month,
  DATE_TRUNC('quarter', e.expense_date) as period_quarter,
  DATE_TRUNC('year', e.expense_date) as period_year,
  ec.category_type,
  ec.name as category_name,
  COUNT(e.id) as expense_count,
  SUM(e.amount) as total_amount,
  AVG(e.amount) as avg_amount,
  SUM(CASE WHEN e.payment_status = 'paid' THEN e.amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN e.payment_status = 'pending' THEN e.amount ELSE 0 END) as pending_amount,
  SUM(CASE WHEN e.is_tax_deductible THEN e.amount ELSE 0 END) as tax_deductible_amount
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
GROUP BY
  DATE_TRUNC('month', e.expense_date),
  DATE_TRUNC('quarter', e.expense_date),
  DATE_TRUNC('year', e.expense_date),
  ec.category_type,
  ec.name;

-- ============================================
-- Profit Analysis View
-- Combined revenue and expense for P&L analysis
-- ============================================
CREATE OR REPLACE VIEW profit_analysis_view AS
WITH revenue AS (
  SELECT
    DATE_TRUNC('month', created_at) as period,
    SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as revenue
  FROM orders
  GROUP BY DATE_TRUNC('month', created_at)
),
cogs AS (
  SELECT
    DATE_TRUNC('month', expense_date) as period,
    SUM(amount) as cogs
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE ec.category_type = 'cogs' AND e.payment_status = 'paid'
  GROUP BY DATE_TRUNC('month', expense_date)
),
operating_expenses AS (
  SELECT
    DATE_TRUNC('month', expense_date) as period,
    SUM(amount) as operating_expenses
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE ec.category_type = 'operating' AND e.payment_status = 'paid'
  GROUP BY DATE_TRUNC('month', expense_date)
),
other_expenses AS (
  SELECT
    DATE_TRUNC('month', expense_date) as period,
    SUM(amount) as other_expenses
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE ec.category_type IN ('other', 'tax') AND e.payment_status = 'paid'
  GROUP BY DATE_TRUNC('month', expense_date)
)
SELECT
  COALESCE(r.period, c.period, oe.period, ot.period) as period,
  COALESCE(r.revenue, 0) as revenue,
  COALESCE(c.cogs, 0) as cogs,
  COALESCE(r.revenue, 0) - COALESCE(c.cogs, 0) as gross_profit,
  ROUND((COALESCE(r.revenue, 0) - COALESCE(c.cogs, 0)) / NULLIF(COALESCE(r.revenue, 0), 0) * 100, 2) as gross_margin_pct,
  COALESCE(oe.operating_expenses, 0) as operating_expenses,
  COALESCE(r.revenue, 0) - COALESCE(c.cogs, 0) - COALESCE(oe.operating_expenses, 0) as operating_profit,
  ROUND((COALESCE(r.revenue, 0) - COALESCE(c.cogs, 0) - COALESCE(oe.operating_expenses, 0)) / NULLIF(COALESCE(r.revenue, 0), 0) * 100, 2) as operating_margin_pct,
  COALESCE(ot.other_expenses, 0) as other_expenses,
  COALESCE(r.revenue, 0) - COALESCE(c.cogs, 0) - COALESCE(oe.operating_expenses, 0) - COALESCE(ot.other_expenses, 0) as net_profit,
  ROUND((COALESCE(r.revenue, 0) - COALESCE(c.cogs, 0) - COALESCE(oe.operating_expenses, 0) - COALESCE(ot.other_expenses, 0)) / NULLIF(COALESCE(r.revenue, 0), 0) * 100, 2) as net_margin_pct
FROM revenue r
FULL OUTER JOIN cogs c ON r.period = c.period
FULL OUTER JOIN operating_expenses oe ON COALESCE(r.period, c.period) = oe.period
FULL OUTER JOIN other_expenses ot ON COALESCE(r.period, c.period, oe.period) = ot.period
ORDER BY period DESC;

-- ============================================
-- Cash Flow View
-- Cash flow analysis by category
-- ============================================
CREATE OR REPLACE VIEW cash_flow_view AS
WITH cash_inflows AS (
  SELECT
    DATE_TRUNC('month', created_at) as period,
    SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as operating_inflow
  FROM orders
  GROUP BY DATE_TRUNC('month', created_at)
),
cash_outflows_operating AS (
  SELECT
    DATE_TRUNC('month', expense_date) as period,
    SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) as operating_outflow
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE ec.category_type IN ('cogs', 'operating')
  GROUP BY DATE_TRUNC('month', expense_date)
),
cash_outflows_investing AS (
  SELECT
    DATE_TRUNC('month', expense_date) as period,
    SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) as investing_outflow
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE ec.category_type = 'capital'
  GROUP BY DATE_TRUNC('month', expense_date)
),
cash_outflows_financing AS (
  SELECT
    DATE_TRUNC('month', expense_date) as period,
    SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) as financing_outflow
  FROM expenses e
  JOIN expense_categories ec ON e.category_id = ec.id
  WHERE ec.category_type IN ('other', 'tax')
  GROUP BY DATE_TRUNC('month', expense_date)
)
SELECT
  COALESCE(ci.period, coo.period, coi.period, cof.period) as period,
  COALESCE(ci.operating_inflow, 0) as operating_inflow,
  COALESCE(coo.operating_outflow, 0) as operating_outflow,
  COALESCE(ci.operating_inflow, 0) - COALESCE(coo.operating_outflow, 0) as net_operating_cash_flow,
  COALESCE(coi.investing_outflow, 0) as investing_outflow,
  0 as investing_inflow, -- Placeholder for future investment income
  0 - COALESCE(coi.investing_outflow, 0) as net_investing_cash_flow,
  COALESCE(cof.financing_outflow, 0) as financing_outflow,
  0 as financing_inflow, -- Placeholder for future loans/investments
  0 - COALESCE(cof.financing_outflow, 0) as net_financing_cash_flow,
  COALESCE(ci.operating_inflow, 0) - COALESCE(coo.operating_outflow, 0) - COALESCE(coi.investing_outflow, 0) - COALESCE(cof.financing_outflow, 0) as net_cash_flow
FROM cash_inflows ci
FULL OUTER JOIN cash_outflows_operating coo ON ci.period = coo.period
FULL OUTER JOIN cash_outflows_investing coi ON COALESCE(ci.period, coo.period) = coi.period
FULL OUTER JOIN cash_outflows_financing cof ON COALESCE(ci.period, coo.period, coi.period) = cof.period
ORDER BY period DESC;

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
DROP TRIGGER IF EXISTS update_expense_categories_updated_at ON expense_categories;
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view expense categories" ON expense_categories;
CREATE POLICY "Anyone can view expense categories"
  ON expense_categories FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Service role can manage expense categories" ON expense_categories;
CREATE POLICY "Service role can manage expense categories"
  ON expense_categories FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for vendors (authenticated users can view, service role manages)
DROP POLICY IF EXISTS "Authenticated users can view vendors" ON vendors;
CREATE POLICY "Authenticated users can view vendors"
  ON vendors FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage vendors" ON vendors;
CREATE POLICY "Service role can manage vendors"
  ON vendors FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for expenses (users see their own, service role sees all)
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = created_by OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can create their own expenses" ON expenses;
CREATE POLICY "Users can create their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Service role can manage all expenses" ON expenses;
CREATE POLICY "Service role can manage all expenses"
  ON expenses FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE expense_categories IS 'Categories for organizing business expenses';
COMMENT ON TABLE vendors IS 'Vendors and suppliers for expense tracking';
COMMENT ON TABLE expenses IS 'All business expenses with categorization and tracking';
COMMENT ON VIEW revenue_summary_view IS 'Aggregated revenue metrics for financial reporting';
COMMENT ON VIEW expense_summary_view IS 'Aggregated expense metrics for financial reporting';
COMMENT ON VIEW profit_analysis_view IS 'Profit & Loss analysis combining revenue and expenses';
COMMENT ON VIEW cash_flow_view IS 'Cash flow statement by operating, investing, and financing activities';

-- ============================================
-- Grant permissions
-- ============================================
GRANT ALL ON expense_categories TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT ALL ON expenses TO authenticated;
GRANT SELECT ON revenue_summary_view TO authenticated;
GRANT SELECT ON expense_summary_view TO authenticated;
GRANT SELECT ON profit_analysis_view TO authenticated;
GRANT SELECT ON cash_flow_view TO authenticated;
