-- Stripe Integration Database Schema
-- This migration creates all necessary tables for Stripe payment and subscription integration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Stripe Customers Table
-- Maps Supabase users to Stripe customers
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for stripe_customers
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON stripe_customers(email);

-- ============================================
-- Stripe Payments Table
-- Stores payment intent records
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255),
  order_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  payment_method_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for stripe_payments
CREATE INDEX IF NOT EXISTS idx_stripe_payments_intent_id ON stripe_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_customer_id ON stripe_payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_order_id ON stripe_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON stripe_payments(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_created_at ON stripe_payments(created_at DESC);

-- ============================================
-- Stripe Refunds Table
-- Stores refund records
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_refund_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_charge_id VARCHAR(255) NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  reason VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for stripe_refunds
CREATE INDEX IF NOT EXISTS idx_stripe_refunds_refund_id ON stripe_refunds(stripe_refund_id);
CREATE INDEX IF NOT EXISTS idx_stripe_refunds_charge_id ON stripe_refunds(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_stripe_refunds_payment_intent_id ON stripe_refunds(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_refunds_created_at ON stripe_refunds(created_at DESC);

-- ============================================
-- Stripe Subscriptions Table
-- Stores subscription records
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for stripe_subscriptions
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_subscription_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_period_end ON stripe_subscriptions(current_period_end);

-- ============================================
-- Stripe Webhook Logs Table
-- Stores webhook event logs for idempotency and debugging
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  idempotency_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for stripe_webhook_logs
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_event_id ON stripe_webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_event_type ON stripe_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_processed ON stripe_webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_idempotency_key ON stripe_webhook_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_created_at ON stripe_webhook_logs(created_at DESC);

-- ============================================
-- Add payment_status column to orders table if it doesn't exist
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
  END IF;
END $$;

-- Add index for payment_status if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

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
DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON stripe_customers;
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_payments_updated_at ON stripe_payments;
CREATE TRIGGER update_stripe_payments_updated_at
  BEFORE UPDATE ON stripe_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_subscriptions_updated_at ON stripe_subscriptions;
CREATE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
-- ============================================
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_customers
DROP POLICY IF EXISTS "Users can view their own customer record" ON stripe_customers;
CREATE POLICY "Users can view their own customer record"
  ON stripe_customers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all customer records" ON stripe_customers;
CREATE POLICY "Service role can manage all customer records"
  ON stripe_customers FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for stripe_payments
DROP POLICY IF EXISTS "Users can view their own payments" ON stripe_payments;
CREATE POLICY "Users can view their own payments"
  ON stripe_payments FOR SELECT
  USING (
    stripe_customer_id IN (
      SELECT stripe_customer_id FROM stripe_customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage all payments" ON stripe_payments;
CREATE POLICY "Service role can manage all payments"
  ON stripe_payments FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for stripe_refunds
DROP POLICY IF EXISTS "Users can view their own refunds" ON stripe_refunds;
CREATE POLICY "Users can view their own refunds"
  ON stripe_refunds FOR SELECT
  USING (
    stripe_payment_intent_id IN (
      SELECT stripe_payment_intent_id FROM stripe_payments
      WHERE stripe_customer_id IN (
        SELECT stripe_customer_id FROM stripe_customers WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Service role can manage all refunds" ON stripe_refunds;
CREATE POLICY "Service role can manage all refunds"
  ON stripe_refunds FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for stripe_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON stripe_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON stripe_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON stripe_subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
  ON stripe_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for stripe_webhook_logs (service role only)
DROP POLICY IF EXISTS "Service role can manage webhook logs" ON stripe_webhook_logs;
CREATE POLICY "Service role can manage webhook logs"
  ON stripe_webhook_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE stripe_customers IS 'Maps Supabase users to Stripe customer IDs';
COMMENT ON TABLE stripe_payments IS 'Stores Stripe payment intent records and order payments';
COMMENT ON TABLE stripe_refunds IS 'Stores Stripe refund records';
COMMENT ON TABLE stripe_subscriptions IS 'Stores Stripe subscription records for recurring billing';
COMMENT ON TABLE stripe_webhook_logs IS 'Logs Stripe webhook events for idempotency and debugging';

-- ============================================
-- Grant permissions
-- ============================================
GRANT ALL ON stripe_customers TO authenticated;
GRANT ALL ON stripe_payments TO authenticated;
GRANT ALL ON stripe_refunds TO authenticated;
GRANT ALL ON stripe_subscriptions TO authenticated;
GRANT ALL ON stripe_webhook_logs TO service_role;
