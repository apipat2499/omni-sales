-- Email Workflow Automation System
-- Migration: 20250116_email_workflows.sql

-- Email Workflows Table
CREATE TABLE IF NOT EXISTS email_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_type VARCHAR(100) NOT NULL,
  trigger_config JSONB DEFAULT '{}',

  -- Workflow metadata
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,

  -- Analytics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,

  -- Settings
  is_template BOOLEAN DEFAULT FALSE,
  template_category VARCHAR(100),
  max_concurrent_executions INTEGER DEFAULT 100,
  execution_timeout_seconds INTEGER DEFAULT 3600,

  CONSTRAINT unique_workflow_name_per_tenant UNIQUE (tenant_id, name)
);

-- Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES email_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type VARCHAR(100) NOT NULL CHECK (step_type IN (
    'send_email', 'wait', 'delay', 'send_sms', 'create_task',
    'add_tag', 'update_field', 'condition', 'branch', 'end'
  )),
  step_name VARCHAR(255) NOT NULL,
  step_config JSONB DEFAULT '{}',

  -- Visual position for drag-drop UI
  position_x INTEGER,
  position_y INTEGER,

  -- Connections
  next_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  condition_true_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  condition_false_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,

  -- Settings
  is_enabled BOOLEAN DEFAULT TRUE,
  retry_on_failure BOOLEAN DEFAULT TRUE,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 300,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_step_order UNIQUE (workflow_id, step_order)
);

-- Workflow Triggers Table
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES email_workflows(id) ON DELETE CASCADE,
  trigger_type VARCHAR(100) NOT NULL CHECK (trigger_type IN (
    -- Order triggers
    'order_created', 'order_paid', 'order_shipped', 'order_completed', 'order_refunded', 'order_cancelled',
    -- Customer triggers
    'customer_signup', 'customer_birthday', 'customer_anniversary',
    -- Behavioral triggers
    'cart_abandoned', 'wishlist_viewed', 'price_drop', 'product_back_in_stock',
    -- Time triggers
    'scheduled_time', 'recurring_schedule',
    -- Manual triggers
    'manual_trigger'
  )),
  trigger_config JSONB DEFAULT '{}',

  -- Filters/Conditions
  filter_conditions JSONB DEFAULT '{}',

  -- Schedule (for time-based triggers)
  schedule_cron VARCHAR(100),
  schedule_timezone VARCHAR(100) DEFAULT 'UTC',
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Executions Table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES email_workflows(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES workflow_triggers(id) ON DELETE SET NULL,

  -- Execution details
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Context
  execution_context JSONB DEFAULT '{}', -- Store customer_id, order_id, etc.
  current_step_id UUID REFERENCES workflow_steps(id),

  -- Results
  steps_completed INTEGER DEFAULT 0,
  steps_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_stack TEXT,

  -- Metrics
  emails_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Step Executions Table (detailed step tracking)
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,

  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Results
  result_data JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- For wait/delay steps
  resume_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Analytics Table
CREATE TABLE IF NOT EXISTS workflow_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES email_workflows(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,

  -- Tracking
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
    'email_sent', 'email_delivered', 'email_opened', 'email_clicked', 'email_bounced', 'email_complained',
    'sms_sent', 'sms_delivered', 'sms_failed',
    'conversion', 'revenue'
  )),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Email specific
  email_id UUID,
  recipient_email VARCHAR(255),

  -- Conversion tracking
  order_id UUID,
  revenue_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'THB',

  -- Additional data
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Templates Table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,

  -- Template data
  workflow_config JSONB NOT NULL,
  steps_config JSONB NOT NULL,
  triggers_config JSONB NOT NULL,

  -- Metadata
  preview_image_url TEXT,
  estimated_setup_time INTEGER, -- in minutes
  difficulty_level VARCHAR(50) DEFAULT 'beginner',

  -- Usage stats
  install_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_workflows_tenant ON email_workflows(tenant_id);
CREATE INDEX idx_email_workflows_status ON email_workflows(status);
CREATE INDEX idx_email_workflows_trigger_type ON email_workflows(trigger_type);

CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_order ON workflow_steps(workflow_id, step_order);

CREATE INDEX idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_triggers_type ON workflow_triggers(trigger_type);
CREATE INDEX idx_workflow_triggers_active ON workflow_triggers(is_active);
CREATE INDEX idx_workflow_triggers_next_run ON workflow_triggers(next_run_at) WHERE is_active = TRUE;

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started ON workflow_executions(started_at);
CREATE INDEX idx_workflow_executions_context ON workflow_executions USING gin(execution_context);

CREATE INDEX idx_workflow_step_executions_execution ON workflow_step_executions(execution_id);
CREATE INDEX idx_workflow_step_executions_status ON workflow_step_executions(status);
CREATE INDEX idx_workflow_step_executions_resume ON workflow_step_executions(resume_at) WHERE status = 'waiting';

CREATE INDEX idx_workflow_analytics_workflow ON workflow_analytics(workflow_id);
CREATE INDEX idx_workflow_analytics_execution ON workflow_analytics(execution_id);
CREATE INDEX idx_workflow_analytics_event ON workflow_analytics(event_type);
CREATE INDEX idx_workflow_analytics_timestamp ON workflow_analytics(event_timestamp);

CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_active ON workflow_templates(is_active);

-- Add RLS policies
ALTER TABLE email_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_workflows
CREATE POLICY email_workflows_tenant_isolation ON email_workflows
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY workflow_steps_via_workflow ON workflow_steps
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM email_workflows
      WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

CREATE POLICY workflow_triggers_via_workflow ON workflow_triggers
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM email_workflows
      WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

CREATE POLICY workflow_executions_via_workflow ON workflow_executions
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM email_workflows
      WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

CREATE POLICY workflow_step_executions_via_execution ON workflow_step_executions
  FOR ALL USING (
    execution_id IN (
      SELECT id FROM workflow_executions
      WHERE workflow_id IN (
        SELECT id FROM email_workflows
        WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
      )
    )
  );

CREATE POLICY workflow_analytics_via_workflow ON workflow_analytics
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM email_workflows
      WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

CREATE POLICY workflow_templates_public_read ON workflow_templates
  FOR SELECT USING (is_active = TRUE);

-- Create functions for workflow automation

-- Function to trigger workflow execution
CREATE OR REPLACE FUNCTION trigger_workflow_execution(
  p_workflow_id UUID,
  p_trigger_id UUID,
  p_context JSONB
)
RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
  v_workflow_status VARCHAR;
BEGIN
  -- Check if workflow is active
  SELECT status INTO v_workflow_status
  FROM email_workflows
  WHERE id = p_workflow_id;

  IF v_workflow_status != 'active' THEN
    RAISE EXCEPTION 'Workflow is not active';
  END IF;

  -- Create execution record
  INSERT INTO workflow_executions (
    workflow_id,
    trigger_id,
    status,
    execution_context,
    started_at
  ) VALUES (
    p_workflow_id,
    p_trigger_id,
    'pending',
    p_context,
    NOW()
  )
  RETURNING id INTO v_execution_id;

  -- Update workflow stats
  UPDATE email_workflows
  SET total_executions = total_executions + 1,
      updated_at = NOW()
  WHERE id = p_workflow_id;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update workflow analytics
CREATE OR REPLACE FUNCTION record_workflow_event(
  p_workflow_id UUID,
  p_execution_id UUID,
  p_event_type VARCHAR,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_analytics_id UUID;
BEGIN
  INSERT INTO workflow_analytics (
    workflow_id,
    execution_id,
    event_type,
    event_timestamp,
    metadata
  ) VALUES (
    p_workflow_id,
    p_execution_id,
    p_event_type,
    NOW(),
    p_metadata
  )
  RETURNING id INTO v_analytics_id;

  RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get workflow performance metrics
CREATE OR REPLACE FUNCTION get_workflow_metrics(
  p_workflow_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  avg_execution_time INTERVAL,
  emails_sent BIGINT,
  email_open_rate DECIMAL,
  email_click_rate DECIMAL,
  conversion_rate DECIMAL,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_executions,
    COUNT(*) FILTER (WHERE we.status = 'completed')::BIGINT as successful_executions,
    COUNT(*) FILTER (WHERE we.status = 'failed')::BIGINT as failed_executions,
    AVG(we.completed_at - we.started_at) as avg_execution_time,

    COUNT(*) FILTER (WHERE wa.event_type = 'email_sent')::BIGINT as emails_sent,

    CASE
      WHEN COUNT(*) FILTER (WHERE wa.event_type = 'email_sent') > 0
      THEN (COUNT(*) FILTER (WHERE wa.event_type = 'email_opened')::DECIMAL /
            COUNT(*) FILTER (WHERE wa.event_type = 'email_sent')::DECIMAL * 100)
      ELSE 0
    END as email_open_rate,

    CASE
      WHEN COUNT(*) FILTER (WHERE wa.event_type = 'email_sent') > 0
      THEN (COUNT(*) FILTER (WHERE wa.event_type = 'email_clicked')::DECIMAL /
            COUNT(*) FILTER (WHERE wa.event_type = 'email_sent')::DECIMAL * 100)
      ELSE 0
    END as email_click_rate,

    CASE
      WHEN COUNT(*)::DECIMAL > 0
      THEN (COUNT(*) FILTER (WHERE wa.event_type = 'conversion')::DECIMAL /
            COUNT(*)::DECIMAL * 100)
      ELSE 0
    END as conversion_rate,

    COALESCE(SUM(wa.revenue_amount) FILTER (WHERE wa.event_type = 'revenue'), 0) as total_revenue

  FROM workflow_executions we
  LEFT JOIN workflow_analytics wa ON wa.execution_id = we.id
  WHERE we.workflow_id = p_workflow_id
    AND we.created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE email_workflows IS 'Stores email workflow configurations';
COMMENT ON TABLE workflow_steps IS 'Defines individual steps in a workflow';
COMMENT ON TABLE workflow_triggers IS 'Defines what triggers a workflow to start';
COMMENT ON TABLE workflow_executions IS 'Tracks each workflow execution instance';
COMMENT ON TABLE workflow_step_executions IS 'Tracks execution of individual steps';
COMMENT ON TABLE workflow_analytics IS 'Stores workflow performance analytics';
COMMENT ON TABLE workflow_templates IS 'Pre-built workflow templates for quick setup';
