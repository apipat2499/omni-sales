-- ============================================
-- WEBHOOKS SYSTEM
-- ============================================
-- This migration creates the complete webhooks system including:
-- - Webhook endpoints management
-- - Event subscriptions
-- - Delivery tracking and retry logic
-- - Dead letter queue for failures

-- Webhooks Table
-- Stores webhook endpoint configurations
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL, -- HMAC secret for signature verification
  events TEXT[] NOT NULL, -- Array of subscribed event types
  headers JSONB DEFAULT '{}', -- Custom headers to send
  is_active BOOLEAN DEFAULT true,
  retry_enabled BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  api_key VARCHAR(255), -- Optional API key for authentication
  ip_whitelist TEXT[], -- IP addresses allowed to receive webhooks
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_triggered_at TIMESTAMP WITH TIME ZONE
);

-- Webhook Events Table
-- Logs all events that trigger webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  event_type VARCHAR(100) NOT NULL, -- order.created, payment.received, etc.
  event_data JSONB NOT NULL, -- The actual event payload
  resource_id UUID, -- ID of the resource (order, customer, etc.)
  resource_type VARCHAR(50), -- Type of resource (order, customer, product, etc.)
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast event lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_resource ON webhook_events(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_triggered ON webhook_events(triggered_at);

-- Webhook Deliveries Table
-- Tracks all delivery attempts for each webhook event
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  status VARCHAR(50) NOT NULL, -- pending, success, failed, timeout
  http_status_code INTEGER,
  response_body TEXT,
  response_headers JSONB,
  error_message TEXT,
  duration_ms INTEGER, -- How long the request took
  next_retry_at TIMESTAMP WITH TIME ZONE, -- When to retry if failed
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for delivery tracking
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- Webhook Failures Table
-- Dead letter queue for permanently failed deliveries
CREATE TABLE IF NOT EXISTS webhook_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES webhook_deliveries(id) ON DELETE CASCADE,
  failure_reason TEXT NOT NULL,
  attempts_count INTEGER NOT NULL,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  can_replay BOOLEAN DEFAULT true,
  replayed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for failure tracking
CREATE INDEX IF NOT EXISTS idx_webhook_failures_webhook ON webhook_failures(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_event ON webhook_failures(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_replay ON webhook_failures(can_replay) WHERE replayed_at IS NULL;

-- Webhook Rate Limits Table
-- Track rate limiting per webhook endpoint
CREATE TABLE IF NOT EXISTS webhook_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 0,
  limit_per_window INTEGER DEFAULT 1000, -- Max requests per window
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(webhook_id, window_start)
);

-- Create index for rate limit checking
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window ON webhook_rate_limits(webhook_id, window_start, window_end);

-- Function to update webhook updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for webhooks table
DROP TRIGGER IF EXISTS update_webhooks_timestamp ON webhooks;
CREATE TRIGGER update_webhooks_timestamp
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_timestamp();

-- Function to clean old webhook events (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_events
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_stats(webhook_uuid UUID)
RETURNS TABLE (
  total_events BIGINT,
  successful_deliveries BIGINT,
  failed_deliveries BIGINT,
  pending_deliveries BIGINT,
  avg_duration_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT we.id) as total_events,
    COUNT(DISTINCT CASE WHEN wd.status = 'success' THEN wd.id END) as successful_deliveries,
    COUNT(DISTINCT CASE WHEN wd.status = 'failed' THEN wd.id END) as failed_deliveries,
    COUNT(DISTINCT CASE WHEN wd.status = 'pending' THEN wd.id END) as pending_deliveries,
    ROUND(AVG(wd.duration_ms)::NUMERIC, 2) as avg_duration_ms,
    ROUND(
      (COUNT(DISTINCT CASE WHEN wd.status = 'success' THEN wd.id END)::NUMERIC /
       NULLIF(COUNT(DISTINCT wd.id), 0) * 100), 2
    ) as success_rate
  FROM webhook_events we
  LEFT JOIN webhook_deliveries wd ON we.id = wd.event_id
  WHERE wd.webhook_id = webhook_uuid;
END;
$$ LANGUAGE plpgsql;

-- View for webhook delivery summary
CREATE OR REPLACE VIEW webhook_delivery_summary AS
SELECT
  w.id as webhook_id,
  w.name as webhook_name,
  w.url as webhook_url,
  w.is_active,
  COUNT(DISTINCT we.id) as total_events,
  COUNT(DISTINCT CASE WHEN wd.status = 'success' THEN wd.id END) as successful_deliveries,
  COUNT(DISTINCT CASE WHEN wd.status = 'failed' THEN wd.id END) as failed_deliveries,
  COUNT(DISTINCT wf.id) as permanent_failures,
  w.last_triggered_at,
  w.created_at
FROM webhooks w
LEFT JOIN webhook_deliveries wd ON w.id = wd.webhook_id
LEFT JOIN webhook_events we ON wd.event_id = we.id
LEFT JOIN webhook_failures wf ON w.id = wf.webhook_id
GROUP BY w.id, w.name, w.url, w.is_active, w.last_triggered_at, w.created_at;

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_failures ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE webhooks IS 'Stores webhook endpoint configurations and subscriptions';
COMMENT ON TABLE webhook_events IS 'Logs all events that can trigger webhooks';
COMMENT ON TABLE webhook_deliveries IS 'Tracks all delivery attempts with retry logic';
COMMENT ON TABLE webhook_failures IS 'Dead letter queue for permanently failed deliveries';
COMMENT ON TABLE webhook_rate_limits IS 'Rate limiting tracking per webhook endpoint';
COMMENT ON FUNCTION get_webhook_stats IS 'Returns comprehensive statistics for a webhook endpoint';
COMMENT ON VIEW webhook_delivery_summary IS 'Summary view of webhook delivery performance';
