-- Custom Reports Database Schema
-- Tables for custom report builder with scheduling and delivery

-- Custom Reports Table (save report definitions)
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Report Configuration
  dimensions JSONB NOT NULL DEFAULT '[]', -- [{ field: "date", label: "Date", type: "date" }]
  metrics JSONB NOT NULL DEFAULT '[]', -- [{ field: "revenue", label: "Revenue", aggregation: "sum" }]
  filters JSONB DEFAULT '[]', -- [{ field: "status", operator: "equals", value: "completed" }]
  sorting JSONB DEFAULT '[]', -- [{ field: "date", direction: "desc" }]
  grouping JSONB DEFAULT '[]', -- [{ field: "category" }]

  -- Visualization
  chart_type VARCHAR(50) DEFAULT 'table', -- table, bar, line, pie, area
  chart_config JSONB DEFAULT '{}', -- Chart-specific configuration

  -- Template
  is_template BOOLEAN DEFAULT false,
  template_category VARCHAR(100), -- sales, customer, financial, operational

  -- Metadata
  is_favorite BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  share_token VARCHAR(100),
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Schedules Table (scheduled reports)
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,

  -- Schedule Configuration
  frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly, custom
  schedule_time TIME, -- Time of day to run (e.g., 09:00:00)
  day_of_week INTEGER, -- 0-6 for weekly (0 = Sunday)
  day_of_month INTEGER, -- 1-31 for monthly
  timezone VARCHAR(100) DEFAULT 'UTC',
  cron_expression VARCHAR(100), -- For custom schedules

  -- Delivery Configuration
  delivery_method VARCHAR(50) NOT NULL DEFAULT 'email', -- email, slack, webhook
  delivery_config JSONB NOT NULL DEFAULT '{}', -- { email: ["user@example.com"], format: "pdf" }

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Exports Table (generated reports)
CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  report_id UUID REFERENCES custom_reports(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,

  -- Export Details
  export_format VARCHAR(50) NOT NULL, -- pdf, excel, csv, json
  file_path VARCHAR(500), -- Path to stored file
  file_url VARCHAR(500), -- URL to download
  file_size INTEGER, -- File size in bytes

  -- Report Data (for quick preview)
  data_preview JSONB, -- First 100 rows
  row_count INTEGER,

  -- Execution
  execution_time INTEGER, -- Milliseconds
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,

  -- Filters applied during generation
  filters_applied JSONB,
  date_range JSONB, -- { start: "2025-01-01", end: "2025-01-31" }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Report Favorites Table (user favorites)
CREATE TABLE IF NOT EXISTS report_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,

  -- Sort order
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, report_id)
);

-- Report Templates (pre-built templates)
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- sales, customer, financial, operational, product

  -- Template Configuration (same as custom_reports)
  dimensions JSONB NOT NULL DEFAULT '[]',
  metrics JSONB NOT NULL DEFAULT '[]',
  filters JSONB DEFAULT '[]',
  sorting JSONB DEFAULT '[]',
  grouping JSONB DEFAULT '[]',

  -- Visualization
  chart_type VARCHAR(50) DEFAULT 'table',
  chart_config JSONB DEFAULT '{}',

  -- Template Metadata
  thumbnail_url VARCHAR(500),
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_is_template ON custom_reports(is_template);
CREATE INDEX IF NOT EXISTS idx_custom_reports_template_category ON custom_reports(template_category);
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_at ON custom_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_schedules_user_id ON report_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_report_id ON report_schedules(report_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run_at ON report_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON report_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_report_exports_user_id ON report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_report_id ON report_exports(report_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_created_at ON report_exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_exports_status ON report_exports(status);

CREATE INDEX IF NOT EXISTS idx_report_favorites_user_id ON report_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_report_favorites_report_id ON report_favorites(report_id);

CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_featured ON report_templates(is_featured);

-- Insert default report templates
INSERT INTO report_templates (name, description, category, dimensions, metrics, sorting, chart_type, is_featured, tags) VALUES
-- Sales by Category
('Sales by Category', 'Analyze revenue and orders by product category', 'sales',
  '[{"field": "category", "label": "Category", "type": "string"}]'::jsonb,
  '[{"field": "revenue", "label": "Revenue", "aggregation": "sum", "format": "currency"}, {"field": "orders", "label": "Orders", "aggregation": "count"}]'::jsonb,
  '[{"field": "revenue", "direction": "desc"}]'::jsonb,
  'bar', true, ARRAY['sales', 'category', 'revenue']),

-- Revenue by Channel
('Revenue by Channel', 'Compare sales performance across different channels', 'sales',
  '[{"field": "channel", "label": "Channel", "type": "string"}]'::jsonb,
  '[{"field": "revenue", "label": "Revenue", "aggregation": "sum", "format": "currency"}, {"field": "orders", "label": "Orders", "aggregation": "count"}, {"field": "avg_order_value", "label": "Avg Order Value", "aggregation": "avg", "format": "currency"}]'::jsonb,
  '[{"field": "revenue", "direction": "desc"}]'::jsonb,
  'pie', true, ARRAY['sales', 'channel', 'revenue']),

-- Customer Acquisition Cost
('Customer Acquisition Cost', 'Track CAC and customer acquisition metrics', 'customer',
  '[{"field": "date", "label": "Date", "type": "date", "granularity": "month"}]'::jsonb,
  '[{"field": "new_customers", "label": "New Customers", "aggregation": "count"}, {"field": "marketing_spend", "label": "Marketing Spend", "aggregation": "sum", "format": "currency"}, {"field": "cac", "label": "CAC", "aggregation": "avg", "format": "currency"}]'::jsonb,
  '[{"field": "date", "direction": "asc"}]'::jsonb,
  'line', true, ARRAY['customer', 'cac', 'acquisition']),

-- Product Performance
('Product Performance', 'Detailed product performance metrics', 'product',
  '[{"field": "product_name", "label": "Product", "type": "string"}]'::jsonb,
  '[{"field": "units_sold", "label": "Units Sold", "aggregation": "sum"}, {"field": "revenue", "label": "Revenue", "aggregation": "sum", "format": "currency"}, {"field": "profit", "label": "Profit", "aggregation": "sum", "format": "currency"}, {"field": "profit_margin", "label": "Profit Margin", "aggregation": "avg", "format": "percentage"}]'::jsonb,
  '[{"field": "revenue", "direction": "desc"}]'::jsonb,
  'table', true, ARRAY['product', 'performance', 'revenue']),

-- Daily Sales Summary
('Daily Sales Summary', 'Daily overview of sales metrics', 'sales',
  '[{"field": "date", "label": "Date", "type": "date", "granularity": "day"}]'::jsonb,
  '[{"field": "revenue", "label": "Revenue", "aggregation": "sum", "format": "currency"}, {"field": "orders", "label": "Orders", "aggregation": "count"}, {"field": "avg_order_value", "label": "AOV", "aggregation": "avg", "format": "currency"}, {"field": "unique_customers", "label": "Customers", "aggregation": "count_distinct"}]'::jsonb,
  '[{"field": "date", "direction": "desc"}]'::jsonb,
  'area', true, ARRAY['sales', 'daily', 'summary']);

-- Add updated_at trigger for custom_reports
CREATE OR REPLACE FUNCTION update_custom_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_reports_updated_at_trigger
BEFORE UPDATE ON custom_reports
FOR EACH ROW
EXECUTE FUNCTION update_custom_reports_updated_at();

-- Add updated_at trigger for report_schedules
CREATE OR REPLACE FUNCTION update_report_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_schedules_updated_at_trigger
BEFORE UPDATE ON report_schedules
FOR EACH ROW
EXECUTE FUNCTION update_report_schedules_updated_at();

-- Add updated_at trigger for report_templates
CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_templates_updated_at_trigger
BEFORE UPDATE ON report_templates
FOR EACH ROW
EXECUTE FUNCTION update_report_templates_updated_at();
