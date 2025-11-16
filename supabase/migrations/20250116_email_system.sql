-- Email System Migration
-- Multi-provider email functionality with SendGrid, Mailgun, and Nodemailer

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables TEXT[], -- Array of variable names like ['customer_name', 'order_id']
  category VARCHAR(50) DEFAULT 'custom', -- 'transactional', 'marketing', 'notification', 'custom'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject VARCHAR(500),
  html_content TEXT,
  text_content TEXT,
  segment_id UUID,
  segment_filters JSONB, -- RFM segments, tags, custom filters
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'
  ab_test JSONB, -- A/B test configuration
  send_from VARCHAR(255) NOT NULL,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Segments Table
CREATE TABLE IF NOT EXISTS email_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filters JSONB NOT NULL, -- RFM, tags, order count, total spent, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  recipient_id UUID, -- Customer ID
  recipient_email VARCHAR(255) NOT NULL,
  message_id VARCHAR(255), -- Provider-specific message ID
  provider VARCHAR(50), -- 'sendgrid', 'mailgun', 'nodemailer'
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  error TEXT,
  bounce_type VARCHAR(50), -- 'hard', 'soft', 'complaint'
  bounce_reason TEXT,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Tracking Events Table
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_log_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  recipient_id UUID,
  event_type VARCHAR(50) NOT NULL, -- 'open', 'click', 'bounce', 'complaint', 'unsubscribe'
  url TEXT, -- For click events
  user_agent TEXT,
  ip_address VARCHAR(50),
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Analytics Table
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL,
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  hard_bounce_count INTEGER DEFAULT 0,
  soft_bounce_count INTEGER DEFAULT 0,
  emails_complained INTEGER DEFAULT 0,
  emails_unsubscribed INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  complaint_rate DECIMAL(5,2) DEFAULT 0,
  unsubscribe_rate DECIMAL(5,2) DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, analytics_date)
);

-- Email Automations Table
CREATE TABLE IF NOT EXISTS email_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(100) NOT NULL, -- 'abandoned_cart', 'order_confirmation', 'welcome', 'birthday', etc.
  trigger_config JSONB, -- Configuration for the trigger
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  delay_hours INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add email-related columns to customers table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email_subscribed') THEN
    ALTER TABLE customers ADD COLUMN email_subscribed BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'email_status') THEN
    ALTER TABLE customers ADD COLUMN email_status VARCHAR(50) DEFAULT 'active'; -- 'active', 'bounced', 'complained'
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'soft_bounce_count') THEN
    ALTER TABLE customers ADD COLUMN soft_bounce_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_soft_bounce_at') THEN
    ALTER TABLE customers ADD COLUMN last_soft_bounce_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'bounced_at') THEN
    ALTER TABLE customers ADD COLUMN bounced_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'complained_at') THEN
    ALTER TABLE customers ADD COLUMN complained_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'unsubscribed_at') THEN
    ALTER TABLE customers ADD COLUMN unsubscribed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_email_segments_user_id ON email_segments(user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON email_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_email_tracking_events_email_log_id ON email_tracking_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_campaign_id ON email_tracking_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_event_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_timestamp ON email_tracking_events(event_timestamp);

CREATE INDEX IF NOT EXISTS idx_email_analytics_campaign_id ON email_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_user_id ON email_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_date ON email_analytics(analytics_date);

CREATE INDEX IF NOT EXISTS idx_email_automations_user_id ON email_automations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_automations_trigger_type ON email_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_email_automations_active ON email_automations(is_active);

CREATE INDEX IF NOT EXISTS idx_customers_email_status ON customers(email_status);
CREATE INDEX IF NOT EXISTS idx_customers_email_subscribed ON customers(email_subscribed);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_segments_updated_at BEFORE UPDATE ON email_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_analytics_updated_at BEFORE UPDATE ON email_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_automations_updated_at BEFORE UPDATE ON email_automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE email_templates IS 'Stores email templates with variable support';
COMMENT ON TABLE email_campaigns IS 'Manages email campaigns with scheduling and A/B testing';
COMMENT ON TABLE email_segments IS 'Defines recipient segments for targeted campaigns';
COMMENT ON TABLE email_logs IS 'Logs individual email sends and their status';
COMMENT ON TABLE email_tracking_events IS 'Tracks detailed email events (opens, clicks, etc.)';
COMMENT ON TABLE email_analytics IS 'Aggregated email analytics by campaign and date';
COMMENT ON TABLE email_automations IS 'Automated email triggers based on events';
