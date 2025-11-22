-- Email Queue and Logging Functions
-- These functions handle email queue management and logging

-- Function to create email queue entry
CREATE OR REPLACE FUNCTION create_email_queue(
  p_user_id UUID,
  p_recipient_email VARCHAR,
  p_recipient_name VARCHAR DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_subject VARCHAR DEFAULT NULL,
  p_html_content TEXT DEFAULT NULL,
  p_text_content TEXT DEFAULT NULL,
  p_variables JSONB DEFAULT '{}',
  p_campaign_id UUID DEFAULT NULL,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_related_order_id UUID DEFAULT NULL,
  p_related_customer_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO email_queue (
    user_id,
    recipient_email,
    recipient_name,
    template_id,
    subject,
    html_content,
    text_content,
    variables,
    campaign_id,
    status,
    scheduled_for,
    related_order_id,
    related_customer_id,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_recipient_email,
    p_recipient_name,
    p_template_id,
    p_subject,
    p_html_content,
    p_text_content,
    p_variables,
    p_campaign_id,
    'pending',
    COALESCE(p_scheduled_for, CURRENT_TIMESTAMP),
    p_related_order_id,
    p_related_customer_id,
    p_metadata,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update email queue status
CREATE OR REPLACE FUNCTION update_email_queue_status(
  p_queue_id UUID,
  p_status VARCHAR,
  p_error_message TEXT DEFAULT NULL,
  p_provider_id VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE email_queue
  SET
    status = p_status,
    error_message = COALESCE(p_error_message, error_message),
    retry_count = CASE
      WHEN p_status = 'failed' THEN retry_count + 1
      ELSE retry_count
    END,
    sent_at = CASE
      WHEN p_status = 'sent' THEN CURRENT_TIMESTAMP
      ELSE sent_at
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_queue_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to create email log entry
CREATE OR REPLACE FUNCTION create_email_log(
  p_user_id UUID,
  p_recipient_email VARCHAR,
  p_recipient_name VARCHAR DEFAULT NULL,
  p_subject VARCHAR DEFAULT NULL,
  p_template_type VARCHAR DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL,
  p_status VARCHAR DEFAULT 'pending',
  p_provider VARCHAR DEFAULT NULL,
  p_provider_id VARCHAR DEFAULT NULL,
  p_related_order_id UUID DEFAULT NULL,
  p_related_customer_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_html_content TEXT DEFAULT NULL,
  p_text_content TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO email_logs (
    user_id,
    recipient_email,
    recipient_name,
    subject,
    template_type,
    template_id,
    campaign_id,
    status,
    provider,
    provider_id,
    related_order_id,
    related_customer_id,
    metadata,
    html_content,
    text_content,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_recipient_email,
    p_recipient_name,
    p_subject,
    p_template_type,
    p_template_id,
    p_campaign_id,
    p_status,
    p_provider,
    p_provider_id,
    p_related_order_id,
    p_related_customer_id,
    p_metadata,
    p_html_content,
    p_text_content,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update email log status
CREATE OR REPLACE FUNCTION update_email_log_status(
  p_log_id UUID,
  p_status VARCHAR,
  p_error_message TEXT DEFAULT NULL,
  p_bounced_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE email_logs
  SET
    status = p_status,
    error_message = COALESCE(p_error_message, error_message),
    bounced = CASE WHEN p_status = 'bounced' THEN true ELSE bounced END,
    bounced_reason = COALESCE(p_bounced_reason, bounced_reason),
    sent_at = CASE
      WHEN p_status = 'sent' THEN COALESCE(sent_at, CURRENT_TIMESTAMP)
      ELSE sent_at
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_log_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to track email open
CREATE OR REPLACE FUNCTION track_email_open(
  p_log_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE email_logs
  SET
    opened = true,
    opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_log_id AND NOT opened;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to track email click
CREATE OR REPLACE FUNCTION track_email_click(
  p_log_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE email_logs
  SET
    clicked = true,
    clicked_at = COALESCE(clicked_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_log_id AND NOT clicked;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending emails from queue
CREATE OR REPLACE FUNCTION get_pending_emails(
  p_limit INTEGER DEFAULT 100,
  p_max_retries INTEGER DEFAULT 3
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  recipient_email VARCHAR,
  recipient_name VARCHAR,
  template_id UUID,
  subject VARCHAR,
  html_content TEXT,
  text_content TEXT,
  variables JSONB,
  campaign_id UUID,
  retry_count INTEGER,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  related_order_id UUID,
  related_customer_id UUID,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    eq.id,
    eq.user_id,
    eq.recipient_email,
    eq.recipient_name,
    eq.template_id,
    eq.subject,
    eq.html_content,
    eq.text_content,
    eq.variables,
    eq.campaign_id,
    eq.retry_count,
    eq.scheduled_for,
    eq.related_order_id,
    eq.related_customer_id,
    eq.metadata
  FROM email_queue eq
  WHERE eq.status = 'pending'
    AND eq.retry_count < p_max_retries
    AND eq.scheduled_for <= CURRENT_TIMESTAMP
  ORDER BY eq.scheduled_for ASC, eq.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get email statistics for a user
CREATE OR REPLACE FUNCTION get_email_stats(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS TABLE (
  total_sent BIGINT,
  total_opened BIGINT,
  total_clicked BIGINT,
  total_bounced BIGINT,
  total_failed BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  bounce_rate NUMERIC
) AS $$
DECLARE
  v_total_sent BIGINT;
  v_total_opened BIGINT;
  v_total_clicked BIGINT;
  v_total_bounced BIGINT;
  v_total_failed BIGINT;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'sent'),
    COUNT(*) FILTER (WHERE opened = true),
    COUNT(*) FILTER (WHERE clicked = true),
    COUNT(*) FILTER (WHERE bounced = true),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO
    v_total_sent,
    v_total_opened,
    v_total_clicked,
    v_total_bounced,
    v_total_failed
  FROM email_logs
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);

  RETURN QUERY SELECT
    v_total_sent,
    v_total_opened,
    v_total_clicked,
    v_total_bounced,
    v_total_failed,
    CASE WHEN v_total_sent > 0
      THEN ROUND((v_total_opened::NUMERIC / v_total_sent::NUMERIC) * 100, 2)
      ELSE 0
    END,
    CASE WHEN v_total_sent > 0
      THEN ROUND((v_total_clicked::NUMERIC / v_total_sent::NUMERIC) * 100, 2)
      ELSE 0
    END,
    CASE WHEN v_total_sent > 0
      THEN ROUND((v_total_bounced::NUMERIC / v_total_sent::NUMERIC) * 100, 2)
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Add missing columns to email_queue if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_queue' AND column_name = 'text_content'
  ) THEN
    ALTER TABLE email_queue ADD COLUMN text_content TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_queue' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE email_queue ADD COLUMN campaign_id UUID REFERENCES email_campaigns(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_queue' AND column_name = 'related_customer_id'
  ) THEN
    ALTER TABLE email_queue ADD COLUMN related_customer_id UUID REFERENCES customers(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_queue' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE email_queue ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add missing columns to email_logs if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'html_content'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN html_content TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'text_content'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN text_content TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN error_message TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN template_id UUID REFERENCES email_templates(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN campaign_id UUID REFERENCES email_campaigns(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled
  ON email_queue(status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_queue_user_id
  ON email_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id
  ON email_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_status
  ON email_logs(status);

CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id
  ON email_logs(campaign_id)
  WHERE campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at
  ON email_logs(created_at DESC);

-- Comments for documentation
COMMENT ON FUNCTION create_email_queue IS 'Creates a new email queue entry for sending';
COMMENT ON FUNCTION update_email_queue_status IS 'Updates the status of an email in the queue';
COMMENT ON FUNCTION create_email_log IS 'Creates a new email log entry for tracking';
COMMENT ON FUNCTION update_email_log_status IS 'Updates the status of an email log';
COMMENT ON FUNCTION track_email_open IS 'Tracks when an email is opened';
COMMENT ON FUNCTION track_email_click IS 'Tracks when an email link is clicked';
COMMENT ON FUNCTION get_pending_emails IS 'Retrieves pending emails from queue for processing';
COMMENT ON FUNCTION get_email_stats IS 'Gets email statistics for a user within a date range';
