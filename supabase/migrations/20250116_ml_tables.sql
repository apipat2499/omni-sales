-- ============================================
-- ML/AI FEATURE TABLES
-- ============================================

-- ML Model Metadata Table
CREATE TABLE IF NOT EXISTS ml_model_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_type VARCHAR(50) NOT NULL, -- 'recommendations', 'forecast', 'churn'
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  algorithm VARCHAR(100) NOT NULL,
  parameters JSONB,
  accuracy_metrics JSONB, -- MAE, RMSE, R2, etc.
  training_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation Cache Table
CREATE TABLE IF NOT EXISTS ml_recommendation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  score DECIMAL(10, 4) NOT NULL,
  reason TEXT,
  algorithm VARCHAR(50) NOT NULL, -- 'collaborative', 'content-based', 'hybrid'
  rank INTEGER NOT NULL,
  context VARCHAR(50) DEFAULT 'general', -- 'general', 'cart', 'product_page', etc.
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  is_converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_rec_cache_user ON ml_recommendation_cache(user_id, context, expires_at);
CREATE INDEX idx_ml_rec_cache_product ON ml_recommendation_cache(product_id);

-- Forecast Results Table
CREATE TABLE IF NOT EXISTS ml_forecast_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_type VARCHAR(50) NOT NULL, -- 'sales', 'product', 'revenue'
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  forecast_data JSONB NOT NULL, -- Array of {date, predicted, lower, upper, trend, seasonal}
  historical_days INTEGER NOT NULL,
  algorithm VARCHAR(100) NOT NULL,
  metrics JSONB, -- MAE, RMSE, MAPE, R2
  metadata JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_forecast_type ON ml_forecast_results(forecast_type, expires_at);
CREATE INDEX idx_ml_forecast_product ON ml_forecast_results(product_id);

-- RFM Scores Table
CREATE TABLE IF NOT EXISTS ml_rfm_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  recency INTEGER NOT NULL, -- Days since last purchase
  frequency INTEGER NOT NULL, -- Number of purchases
  monetary DECIMAL(12, 2) NOT NULL, -- Total amount spent
  recency_score INTEGER NOT NULL CHECK (recency_score BETWEEN 1 AND 5),
  frequency_score INTEGER NOT NULL CHECK (frequency_score BETWEEN 1 AND 5),
  monetary_score INTEGER NOT NULL CHECK (monetary_score BETWEEN 1 AND 5),
  rfm_score VARCHAR(3) NOT NULL, -- e.g., "555"
  segment VARCHAR(50) NOT NULL, -- 'Champions', 'At Risk', etc.
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id)
);

CREATE INDEX idx_ml_rfm_customer ON ml_rfm_scores(customer_id);
CREATE INDEX idx_ml_rfm_segment ON ml_rfm_scores(segment);
CREATE INDEX idx_ml_rfm_score ON ml_rfm_scores(rfm_score);

-- Churn Predictions Table
CREATE TABLE IF NOT EXISTS ml_churn_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  churn_probability DECIMAL(5, 4) NOT NULL CHECK (churn_probability BETWEEN 0 AND 1),
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  rfm_score VARCHAR(3) NOT NULL,
  segment VARCHAR(50) NOT NULL,
  factors JSONB, -- Array of churn factors with impact scores
  recommended_actions TEXT[],
  days_until_churn INTEGER,
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  action_taken BOOLEAN DEFAULT false,
  action_taken_at TIMESTAMP WITH TIME ZONE,
  action_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id)
);

CREATE INDEX idx_ml_churn_customer ON ml_churn_predictions(customer_id);
CREATE INDEX idx_ml_churn_risk ON ml_churn_predictions(risk_level, expires_at);
CREATE INDEX idx_ml_churn_probability ON ml_churn_predictions(churn_probability DESC);

-- Training Logs Table
CREATE TABLE IF NOT EXISTS ml_training_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
  metrics JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_training_logs_model ON ml_training_logs(model_type, started_at DESC);
CREATE INDEX idx_ml_training_logs_status ON ml_training_logs(status);

-- Product Similarity Matrix (for item-based collaborative filtering)
CREATE TABLE IF NOT EXISTS ml_product_similarity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id_1 UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_id_2 UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5, 4) NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
  similarity_type VARCHAR(50) NOT NULL, -- 'collaborative', 'content', 'hybrid'
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id_1, product_id_2, similarity_type)
);

CREATE INDEX idx_ml_similarity_product1 ON ml_product_similarity(product_id_1, similarity_score DESC);
CREATE INDEX idx_ml_similarity_product2 ON ml_product_similarity(product_id_2, similarity_score DESC);

-- User Interaction Events (for building user-item matrix)
CREATE TABLE IF NOT EXISTS ml_user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'add_to_cart', 'purchase', 'rate'
  interaction_value DECIMAL(10, 2), -- For purchases: amount, For ratings: 1-5
  session_id VARCHAR(100),
  device_type VARCHAR(50),
  context JSONB, -- Additional context data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_interactions_user ON ml_user_interactions(user_id, created_at DESC);
CREATE INDEX idx_ml_interactions_product ON ml_user_interactions(product_id, created_at DESC);
CREATE INDEX idx_ml_interactions_type ON ml_user_interactions(interaction_type);

-- Feature Store (for ML features)
CREATE TABLE IF NOT EXISTS ml_feature_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL, -- 'product', 'customer', 'order'
  entity_id UUID NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  feature_value JSONB NOT NULL,
  feature_version INTEGER DEFAULT 1,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, feature_name)
);

CREATE INDEX idx_ml_features_entity ON ml_feature_store(entity_type, entity_id);
CREATE INDEX idx_ml_features_name ON ml_feature_store(feature_name);

-- Recommendation Performance Metrics
CREATE TABLE IF NOT EXISTS ml_recommendation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  algorithm VARCHAR(50) NOT NULL,
  context VARCHAR(50) NOT NULL,
  total_recommendations INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5, 4),
  conversion_rate DECIMAL(5, 4),
  revenue_generated DECIMAL(12, 2),
  avg_relevance_score DECIMAL(5, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, algorithm, context)
);

CREATE INDEX idx_ml_rec_metrics_date ON ml_recommendation_metrics(date DESC);
CREATE INDEX idx_ml_rec_metrics_algo ON ml_recommendation_metrics(algorithm, date DESC);

-- A/B Testing Table for ML Models
CREATE TABLE IF NOT EXISTS ml_ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name VARCHAR(100) NOT NULL,
  model_type VARCHAR(50) NOT NULL,
  variant_a_config JSONB NOT NULL,
  variant_b_config JSONB NOT NULL,
  traffic_split DECIMAL(3, 2) DEFAULT 0.5, -- 0.5 = 50/50 split
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  results JSONB,
  winner VARCHAR(10), -- 'a', 'b', or 'tie'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_ml_model_metadata_updated_at
  BEFORE UPDATE ON ml_model_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_rfm_scores_updated_at
  BEFORE UPDATE ON ml_rfm_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_churn_predictions_updated_at
  BEFORE UPDATE ON ml_churn_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_feature_store_updated_at
  BEFORE UPDATE ON ml_feature_store
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_ab_tests_updated_at
  BEFORE UPDATE ON ml_ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE ml_model_metadata IS 'Stores metadata about ML models including versions, algorithms, and accuracy metrics';
COMMENT ON TABLE ml_recommendation_cache IS 'Caches product recommendations for users with expiration times';
COMMENT ON TABLE ml_forecast_results IS 'Stores sales and product demand forecasts';
COMMENT ON TABLE ml_rfm_scores IS 'Stores RFM (Recency, Frequency, Monetary) analysis scores for customers';
COMMENT ON TABLE ml_churn_predictions IS 'Stores customer churn predictions with risk levels and recommended actions';
COMMENT ON TABLE ml_training_logs IS 'Logs ML model training runs with metrics and status';
COMMENT ON TABLE ml_product_similarity IS 'Stores product similarity scores for collaborative filtering';
COMMENT ON TABLE ml_user_interactions IS 'Tracks user interactions with products for recommendation engine';
COMMENT ON TABLE ml_feature_store IS 'Centralized feature store for ML models';
COMMENT ON TABLE ml_recommendation_metrics IS 'Tracks performance metrics for recommendation algorithms';
COMMENT ON TABLE ml_ab_tests IS 'Manages A/B tests for ML models';
