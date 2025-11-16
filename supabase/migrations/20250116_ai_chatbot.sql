-- AI Chatbot Database Schema
-- Tables for AI-powered customer service chatbot

-- =====================================================
-- Chatbot Conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  session_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('web', 'whatsapp', 'messenger', 'mobile')),
  context JSONB DEFAULT '{}'::jsonb,
  escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT CHECK (escalation_reason IN ('complex_issue', 'user_request', 'low_confidence', 'sensitive_data')),
  escalated_to UUID REFERENCES auth.users(id),
  escalated_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for chatbot_conversations
CREATE INDEX idx_chatbot_conversations_customer ON chatbot_conversations(customer_id);
CREATE INDEX idx_chatbot_conversations_session ON chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_channel ON chatbot_conversations(channel);
CREATE INDEX idx_chatbot_conversations_escalated ON chatbot_conversations(escalated) WHERE escalated = true;
CREATE INDEX idx_chatbot_conversations_started ON chatbot_conversations(started_at DESC);

-- =====================================================
-- Chatbot Messages
-- =====================================================
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT CHECK (intent IN (
    'order_lookup',
    'shipping_tracking',
    'return_request',
    'refund_request',
    'product_recommendation',
    'faq',
    'escalate_to_human',
    'general_inquiry',
    'complaint',
    'account_management'
  )),
  intent_confidence TEXT CHECK (intent_confidence IN ('high', 'medium', 'low')),
  entities JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for chatbot_messages
CREATE INDEX idx_chatbot_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_messages_created ON chatbot_messages(created_at DESC);
CREATE INDEX idx_chatbot_messages_intent ON chatbot_messages(intent) WHERE intent IS NOT NULL;
CREATE INDEX idx_chatbot_messages_role ON chatbot_messages(role);

-- =====================================================
-- Intent Logs
-- =====================================================
CREATE TABLE IF NOT EXISTS intent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chatbot_messages(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  entities JSONB DEFAULT '{}'::jsonb,
  action_taken TEXT,
  action_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for intent_logs
CREATE INDEX idx_intent_logs_conversation ON intent_logs(conversation_id);
CREATE INDEX idx_intent_logs_message ON intent_logs(message_id);
CREATE INDEX idx_intent_logs_intent ON intent_logs(intent);
CREATE INDEX idx_intent_logs_created ON intent_logs(created_at DESC);

-- =====================================================
-- Chatbot Training Data
-- =====================================================
CREATE TABLE IF NOT EXISTS chatbot_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent TEXT NOT NULL,
  user_message TEXT NOT NULL,
  expected_response TEXT,
  entities JSONB DEFAULT '{}'::jsonb,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for chatbot_training_data
CREATE INDEX idx_training_data_intent ON chatbot_training_data(intent);
CREATE INDEX idx_training_data_approved ON chatbot_training_data(approved);
CREATE INDEX idx_training_data_created ON chatbot_training_data(created_at DESC);

-- Full-text search on training data
CREATE INDEX idx_training_data_message_fts ON chatbot_training_data
  USING gin(to_tsvector('english', user_message));

-- =====================================================
-- Chatbot Analytics View
-- =====================================================
CREATE OR REPLACE VIEW chatbot_analytics_daily AS
SELECT
  DATE(created_at) as date,
  channel,
  COUNT(DISTINCT id) as total_conversations,
  COUNT(DISTINCT CASE WHEN escalated THEN id END) as escalated_conversations,
  ROUND(
    COUNT(DISTINCT CASE WHEN escalated THEN id END)::numeric /
    NULLIF(COUNT(DISTINCT id), 0) * 100,
    2
  ) as escalation_rate,
  COUNT(DISTINCT customer_id) as unique_customers,
  AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at))) as avg_duration_seconds
FROM chatbot_conversations
GROUP BY DATE(created_at), channel
ORDER BY date DESC, channel;

-- =====================================================
-- Intent Analytics View
-- =====================================================
CREATE OR REPLACE VIEW intent_analytics_daily AS
SELECT
  DATE(created_at) as date,
  intent,
  confidence,
  COUNT(*) as total_count,
  COUNT(DISTINCT conversation_id) as unique_conversations,
  COUNT(CASE WHEN action_result->>'success' = 'true' THEN 1 END) as successful_actions,
  ROUND(
    COUNT(CASE WHEN action_result->>'success' = 'true' THEN 1 END)::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate
FROM intent_logs
GROUP BY DATE(created_at), intent, confidence
ORDER BY date DESC, total_count DESC;

-- =====================================================
-- Message Analytics View
-- =====================================================
CREATE OR REPLACE VIEW message_analytics_daily AS
SELECT
  DATE(cm.created_at) as date,
  cm.role,
  COUNT(*) as total_messages,
  AVG(LENGTH(cm.content)) as avg_message_length,
  COUNT(DISTINCT cm.conversation_id) as unique_conversations
FROM chatbot_messages cm
GROUP BY DATE(cm.created_at), cm.role
ORDER BY date DESC, role;

-- =====================================================
-- Functions
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chatbot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER chatbot_conversations_updated_at
  BEFORE UPDATE ON chatbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_updated_at();

CREATE TRIGGER chatbot_training_data_updated_at
  BEFORE UPDATE ON chatbot_training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_updated_at();

-- =====================================================
-- Get conversation with messages
-- =====================================================
CREATE OR REPLACE FUNCTION get_chatbot_conversation_with_messages(
  p_conversation_id UUID
)
RETURNS TABLE (
  conversation_data JSONB,
  messages JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(c.*) as conversation_data,
    COALESCE(
      jsonb_agg(
        to_jsonb(m.*)
        ORDER BY m.created_at ASC
      ) FILTER (WHERE m.id IS NOT NULL),
      '[]'::jsonb
    ) as messages
  FROM chatbot_conversations c
  LEFT JOIN chatbot_messages m ON m.conversation_id = c.id
  WHERE c.id = p_conversation_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Get conversation history for customer
-- =====================================================
CREATE OR REPLACE FUNCTION get_customer_chatbot_history(
  p_customer_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  conversation JSONB,
  message_count BIGINT,
  last_message_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(c.*) as conversation,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message_at
  FROM chatbot_conversations c
  LEFT JOIN chatbot_messages m ON m.conversation_id = c.id
  WHERE c.customer_id = p_customer_id
  GROUP BY c.id
  ORDER BY MAX(m.created_at) DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Get intent statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_intent_statistics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  intent TEXT,
  total_occurrences BIGINT,
  high_confidence BIGINT,
  medium_confidence BIGINT,
  low_confidence BIGINT,
  avg_success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    il.intent,
    COUNT(*) as total_occurrences,
    COUNT(*) FILTER (WHERE il.confidence = 'high') as high_confidence,
    COUNT(*) FILTER (WHERE il.confidence = 'medium') as medium_confidence,
    COUNT(*) FILTER (WHERE il.confidence = 'low') as low_confidence,
    ROUND(
      COUNT(*) FILTER (WHERE il.action_result->>'success' = 'true')::numeric /
      NULLIF(COUNT(*), 0) * 100,
      2
    ) as avg_success_rate
  FROM intent_logs il
  WHERE DATE(il.created_at) BETWEEN p_start_date AND p_end_date
  GROUP BY il.intent
  ORDER BY total_occurrences DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_training_data ENABLE ROW LEVEL SECURITY;

-- Policies for chatbot_conversations
CREATE POLICY chatbot_conversations_customer_policy ON chatbot_conversations
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY chatbot_conversations_agent_policy ON chatbot_conversations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'agent', 'support')
      )
    )
  );

-- Policies for chatbot_messages
CREATE POLICY chatbot_messages_customer_policy ON chatbot_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chatbot_conversations
      WHERE id = chatbot_messages.conversation_id
      AND customer_id = auth.uid()
    )
  );

CREATE POLICY chatbot_messages_agent_policy ON chatbot_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'agent', 'support')
      )
    )
  );

-- Policies for intent_logs (admin/agent only)
CREATE POLICY intent_logs_admin_policy ON intent_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (
        SELECT id FROM roles WHERE name IN ('admin', 'agent')
      )
    )
  );

-- Policies for chatbot_training_data (admin only)
CREATE POLICY training_data_admin_policy ON chatbot_training_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_id IN (
        SELECT id FROM roles WHERE name = 'admin'
      )
    )
  );

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE chatbot_conversations IS 'AI chatbot conversation sessions with customers';
COMMENT ON TABLE chatbot_messages IS 'Individual messages in chatbot conversations';
COMMENT ON TABLE intent_logs IS 'Logs of detected intents and actions taken';
COMMENT ON TABLE chatbot_training_data IS 'Training data for improving chatbot responses';

COMMENT ON COLUMN chatbot_conversations.context IS 'Customer context including order history and preferences';
COMMENT ON COLUMN chatbot_messages.metadata IS 'Message metadata including model used, tokens, response time';
COMMENT ON COLUMN intent_logs.entities IS 'Extracted entities from the message (order ID, email, etc.)';
