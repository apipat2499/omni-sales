-- ============================================
-- WhatsApp Business API Integration Tables
-- ============================================

-- WhatsApp Connections Table
-- Stores WhatsApp business account information
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_account_id VARCHAR(255) NOT NULL UNIQUE,
  phone_number_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  display_phone_number VARCHAR(50),
  verified_name VARCHAR(255),
  code_verification_status VARCHAR(50),
  quality_rating VARCHAR(50) DEFAULT 'GREEN',
  messaging_limit VARCHAR(50) DEFAULT 'TIER_1K',
  access_token TEXT NOT NULL,
  webhook_verify_token VARCHAR(255),
  webhook_secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Messages Table
-- Logs all incoming and outgoing messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  waba_message_id VARCHAR(255) UNIQUE, -- WhatsApp Business API message ID
  conversation_id VARCHAR(255), -- For grouping messages
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL, -- 'inbound' or 'outbound'
  message_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'document', 'template', etc.
  content JSONB NOT NULL, -- Message content (text, media, etc.)
  template_name VARCHAR(255), -- If template message
  template_language VARCHAR(10), -- Template language code
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
  error_code VARCHAR(50),
  error_message TEXT,
  context JSONB, -- Reply context if this is a reply
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Templates Table
-- Stores pre-approved message templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'th', -- ISO 639-1 code
  category VARCHAR(50) NOT NULL, -- MARKETING, UTILITY, AUTHENTICATION
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  template_data JSONB NOT NULL, -- Complete template structure
  components JSONB NOT NULL, -- Header, body, footer, buttons
  example_values JSONB, -- Example values for variables
  rejection_reason TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(connection_id, name, language)
);

-- WhatsApp Webhooks Table
-- Logs all webhook events from WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- messages, statuses, errors
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Contacts Table
-- Stores customer WhatsApp contact information
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  phone_number VARCHAR(50) NOT NULL,
  wa_id VARCHAR(50), -- WhatsApp ID
  profile_name VARCHAR(255),
  is_opted_in BOOLEAN DEFAULT true,
  opted_in_at TIMESTAMP WITH TIME ZONE,
  opted_out_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(connection_id, phone_number)
);

-- WhatsApp Campaigns Table
-- Stores promotional campaign information
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  template_name VARCHAR(255) NOT NULL,
  target_audience JSONB, -- Filter criteria for recipients
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, completed, failed
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Campaign Recipients Table
-- Tracks individual campaign message delivery
CREATE TABLE IF NOT EXISTS whatsapp_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  message_id UUID REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
  phone_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, read, failed
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- WhatsApp Messages indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_connection ON whatsapp_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to ON whatsapp_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_waba_id ON whatsapp_messages(waba_message_id);

-- WhatsApp Templates indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_connection ON whatsapp_templates(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_language ON whatsapp_templates(language);

-- WhatsApp Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_connection ON whatsapp_webhooks(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_processed ON whatsapp_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_created ON whatsapp_webhooks(created_at DESC);

-- WhatsApp Contacts indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_connection ON whatsapp_contacts(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_customer ON whatsapp_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_opted_in ON whatsapp_contacts(is_opted_in);

-- WhatsApp Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_connection ON whatsapp_campaigns(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_scheduled ON whatsapp_campaigns(scheduled_at);

-- WhatsApp Campaign Recipients indexes
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON whatsapp_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_contact ON whatsapp_campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON whatsapp_campaign_recipients(status);

-- ============================================
-- Triggers for updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_updated_at BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_recipients_updated_at BEFORE UPDATE ON whatsapp_campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Policies (Allow authenticated users to manage their WhatsApp data)
CREATE POLICY whatsapp_connections_policy ON whatsapp_connections FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY whatsapp_messages_policy ON whatsapp_messages FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY whatsapp_templates_policy ON whatsapp_templates FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY whatsapp_webhooks_policy ON whatsapp_webhooks FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY whatsapp_contacts_policy ON whatsapp_contacts FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY whatsapp_campaigns_policy ON whatsapp_campaigns FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY whatsapp_campaign_recipients_policy ON whatsapp_campaign_recipients FOR ALL
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON whatsapp_connections TO authenticated;
GRANT ALL ON whatsapp_messages TO authenticated;
GRANT ALL ON whatsapp_templates TO authenticated;
GRANT ALL ON whatsapp_webhooks TO authenticated;
GRANT ALL ON whatsapp_contacts TO authenticated;
GRANT ALL ON whatsapp_campaigns TO authenticated;
GRANT ALL ON whatsapp_campaign_recipients TO authenticated;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE whatsapp_connections IS 'WhatsApp Business API connection information';
COMMENT ON TABLE whatsapp_messages IS 'Log of all WhatsApp messages sent and received';
COMMENT ON TABLE whatsapp_templates IS 'Pre-approved WhatsApp message templates';
COMMENT ON TABLE whatsapp_webhooks IS 'Webhook events received from WhatsApp API';
COMMENT ON TABLE whatsapp_contacts IS 'Customer WhatsApp contact information';
COMMENT ON TABLE whatsapp_campaigns IS 'WhatsApp promotional campaigns';
COMMENT ON TABLE whatsapp_campaign_recipients IS 'Campaign message delivery tracking';
