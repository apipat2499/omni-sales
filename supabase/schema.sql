-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  channel VARCHAR(50) NOT NULL,
  payment_method VARCHAR(100),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDER MANAGEMENT SYSTEM TABLES
-- ============================================

-- Order Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  reason VARCHAR(255),
  notes TEXT,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Payments
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(50), -- pending, completed, failed, refunded, partial
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Shipping
CREATE TABLE IF NOT EXISTS order_shipping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipping_method VARCHAR(100),
  carrier VARCHAR(100),
  tracking_number VARCHAR(255),
  weight_kg DECIMAL(10, 2),
  dimensions_cm VARCHAR(100),
  shipping_address TEXT NOT NULL,
  shipping_status VARCHAR(50), -- pending, picked, packed, shipped, in_transit, delivered, failed
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  signature_required BOOLEAN DEFAULT false,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Returns
CREATE TABLE IF NOT EXISTS order_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  return_number VARCHAR(100) UNIQUE,
  return_reason VARCHAR(100),
  reason_details TEXT,
  return_status VARCHAR(50), -- pending, approved, rejected, received, processed
  refund_amount DECIMAL(12, 2),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Return Items (Products Being Returned)
CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name VARCHAR(255),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2),
  reason VARCHAR(255),
  condition VARCHAR(50), -- unopened, opened, defective, damaged
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  return_id UUID REFERENCES order_returns(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  reason VARCHAR(100),
  refund_method VARCHAR(50), -- original_payment, store_credit, bank_transfer
  refund_status VARCHAR(50), -- pending, processing, completed, failed
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Fulfillment Tasks
CREATE TABLE IF NOT EXISTS fulfillment_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  task_type VARCHAR(50), -- pick, pack, ship, verify, label
  task_status VARCHAR(50), -- pending, in_progress, completed, failed
  assigned_to UUID,
  priority VARCHAR(50), -- low, medium, high, urgent
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Discount/Coupon Applications
CREATE TABLE IF NOT EXISTS order_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  coupon_code VARCHAR(100),
  discount_type VARCHAR(50), -- percentage, fixed_amount
  discount_value DECIMAL(10, 2),
  discount_amount DECIMAL(12, 2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DISCOUNT & COUPON MANAGEMENT SYSTEM TABLES
-- ============================================

-- Discount/Coupon Codes
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(50) NOT NULL, -- percentage, fixed_amount, buy_x_get_y, tiered
  discount_value DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, expired, archived
  is_stackable BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  usage_limit INTEGER, -- null = unlimited
  usage_per_customer INTEGER, -- null = unlimited
  current_usage_count INTEGER DEFAULT 0,
  minimum_order_value DECIMAL(12, 2),
  maximum_discount_amount DECIMAL(12, 2),
  applicable_to VARCHAR(50) DEFAULT 'all', -- all, specific_products, specific_categories, specific_customers
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  auto_apply BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  CONSTRAINT discount_codes_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Discount Code Rules (for tiered/conditional discounts)
CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- quantity_based, amount_based, category_based, customer_segment
  condition_operator VARCHAR(20), -- equals, greater_than, less_than, between
  condition_value JSONB, -- flexible condition values
  discount_value DECIMAL(12, 2),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT discount_rules_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Discount Code Applicable Products
CREATE TABLE IF NOT EXISTS discount_code_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_sku VARCHAR(100),
  product_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT discount_code_products_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Discount Code Applicable Categories
CREATE TABLE IF NOT EXISTS discount_code_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  category_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT discount_code_categories_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Discount Code Customer Segments
CREATE TABLE IF NOT EXISTS discount_code_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  customer_segment_id TEXT, -- reference to customer segments
  segment_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT discount_code_segments_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Coupon Usage History/Redemption
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id TEXT,
  code VARCHAR(100),
  discount_amount DECIMAL(12, 2) NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  redeemed_by UUID,
  notes TEXT,
  CONSTRAINT coupon_redemptions_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Promotional Campaigns
CREATE TABLE IF NOT EXISTS promotional_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50), -- seasonal, flash_sale, loyalty, bulk_discount, referral
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, ended, archived
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  budget_limit DECIMAL(12, 2),
  budget_used DECIMAL(12, 2) DEFAULT 0,
  discount_codes TEXT[] DEFAULT '{}', -- array of discount code IDs
  target_audience VARCHAR(50), -- all, specific_segment, new_customers, vip_customers
  min_purchase_amount DECIMAL(12, 2),
  marketing_channel VARCHAR(50), -- email, sms, in_app, web, social
  campaign_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  CONSTRAINT promotional_campaigns_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Discount Analytics/Performance
CREATE TABLE IF NOT EXISTS discount_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE,
  total_redemptions INTEGER DEFAULT 0,
  total_discount_amount DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(12, 2),
  orders_created INTEGER DEFAULT 0,
  customers_reached INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2), -- percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT discount_analytics_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ============================================
-- REVIEW & RATING MANAGEMENT SYSTEM TABLES
-- ============================================

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID,
  order_id UUID, -- Reference to order if review is from purchase
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, hidden
  moderation_notes TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  response_text TEXT, -- Seller response to review
  response_by UUID, -- User who responded
  response_at TIMESTAMP WITH TIME ZONE,
  reported_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_reviews_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Review Images/Attachments
CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT review_images_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Review Votes (Helpful/Unhelpful)
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  voter_email VARCHAR(255),
  vote_type VARCHAR(50) NOT NULL, -- helpful, unhelpful
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT review_votes_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id),
  UNIQUE(review_id, voter_email, vote_type)
);

-- Review Reports/Flags
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  reporter_email VARCHAR(255),
  report_reason VARCHAR(100) NOT NULL, -- inappropriate, fake, spam, offensive, factually_incorrect
  report_description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, actioned, dismissed
  action_taken VARCHAR(100), -- deleted, hidden, flagged, no_action
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT review_reports_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Product Rating Summary (Denormalized for performance)
CREATE TABLE IF NOT EXISTS product_rating_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  approved_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0, -- 0.00 to 5.00
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  recommendation_count INTEGER DEFAULT 0, -- Implicit from high ratings
  last_review_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_rating_summaries_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Review Analytics/Metrics
CREATE TABLE IF NOT EXISTS review_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date TIMESTAMP WITH TIME ZONE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  total_new_reviews INTEGER DEFAULT 0,
  approved_reviews INTEGER DEFAULT 0,
  rejected_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  positive_reviews INTEGER DEFAULT 0, -- 4-5 stars
  negative_reviews INTEGER DEFAULT 0, -- 1-2 stars
  total_helpful_votes INTEGER DEFAULT 0,
  response_rate DECIMAL(5, 2), -- percentage of reviews with seller response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT review_analytics_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ============================================
-- WISHLIST & FAVORITES SYSTEM TABLES
-- ============================================

-- Wishlists (Personal Lists)
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  wishlist_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_code VARCHAR(50) UNIQUE, -- For public sharing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishlists_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Wishlist Items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  product_image VARCHAR(500),
  price_at_added DECIMAL(10, 2),
  current_price DECIMAL(10, 2),
  priority INTEGER DEFAULT 0, -- 0=low, 1=medium, 2=high
  notes TEXT,
  quantity_desired INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishlist_items_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Wishlist Shares (Shared Access)
CREATE TABLE IF NOT EXISTS wishlist_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  share_email VARCHAR(255), -- Email recipient (if personal share)
  share_name VARCHAR(255), -- Recipient name
  share_token VARCHAR(100) UNIQUE, -- Token for access
  share_type VARCHAR(50) DEFAULT 'link', -- link, email, social
  view_count INTEGER DEFAULT 0,
  accessed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishlist_shares_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Price Change History (Track price drops for notifications)
CREATE TABLE IF NOT EXISTS wishlist_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  price_drop_amount DECIMAL(10, 2),
  price_drop_percent DECIMAL(5, 2),
  notification_sent BOOLEAN DEFAULT false,
  price_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishlist_price_history_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Wishlist Analytics
CREATE TABLE IF NOT EXISTS wishlist_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE,
  total_items INTEGER DEFAULT 0,
  total_value DECIMAL(12, 2),
  average_price DECIMAL(10, 2),
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_removed INTEGER DEFAULT 0,
  items_purchased INTEGER DEFAULT 0,
  price_drop_items INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishlist_analytics_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Customer Wishlist Preferences
CREATE TABLE IF NOT EXISTS wishlist_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_email VARCHAR(255) NOT NULL UNIQUE,
  notify_price_drops BOOLEAN DEFAULT true,
  price_drop_threshold DECIMAL(5, 2) DEFAULT 10, -- percentage
  notify_back_in_stock BOOLEAN DEFAULT true,
  notify_shared_wishlists BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  default_wishlist_visibility VARCHAR(50) DEFAULT 'private', -- private, friends, public
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wishlist_preferences_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Create Indexes for Order Management
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_status ON order_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_shipping_order ON order_shipping(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipping_status ON order_shipping(shipping_status);
CREATE INDEX IF NOT EXISTS idx_order_shipping_tracking ON order_shipping(tracking_number);
CREATE INDEX IF NOT EXISTS idx_order_returns_order ON order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_status ON order_returns(return_status);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_return ON refunds(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_order ON fulfillment_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_status ON fulfillment_tasks(task_status);
CREATE INDEX IF NOT EXISTS idx_order_discounts_order ON order_discounts(order_id);

-- Create Indexes for Discount Management
CREATE INDEX IF NOT EXISTS idx_discount_codes_user ON discount_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_status ON discount_codes(status);
CREATE INDEX IF NOT EXISTS idx_discount_codes_date_range ON discount_codes(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_discount_rules_code ON discount_rules(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_products_code ON discount_code_products(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_categories_code ON discount_code_categories(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_segments_code ON discount_code_segments(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_code ON coupon_redemptions(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON coupon_redemptions(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_customer ON coupon_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_date ON coupon_redemptions(redeemed_at);
CREATE INDEX IF NOT EXISTS idx_promotional_campaigns_user ON promotional_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_promotional_campaigns_status ON promotional_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_discount_analytics_code ON discount_analytics(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_analytics_campaign ON discount_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_discount_analytics_date ON discount_analytics(date);

-- Create Indexes for Review Management
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_verified ON product_reviews(verified_purchase);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON product_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order ON product_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_review_images_review ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_voter ON review_votes(voter_email);
CREATE INDEX IF NOT EXISTS idx_review_reports_review ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_product_rating_product ON product_rating_summaries(product_id);
CREATE INDEX IF NOT EXISTS idx_review_analytics_product ON review_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_review_analytics_date ON review_analytics(date);

-- Create Indexes for Wishlist System
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_email ON wishlists(customer_email);
CREATE INDEX IF NOT EXISTS idx_wishlists_public ON wishlists(is_public);
CREATE INDEX IF NOT EXISTS idx_wishlists_share_code ON wishlists(share_code);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_priority ON wishlist_items(priority);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created ON wishlist_items(created_at);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_wishlist ON wishlist_shares(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_email ON wishlist_shares(share_email);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_token ON wishlist_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_wishlist_price_history_item ON wishlist_price_history(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_price_history_date ON wishlist_price_history(created_at);
CREATE INDEX IF NOT EXISTS idx_wishlist_analytics_wishlist ON wishlist_analytics(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_analytics_user ON wishlist_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_analytics_date ON wishlist_analytics(date);
CREATE INDEX IF NOT EXISTS idx_wishlist_preferences_email ON wishlist_preferences(customer_email);

-- Create Views for Statistics
CREATE OR REPLACE VIEW customer_stats AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.tags,
  c.created_at,
  c.updated_at,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_spent,
  MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.email, c.phone, c.address, c.tags, c.created_at, c.updated_at;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  stripe_product_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'month',
  product_limit INTEGER NOT NULL DEFAULT 10,
  features TEXT[] DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Items Table
CREATE TABLE IF NOT EXISTS subscription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_subscription_item_id VARCHAR(255) UNIQUE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_invoice_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  description TEXT,
  pdf_url VARCHAR(500),
  hosted_invoice_url VARCHAR(500),
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_charge_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(100),
  receipt_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing Usage Table (for tracking product usage)
CREATE TABLE IF NOT EXISTS billing_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_charge_id ON payments(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_billing_usage_subscription_id ON billing_usage(subscription_id);

-- Create triggers for subscription timestamps
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_items_updated_at BEFORE UPDATE ON subscription_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_usage_updated_at BEFORE UPDATE ON billing_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for subscription tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_usage ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow all for now - adjust based on auth requirements)
CREATE POLICY "Allow all for subscription_plans" ON subscription_plans FOR ALL USING (true);
CREATE POLICY "Allow all for subscriptions" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all for subscription_items" ON subscription_items FOR ALL USING (true);
CREATE POLICY "Allow all for invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all for payments" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all for billing_usage" ON billing_usage FOR ALL USING (true);

-- Marketplace Integrations Tables

-- Marketplace Platforms (Shopee, Lazada, Facebook)
CREATE TABLE IF NOT EXISTS marketplace_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  icon_url VARCHAR(500),
  api_base_url VARCHAR(500),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Connections (User's API credentials per platform)
CREATE TABLE IF NOT EXISTS marketplace_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  platform_id UUID REFERENCES marketplace_platforms(id),
  platform_code VARCHAR(50) NOT NULL,
  shop_id VARCHAR(255),
  shop_name VARCHAR(255),
  access_token VARCHAR(500),
  refresh_token VARCHAR(500),
  shop_authorization_token VARCHAR(500),
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  webhook_secret VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Products (Sync from marketplace)
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  marketplace_product_id VARCHAR(255) NOT NULL,
  platform_code VARCHAR(50) NOT NULL,
  local_product_id UUID REFERENCES products(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  quantity_available INTEGER,
  image_url VARCHAR(500),
  marketplace_url VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform_code, marketplace_product_id, user_id)
);

-- Marketplace Orders (Orders from all platforms)
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  local_order_id UUID REFERENCES orders(id),
  marketplace_order_id VARCHAR(255) NOT NULL,
  platform_code VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  order_status VARCHAR(50),
  payment_status VARCHAR(50),
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'THB',
  shipping_address TEXT,
  items_count INTEGER,
  raw_data JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform_code, marketplace_order_id, user_id)
);

-- Marketplace Order Items
CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marketplace_order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  marketplace_product_id VARCHAR(255),
  product_name VARCHAR(255),
  quantity INTEGER,
  price DECIMAL(10, 2),
  variation_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Sync Logs
CREATE TABLE IF NOT EXISTS marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_duration_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Webhooks (For real-time updates)
CREATE TABLE IF NOT EXISTS marketplace_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE,
  webhook_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_user_id ON marketplace_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_platform_code ON marketplace_connections(platform_code);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_user_id ON marketplace_products(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_connection_id ON marketplace_products(connection_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_local_product_id ON marketplace_products(local_product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_user_id ON marketplace_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_connection_id ON marketplace_orders(connection_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_local_order_id ON marketplace_orders(local_order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_platform_code ON marketplace_orders(platform_code);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_marketplace_order_id ON marketplace_order_items(marketplace_order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_user_id ON marketplace_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_webhooks_connection_id ON marketplace_webhooks(connection_id);

-- Create Triggers for Marketplace
CREATE TRIGGER update_marketplace_platforms_updated_at BEFORE UPDATE ON marketplace_platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_connections_updated_at BEFORE UPDATE ON marketplace_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON marketplace_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_orders_updated_at BEFORE UPDATE ON marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_webhooks_updated_at BEFORE UPDATE ON marketplace_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for marketplace tables
ALTER TABLE marketplace_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_webhooks ENABLE ROW LEVEL SECURITY;

-- Create Policies for marketplace tables
CREATE POLICY "Allow all for marketplace_platforms" ON marketplace_platforms FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_connections" ON marketplace_connections FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_products" ON marketplace_products FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_orders" ON marketplace_orders FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_order_items" ON marketplace_order_items FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_sync_logs" ON marketplace_sync_logs FOR ALL USING (true);
CREATE POLICY "Allow all for marketplace_webhooks" ON marketplace_webhooks FOR ALL USING (true);

-- Analytics Tables

-- Daily Sales Metrics (for fast query performance)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_profit DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  returned_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Product Performance Metrics
CREATE TABLE IF NOT EXISTS product_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  date DATE NOT NULL,
  units_sold INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2) DEFAULT 0,
  returns INTEGER DEFAULT 0,
  rating_avg DECIMAL(3, 2),
  rank_by_revenue INTEGER,
  trend DECIMAL(5, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id, date)
);

-- Customer Analytics
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id),
  lifetime_value DECIMAL(12, 2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  first_purchase_date TIMESTAMP WITH TIME ZONE,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  days_since_purchase INTEGER,
  purchase_frequency DECIMAL(5, 2),
  segment VARCHAR(50),
  churn_risk DECIMAL(3, 2),
  rfm_score VARCHAR(10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Channel Performance (Marketplace, Online, Offline, etc)
CREATE TABLE IF NOT EXISTS channel_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  orders INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  conversion_rate DECIMAL(5, 2),
  cost_per_acquisition DECIMAL(10, 2),
  roi DECIMAL(5, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, channel, date)
);

-- Category Performance
CREATE TABLE IF NOT EXISTS category_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  orders INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2) DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  average_price DECIMAL(10, 2) DEFAULT 0,
  margin_percent DECIMAL(5, 2),
  trend DECIMAL(5, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, date)
);

-- Sales Forecast (AI/ML predictions)
CREATE TABLE IF NOT EXISTS sales_forecast (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  forecast_date DATE NOT NULL,
  predicted_orders INTEGER,
  predicted_revenue DECIMAL(12, 2),
  predicted_profit DECIMAL(12, 2),
  confidence_score DECIMAL(3, 2),
  model_version VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, forecast_date)
);

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  filters JSONB DEFAULT '{}',
  metrics TEXT[] DEFAULT '{}',
  date_range_start DATE,
  date_range_end DATE,
  is_scheduled BOOLEAN DEFAULT false,
  schedule_interval VARCHAR(50),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  export_format VARCHAR(20) DEFAULT 'pdf',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Storage
CREATE TABLE IF NOT EXISTS report_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_url VARCHAR(500),
  format VARCHAR(20),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly Detection
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  anomaly_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  detected_value DECIMAL(12, 2),
  expected_value DECIMAL(12, 2),
  deviation_percent DECIMAL(5, 2),
  affected_metric VARCHAR(100),
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_product_performance_user_date ON product_performance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_product_performance_product ON product_performance(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_user ON customer_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_segment ON customer_analytics(user_id, segment);
CREATE INDEX IF NOT EXISTS idx_channel_performance_user_date ON channel_performance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_category_performance_user_date ON category_performance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_forecast_user ON sales_forecast(user_id, forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_custom_reports_user ON custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_files_report ON report_files(report_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_user ON anomalies(user_id, created_at DESC);

-- Create Triggers for Analytics
CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_performance_updated_at BEFORE UPDATE ON product_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_analytics_updated_at BEFORE UPDATE ON customer_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_performance_updated_at BEFORE UPDATE ON channel_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_performance_updated_at BEFORE UPDATE ON category_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_forecast_updated_at BEFORE UPDATE ON sales_forecast
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Analytics
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

-- Create Policies for Analytics
CREATE POLICY "Allow all for daily_metrics" ON daily_metrics FOR ALL USING (true);
CREATE POLICY "Allow all for product_performance" ON product_performance FOR ALL USING (true);
CREATE POLICY "Allow all for customer_analytics" ON customer_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for channel_performance" ON channel_performance FOR ALL USING (true);
CREATE POLICY "Allow all for category_performance" ON category_performance FOR ALL USING (true);
CREATE POLICY "Allow all for sales_forecast" ON sales_forecast FOR ALL USING (true);
CREATE POLICY "Allow all for custom_reports" ON custom_reports FOR ALL USING (true);
CREATE POLICY "Allow all for report_files" ON report_files FOR ALL USING (true);
CREATE POLICY "Allow all for anomalies" ON anomalies FOR ALL USING (true);

-- Original Policies
-- Email & Notification Tables

-- Email Templates (Order confirmation, payment receipt, etc)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  preview_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, template_type)
);

-- Email Logs (Track all sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  template_type VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  provider VARCHAR(50),
  provider_id VARCHAR(255),
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced BOOLEAN DEFAULT false,
  bounced_reason TEXT,
  related_order_id UUID REFERENCES orders(id),
  related_customer_id UUID REFERENCES customers(id),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Triggers (When to send emails)
CREATE TABLE IF NOT EXISTS email_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  trigger_name VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  is_enabled BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0,
  recipient_type VARCHAR(50) NOT NULL,
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Queue (For sending emails asynchronously)
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  template_id UUID REFERENCES email_templates(id),
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  related_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Preferences (User settings for notifications)
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  daily_summary_enabled BOOLEAN DEFAULT true,
  daily_summary_time VARCHAR(5) DEFAULT '08:00',
  new_order_notification BOOLEAN DEFAULT true,
  payment_confirmation BOOLEAN DEFAULT true,
  low_stock_alert BOOLEAN DEFAULT true,
  low_stock_threshold INTEGER DEFAULT 10,
  customer_emails_enabled BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  weekly_analytics BOOLEAN DEFAULT true,
  monthly_report BOOLEAN DEFAULT true,
  promotional_emails BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Subscriptions (For customers to manage their preferences)
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  subscription_type VARCHAR(100) NOT NULL,
  is_subscribed BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, subscription_type)
);

-- Email Bounces & Complaints (For list management)
CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  bounce_type VARCHAR(50) NOT NULL,
  bounce_reason TEXT,
  is_permanent BOOLEAN DEFAULT false,
  first_bounce_at TIMESTAMP WITH TIME ZONE,
  last_bounce_at TIMESTAMP WITH TIME ZONE,
  bounce_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email)
);

-- Create Indexes for Email Tables
CREATE INDEX IF NOT EXISTS idx_email_templates_user_type ON email_templates(user_id, template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_status ON email_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_triggers_user_event ON email_triggers(user_id, trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_customer ON email_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_bounces_email ON email_bounces(email);

-- Create Triggers for Email Tables
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_triggers_updated_at BEFORE UPDATE ON email_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscriptions_updated_at BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_bounces_updated_at BEFORE UPDATE ON email_bounces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Email Tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_bounces ENABLE ROW LEVEL SECURITY;

-- Create Policies for Email Tables
CREATE POLICY "Allow all for email_templates" ON email_templates FOR ALL USING (true);
CREATE POLICY "Allow all for email_logs" ON email_logs FOR ALL USING (true);
CREATE POLICY "Allow all for email_triggers" ON email_triggers FOR ALL USING (true);
CREATE POLICY "Allow all for email_queue" ON email_queue FOR ALL USING (true);
CREATE POLICY "Allow all for email_preferences" ON email_preferences FOR ALL USING (true);
CREATE POLICY "Allow all for email_subscriptions" ON email_subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all for email_bounces" ON email_bounces FOR ALL USING (true);

-- Inventory Management Tables

-- Warehouses/Locations
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  warehouse_code VARCHAR(50) UNIQUE,
  address TEXT,
  phone VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Current Inventory Levels (Denormalized for fast queries)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  reorder_point INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 50,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  last_movement_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id, warehouse_id)
);

-- Stock Movements (Complete audit trail)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  movement_type VARCHAR(50) NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER,
  quantity_after INTEGER,
  reference_type VARCHAR(50),
  reference_id VARCHAR(255),
  reason TEXT,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reorder Management
CREATE TABLE IF NOT EXISTS reorder_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  min_stock INTEGER NOT NULL DEFAULT 10,
  max_stock INTEGER NOT NULL DEFAULT 100,
  reorder_quantity INTEGER NOT NULL DEFAULT 50,
  lead_time_days INTEGER DEFAULT 7,
  auto_reorder BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_reorder_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id, warehouse_id)
);

-- Stock Transfers Between Warehouses
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id UUID REFERENCES warehouses(id),
  quantity INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  shipped_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Barcodes/SKUs
CREATE TABLE IF NOT EXISTS barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  barcode VARCHAR(255) UNIQUE NOT NULL,
  barcode_type VARCHAR(50) DEFAULT 'ean13',
  quantity_per_unit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Counts/Physical Inventory
CREATE TABLE IF NOT EXISTS stock_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  count_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  total_items INTEGER DEFAULT 0,
  total_variance DECIMAL(12, 2) DEFAULT 0,
  variance_percentage DECIMAL(5, 2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, warehouse_id, count_date)
);

-- Stock Count Details
CREATE TABLE IF NOT EXISTS stock_count_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_count_id UUID REFERENCES stock_counts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  system_quantity INTEGER,
  counted_quantity INTEGER,
  variance INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Forecasting
CREATE TABLE IF NOT EXISTS inventory_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  forecast_date DATE NOT NULL,
  predicted_quantity INTEGER,
  confidence_score DECIMAL(3, 2),
  method VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id, warehouse_id, forecast_date)
);

-- ============================================
-- CUSTOMER MANAGEMENT (CRM) TABLES
-- ============================================

-- Enhanced Customer Profiles
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  company_name VARCHAR(255),
  industry VARCHAR(100),
  website VARCHAR(255),
  profile_picture VARCHAR(500),
  preferred_language VARCHAR(10),
  timezone VARCHAR(50),
  customer_type VARCHAR(50), -- retail, wholesale, distributor, etc
  source VARCHAR(100), -- where customer came from (direct, marketplace, referral, etc)
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, vip, at_risk, lost
  lifetime_value DECIMAL(12, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  average_order_value DECIMAL(10, 2),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type VARCHAR(50), -- billing, shipping, home, office
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  notification_push BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT true,
  promotional_offers BOOLEAN DEFAULT true,
  newsletter BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT false,
  order_notifications BOOLEAN DEFAULT true,
  communication_frequency VARCHAR(50), -- daily, weekly, monthly
  preferred_contact_method VARCHAR(50), -- email, phone, sms
  do_not_contact BOOLEAN DEFAULT false,
  gdpr_consent BOOLEAN DEFAULT false,
  gdpr_consent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Customer Segments
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  criteria JSONB, -- rules for segment membership
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Customer Segment Members
CREATE TABLE IF NOT EXISTS customer_segment_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(segment_id, customer_id)
);

-- Customer Tags
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  color VARCHAR(50),
  added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id, tag)
);

-- Customer Notes
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  note_type VARCHAR(50), -- internal, follow_up, reminder, complaint, compliment
  priority VARCHAR(50), -- low, medium, high
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Communications
CREATE TABLE IF NOT EXISTS customer_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  communication_type VARCHAR(50), -- email, sms, phone, chat, in_person, note
  subject VARCHAR(255),
  message TEXT,
  direction VARCHAR(20), -- inbound, outbound
  channel VARCHAR(50), -- email, marketplace_message, sms, phone, etc
  status VARCHAR(50), -- sent, delivered, opened, clicked, bounced, replied
  sent_by UUID,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- additional data like email_id, phone_number, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Interactions
CREATE TABLE IF NOT EXISTS customer_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50), -- visit, purchase, review, support, return, inquiry
  event_name VARCHAR(100),
  event_value DECIMAL(10, 2),
  page_url VARCHAR(500),
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Programs
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  program_type VARCHAR(50), -- points, tier, referral, vip
  is_active BOOLEAN DEFAULT true,
  point_multiplier DECIMAL(3, 2) DEFAULT 1,
  min_purchase_for_points DECIMAL(10, 2) DEFAULT 0,
  point_expiry_days INTEGER,
  tier_structure JSONB, -- tiers if applicable
  rewards JSONB, -- redemption options
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Customer Loyalty Points
CREATE TABLE IF NOT EXISTS customer_loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  loyalty_program_id UUID REFERENCES loyalty_programs(id) ON DELETE SET NULL,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  redeemed_points INTEGER DEFAULT 0,
  tier_level VARCHAR(50), -- if tier-based
  tier_since TIMESTAMP WITH TIME ZONE,
  points_expiry_date TIMESTAMP WITH TIME ZONE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id, loyalty_program_id)
);

-- Customer RFM Scores
CREATE TABLE IF NOT EXISTS customer_rfm_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  recency_score INTEGER, -- 1-5, how recent last purchase
  frequency_score INTEGER, -- 1-5, how often purchases
  monetary_score INTEGER, -- 1-5, how much spent
  overall_rfm_score DECIMAL(3, 1), -- weighted average
  rfm_segment VARCHAR(50), -- Champions, Loyal, At Risk, etc
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Customer Analytics
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  repeat_purchase_rate DECIMAL(5, 2) DEFAULT 0,
  product_preferences VARCHAR(500)[], -- most bought categories
  purchase_frequency_days INTEGER,
  churn_risk_score DECIMAL(3, 2), -- 0-1, likelihood to churn
  lifetime_value_predicted DECIMAL(12, 2),
  engagement_score DECIMAL(3, 2),
  satisfication_score DECIMAL(3, 2),
  nps_score INTEGER, -- Net Promoter Score -100 to 100
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Create Indexes for Customer Management
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_status ON customer_profiles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_ltv ON customer_profiles(user_id, lifetime_value DESC);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_date ON customer_profiles(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON customer_addresses(user_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_user ON customer_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_user ON customer_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_members_segment ON customer_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_members_customer ON customer_segment_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_user ON customer_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_customer ON customer_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_user ON customer_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_date ON customer_notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_communications_user ON customer_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_date ON customer_communications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_communications_status ON customer_communications(status);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_user ON customer_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_date ON customer_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_user ON loyalty_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_points_user ON customer_loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_rfm_scores_user ON customer_rfm_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_rfm_segment ON customer_rfm_scores(user_id, rfm_segment);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_user ON customer_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_churn ON customer_analytics(user_id, churn_risk_score DESC);

-- Create Triggers for Customer Management
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_preferences_updated_at BEFORE UPDATE ON customer_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON customer_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_communications_updated_at BEFORE UPDATE ON customer_communications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_loyalty_points_updated_at BEFORE UPDATE ON customer_loyalty_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_rfm_scores_updated_at BEFORE UPDATE ON customer_rfm_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_analytics_updated_at BEFORE UPDATE ON customer_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Indexes for Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_user_product ON inventory(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(user_id, quantity_available) WHERE quantity_available <= 20;
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_barcodes_product ON barcodes(product_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode ON barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_counts_warehouse_date ON stock_counts(warehouse_id, count_date DESC);
CREATE INDEX IF NOT EXISTS idx_warehouses_user ON warehouses(user_id);

-- Create Triggers for Inventory
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reorder_points_updated_at BEFORE UPDATE ON reorder_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_transfers_updated_at BEFORE UPDATE ON stock_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_counts_updated_at BEFORE UPDATE ON stock_counts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Inventory Tables
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_forecasts ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Customer Management Tables
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_rfm_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Discount Management Tables
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_analytics ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Review Management Tables
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_rating_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_analytics ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Wishlist System Tables
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_preferences ENABLE ROW LEVEL SECURITY;

-- Create Policies for Inventory Tables
CREATE POLICY "Allow all for warehouses" ON warehouses FOR ALL USING (true);
CREATE POLICY "Allow all for inventory" ON inventory FOR ALL USING (true);
CREATE POLICY "Allow all for stock_movements" ON stock_movements FOR ALL USING (true);
CREATE POLICY "Allow all for reorder_points" ON reorder_points FOR ALL USING (true);
CREATE POLICY "Allow all for stock_transfers" ON stock_transfers FOR ALL USING (true);
CREATE POLICY "Allow all for barcodes" ON barcodes FOR ALL USING (true);
CREATE POLICY "Allow all for stock_counts" ON stock_counts FOR ALL USING (true);
CREATE POLICY "Allow all for stock_count_items" ON stock_count_items FOR ALL USING (true);
CREATE POLICY "Allow all for inventory_forecasts" ON inventory_forecasts FOR ALL USING (true);

CREATE POLICY "Allow all for products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for order_items" ON order_items FOR ALL USING (true);

-- Create Policies for Customer Management Tables
CREATE POLICY "Allow all for customer_profiles" ON customer_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for customer_addresses" ON customer_addresses FOR ALL USING (true);
CREATE POLICY "Allow all for customer_preferences" ON customer_preferences FOR ALL USING (true);
CREATE POLICY "Allow all for customer_segments" ON customer_segments FOR ALL USING (true);
CREATE POLICY "Allow all for customer_segment_members" ON customer_segment_members FOR ALL USING (true);
CREATE POLICY "Allow all for customer_tags" ON customer_tags FOR ALL USING (true);
CREATE POLICY "Allow all for customer_notes" ON customer_notes FOR ALL USING (true);
CREATE POLICY "Allow all for customer_communications" ON customer_communications FOR ALL USING (true);
CREATE POLICY "Allow all for customer_interactions" ON customer_interactions FOR ALL USING (true);
CREATE POLICY "Allow all for loyalty_programs" ON loyalty_programs FOR ALL USING (true);
CREATE POLICY "Allow all for customer_loyalty_points" ON customer_loyalty_points FOR ALL USING (true);
CREATE POLICY "Allow all for customer_rfm_scores" ON customer_rfm_scores FOR ALL USING (true);
CREATE POLICY "Allow all for customer_analytics" ON customer_analytics FOR ALL USING (true);

-- Create Policies for Discount Management Tables
CREATE POLICY "Allow all for discount_codes" ON discount_codes FOR ALL USING (true);
CREATE POLICY "Allow all for discount_rules" ON discount_rules FOR ALL USING (true);
CREATE POLICY "Allow all for discount_code_products" ON discount_code_products FOR ALL USING (true);
CREATE POLICY "Allow all for discount_code_categories" ON discount_code_categories FOR ALL USING (true);
CREATE POLICY "Allow all for discount_code_segments" ON discount_code_segments FOR ALL USING (true);
CREATE POLICY "Allow all for coupon_redemptions" ON coupon_redemptions FOR ALL USING (true);
CREATE POLICY "Allow all for promotional_campaigns" ON promotional_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all for discount_analytics" ON discount_analytics FOR ALL USING (true);

-- Create Policies for Review Management Tables
CREATE POLICY "Allow all for product_reviews" ON product_reviews FOR ALL USING (true);
CREATE POLICY "Allow all for review_images" ON review_images FOR ALL USING (true);
CREATE POLICY "Allow all for review_votes" ON review_votes FOR ALL USING (true);
CREATE POLICY "Allow all for review_reports" ON review_reports FOR ALL USING (true);
CREATE POLICY "Allow all for product_rating_summaries" ON product_rating_summaries FOR ALL USING (true);
CREATE POLICY "Allow all for review_analytics" ON review_analytics FOR ALL USING (true);

-- Create Policies for Wishlist System Tables
CREATE POLICY "Allow all for wishlists" ON wishlists FOR ALL USING (true);
CREATE POLICY "Allow all for wishlist_items" ON wishlist_items FOR ALL USING (true);
CREATE POLICY "Allow all for wishlist_shares" ON wishlist_shares FOR ALL USING (true);
CREATE POLICY "Allow all for wishlist_price_history" ON wishlist_price_history FOR ALL USING (true);
CREATE POLICY "Allow all for wishlist_analytics" ON wishlist_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for wishlist_preferences" ON wishlist_preferences FOR ALL USING (true);

-- ============================================
-- LOYALTY & REWARDS MANAGEMENT SYSTEM TABLES
-- ============================================

-- Loyalty Program Tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL,
  tier_level INTEGER NOT NULL,
  min_points INTEGER DEFAULT 0,
  max_points INTEGER,
  min_annual_spending DECIMAL(12, 2) DEFAULT 0,
  max_annual_spending DECIMAL(12, 2),
  points_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  bonus_points_on_join INTEGER DEFAULT 0,
  exclusive_benefits TEXT[] DEFAULT '{}',
  color_hex VARCHAR(7),
  icon_url VARCHAR(500),
  is_vip BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, loyalty_program_id, tier_name)
);

-- Loyalty Point Rules (How customers earn points)
CREATE TABLE IF NOT EXISTS loyalty_point_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- purchase, review, referral, signup, birthday, social_share, etc
  trigger_event VARCHAR(100) NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_calculation_type VARCHAR(50), -- flat, percentage_of_amount, dynamic
  percentage_value DECIMAL(5, 2),
  min_transaction_amount DECIMAL(12, 2),
  max_points_per_transaction INTEGER,
  category_applicable TEXT[], -- for category-specific rules
  is_stackable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Rewards (What customers can redeem points for)
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  reward_name VARCHAR(255) NOT NULL,
  reward_type VARCHAR(50) NOT NULL, -- discount, free_product, free_shipping, upgrade, exclusive_access, etc
  reward_value DECIMAL(12, 2) NOT NULL,
  reward_unit VARCHAR(50), -- percent, amount, points, quantity
  points_required INTEGER NOT NULL,
  total_available_quantity INTEGER, -- null = unlimited
  claimed_quantity INTEGER DEFAULT 0,
  description TEXT,
  terms_conditions TEXT,
  image_url VARCHAR(500),
  tier_required VARCHAR(100), -- if tier-specific
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  expiry_days INTEGER, -- null = never expires
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Reward Redemptions
CREATE TABLE IF NOT EXISTS customer_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  loyalty_program_id UUID REFERENCES loyalty_programs(id) ON DELETE SET NULL,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redemption_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, claimed, used, expired, cancelled
  redemption_code VARCHAR(100) UNIQUE,
  order_applied_to UUID REFERENCES orders(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Point Transactions (Complete audit trail)
CREATE TABLE IF NOT EXISTS loyalty_point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  loyalty_program_id UUID REFERENCES loyalty_programs(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL, -- earned, redeemed, expired, adjusted, refunded
  points_amount INTEGER NOT NULL,
  points_before INTEGER,
  points_after INTEGER,
  related_order_id UUID REFERENCES orders(id),
  related_reward_id UUID REFERENCES loyalty_rewards(id),
  related_rule_id UUID REFERENCES loyalty_point_rules(id),
  description VARCHAR(255),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Tier History (Track customer tier progression)
CREATE TABLE IF NOT EXISTS loyalty_tier_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  loyalty_program_id UUID REFERENCES loyalty_programs(id) ON DELETE SET NULL,
  previous_tier_id UUID REFERENCES loyalty_tiers(id),
  new_tier_id UUID NOT NULL REFERENCES loyalty_tiers(id),
  promotion_reason VARCHAR(100), -- points_milestone, spending_threshold, birthday_promotion, admin_adjustment, etc
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  downgrade_reason VARCHAR(100),
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Promotions (Special campaigns)
CREATE TABLE IF NOT EXISTS loyalty_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  promotion_name VARCHAR(255) NOT NULL,
  promotion_type VARCHAR(50), -- bonus_points, double_points, tier_bonus, birthday, anniversary, seasonal
  description TEXT,
  points_multiplier DECIMAL(3, 2) DEFAULT 2.0,
  bonus_points_fixed INTEGER,
  min_transaction_amount DECIMAL(12, 2),
  max_bonus_points INTEGER,
  target_customer_segment VARCHAR(50), -- all, new, vip, at_risk, birthday
  applicable_categories TEXT[],
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  promotion_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Analytics
CREATE TABLE IF NOT EXISTS loyalty_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  loyalty_program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE,
  total_active_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  points_issued INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  points_expired INTEGER DEFAULT 0,
  rewards_claimed INTEGER DEFAULT 0,
  rewards_used INTEGER DEFAULT 0,
  avg_points_per_member DECIMAL(10, 2),
  tier_distribution JSONB, -- tier_name: count
  engagement_rate DECIMAL(5, 2),
  repeat_purchase_rate DECIMAL(5, 2),
  revenue_from_loyalty_purchases DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Referral Rewards
CREATE TABLE IF NOT EXISTS loyalty_referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  referrer_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referred_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  referrer_points INTEGER DEFAULT 0,
  referred_customer_discount DECIMAL(5, 2), -- percentage discount
  referred_customer_points INTEGER DEFAULT 0,
  referral_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled, expired
  referred_customer_made_purchase BOOLEAN DEFAULT false,
  purchase_date TIMESTAMP WITH TIME ZONE,
  minimum_purchase_amount DECIMAL(12, 2),
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Loyalty & Rewards
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_program ON loyalty_tiers(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_level ON loyalty_tiers(user_id, tier_level);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_rules_program ON loyalty_point_rules(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_rules_type ON loyalty_point_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_rules_active ON loyalty_point_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_program ON loyalty_rewards(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_type ON loyalty_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_active ON loyalty_rewards(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_customer_reward_redemptions_customer ON customer_reward_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_reward_redemptions_status ON customer_reward_redemptions(redemption_status);
CREATE INDEX IF NOT EXISTS idx_customer_reward_redemptions_date ON customer_reward_redemptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_reward_redemptions_code ON customer_reward_redemptions(redemption_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_transactions_customer ON loyalty_point_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_transactions_type ON loyalty_point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_transactions_date ON loyalty_point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_point_transactions_order ON loyalty_point_transactions(related_order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_history_customer ON loyalty_tier_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_history_date ON loyalty_tier_history(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_promotions_program ON loyalty_promotions(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_promotions_active ON loyalty_promotions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_loyalty_promotions_date ON loyalty_promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_analytics_program ON loyalty_analytics(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_analytics_date ON loyalty_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_referral_code ON loyalty_referral_rewards(referral_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_referral_customer ON loyalty_referral_rewards(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_referral_status ON loyalty_referral_rewards(referral_status);

-- Create Triggers for Loyalty & Rewards
CREATE TRIGGER update_loyalty_tiers_updated_at BEFORE UPDATE ON loyalty_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_point_rules_updated_at BEFORE UPDATE ON loyalty_point_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON loyalty_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_reward_redemptions_updated_at BEFORE UPDATE ON customer_reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_promotions_updated_at BEFORE UPDATE ON loyalty_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_referral_rewards_updated_at BEFORE UPDATE ON loyalty_referral_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Loyalty & Rewards Tables
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_point_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tier_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create Policies for Loyalty & Rewards Tables
CREATE POLICY "Allow all for loyalty_tiers" ON loyalty_tiers FOR ALL USING (true);
CREATE POLICY "Allow all for loyalty_point_rules" ON loyalty_point_rules FOR ALL USING (true);
CREATE POLICY "Allow all for loyalty_rewards" ON loyalty_rewards FOR ALL USING (true);
CREATE POLICY "Allow all for customer_reward_redemptions" ON customer_reward_redemptions FOR ALL USING (true);
CREATE POLICY "Allow all for loyalty_point_transactions" ON loyalty_point_transactions FOR ALL USING (true);
CREATE POLICY "Allow all for loyalty_tier_history" ON loyalty_tier_history FOR ALL USING (true);
CREATE POLICY "Allow all for loyalty_promotions" ON loyalty_promotions FOR ALL USING (true);
CREATE POLICY "Allow all for loyalty_analytics" ON loyalty_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for loyalty_referral_rewards" ON loyalty_referral_rewards FOR ALL USING (true);

-- ============================================
-- SMS & TEXT MESSAGE NOTIFICATIONS TABLES
-- ============================================

-- SMS Providers Configuration
CREATE TABLE IF NOT EXISTS sms_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  provider_name VARCHAR(100) NOT NULL, -- Twilio, AWS SNS, Nexmo, etc
  is_active BOOLEAN DEFAULT true,
  api_key VARCHAR(255) ENCRYPTED,
  api_secret VARCHAR(255) ENCRYPTED,
  account_sid VARCHAR(255), -- For Twilio
  auth_token VARCHAR(255) ENCRYPTED, -- For Twilio
  sender_id VARCHAR(50), -- Phone number or alphanumeric ID
  monthly_quota INTEGER,
  current_usage INTEGER DEFAULT 0,
  supported_countries TEXT[], -- List of country codes
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider_name)
);

-- SMS Templates
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- order_confirmation, shipping_update, payment_reminder, verification, promotional, etc
  content TEXT NOT NULL, -- Max 160 characters for single SMS
  variables TEXT[] DEFAULT '{}', -- {{customer_name}}, {{order_id}}, etc
  character_count INTEGER,
  sms_count INTEGER, -- How many SMS segments (160 chars = 1 segment)
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  preview_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, template_type)
);

-- SMS Triggers (When to send SMS)
CREATE TABLE IF NOT EXISTS sms_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  trigger_name VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL, -- order_placed, payment_received, order_shipped, delivery_confirmed, etc
  template_id UUID REFERENCES sms_templates(id),
  is_enabled BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0, -- Send after N minutes
  recipient_type VARCHAR(50) NOT NULL, -- customer, merchant, both
  conditions JSONB DEFAULT '{}', -- Additional conditions for sending
  max_frequency_hours INTEGER, -- Prevent sending more than X hours apart
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Logs (Track all sent SMS)
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),
  template_type VARCHAR(50),
  content TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, queued, sent, delivered, failed, bounced
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  delivery_status VARCHAR(50), -- delivered, undelivered, queued
  failure_reason TEXT,
  failure_code VARCHAR(50),
  segments_used INTEGER DEFAULT 1,
  cost DECIMAL(10, 4),
  related_order_id UUID REFERENCES orders(id),
  related_customer_id UUID REFERENCES customers(id),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Queue (For sending SMS asynchronously)
CREATE TABLE IF NOT EXISTS sms_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),
  template_id UUID REFERENCES sms_templates(id),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, sent, failed
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  related_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Preferences (Customer SMS settings)
CREATE TABLE IF NOT EXISTS sms_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20) NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  verification_code VARCHAR(6),
  verification_attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  order_notifications BOOLEAN DEFAULT true,
  order_confirmation BOOLEAN DEFAULT true,
  shipping_updates BOOLEAN DEFAULT true,
  delivery_confirmation BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  promotional_offers BOOLEAN DEFAULT false,
  cart_abandonment BOOLEAN DEFAULT false,
  loyalty_rewards BOOLEAN DEFAULT true,
  is_opted_in BOOLEAN DEFAULT true,
  opted_in_date TIMESTAMP WITH TIME ZONE,
  opted_out_date TIMESTAMP WITH TIME ZONE,
  opted_out_reason VARCHAR(100),
  do_not_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- SMS Campaigns (Bulk promotional SMS)
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50), -- promotional, transactional, reminder, verification
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, active, paused, completed, cancelled
  template_id UUID REFERENCES sms_templates(id),
  content TEXT,
  target_audience VARCHAR(50), -- all, segment, vip, at_risk, new_customers, birthday
  target_segment_id UUID, -- Reference to customer segment
  recipient_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  budget_limit DECIMAL(12, 2),
  total_cost DECIMAL(12, 2) DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Analytics
CREATE TABLE IF NOT EXISTS sms_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date TIMESTAMP WITH TIME ZONE,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_cost DECIMAL(12, 2) DEFAULT 0,
  segments_used INTEGER DEFAULT 0,
  delivery_rate DECIMAL(5, 2),
  failure_rate DECIMAL(5, 2),
  bounce_rate DECIMAL(5, 2),
  avg_segments_per_message DECIMAL(3, 2),
  unique_recipients INTEGER DEFAULT 0,
  campaign_id UUID REFERENCES sms_campaigns(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Bounce Management
CREATE TABLE IF NOT EXISTS sms_bounces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  bounce_type VARCHAR(50) NOT NULL, -- permanent, temporary, invalid
  bounce_reason TEXT,
  is_permanent BOOLEAN DEFAULT false,
  first_bounce_at TIMESTAMP WITH TIME ZONE,
  last_bounce_at TIMESTAMP WITH TIME ZONE,
  bounce_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, phone_number)
);

-- SMS Compliance & Consent
CREATE TABLE IF NOT EXISTS sms_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  phone_number VARCHAR(20),
  consent_type VARCHAR(50), -- marketing, transactional, all
  consent_status VARCHAR(50), -- opted_in, opted_out, pending, revoked
  consent_date TIMESTAMP WITH TIME ZONE,
  consent_method VARCHAR(50), -- web_form, phone_call, sms, email
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  regulatory_framework VARCHAR(50), -- TCPA, GDPR, PDPA, etc
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for SMS
CREATE INDEX IF NOT EXISTS idx_sms_templates_user_type ON sms_templates(user_id, template_type);
CREATE INDEX IF NOT EXISTS idx_sms_triggers_user_event ON sms_triggers(user_id, trigger_event);
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_status ON sms_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON sms_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_order ON sms_logs(related_order_id);
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON sms_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_scheduled ON sms_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sms_preferences_customer ON sms_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_preferences_phone ON sms_preferences(customer_phone);
CREATE INDEX IF NOT EXISTS idx_sms_preferences_opted_in ON sms_preferences(user_id, is_opted_in);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_status ON sms_campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled ON sms_campaigns(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sms_analytics_user_date ON sms_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sms_bounces_phone ON sms_bounces(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_compliance_customer ON sms_compliance(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_compliance_phone ON sms_compliance(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_compliance_status ON sms_compliance(consent_status);

-- Create Triggers for SMS
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_triggers_updated_at BEFORE UPDATE ON sms_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_logs_updated_at BEFORE UPDATE ON sms_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_queue_updated_at BEFORE UPDATE ON sms_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_preferences_updated_at BEFORE UPDATE ON sms_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_campaigns_updated_at BEFORE UPDATE ON sms_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_bounces_updated_at BEFORE UPDATE ON sms_bounces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_compliance_updated_at BEFORE UPDATE ON sms_compliance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for SMS Tables
ALTER TABLE sms_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_bounces ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_compliance ENABLE ROW LEVEL SECURITY;

-- Create Policies for SMS Tables
CREATE POLICY "Allow all for sms_providers" ON sms_providers FOR ALL USING (true);
CREATE POLICY "Allow all for sms_templates" ON sms_templates FOR ALL USING (true);
CREATE POLICY "Allow all for sms_triggers" ON sms_triggers FOR ALL USING (true);
CREATE POLICY "Allow all for sms_logs" ON sms_logs FOR ALL USING (true);
CREATE POLICY "Allow all for sms_queue" ON sms_queue FOR ALL USING (true);
CREATE POLICY "Allow all for sms_preferences" ON sms_preferences FOR ALL USING (true);
CREATE POLICY "Allow all for sms_campaigns" ON sms_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all for sms_analytics" ON sms_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for sms_bounces" ON sms_bounces FOR ALL USING (true);
CREATE POLICY "Allow all for sms_compliance" ON sms_compliance FOR ALL USING (true);

-- ============================================
-- EMAIL MARKETING & CAMPAIGNS SYSTEM TABLES
-- ============================================

-- Email Providers Configuration
CREATE TABLE IF NOT EXISTS email_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  provider_name VARCHAR(100) NOT NULL, -- SendGrid, AWS SES, Mailgun, MailerLite, Brevo
  is_active BOOLEAN DEFAULT true,
  api_key VARCHAR(255) ENCRYPTED,
  api_secret VARCHAR(255) ENCRYPTED,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(100),
  reply_to_email VARCHAR(255),
  monthly_quota INTEGER,
  current_usage INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5, 2) DEFAULT 0,
  spam_rate DECIMAL(5, 2) DEFAULT 0,
  reputation_score DECIMAL(3, 1),
  supported_countries TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider_name)
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- order_confirmation, shipping_update, payment_reminder, newsletter, promotional, welcome, password_reset, etc
  subject_line VARCHAR(255) NOT NULL,
  preheader_text VARCHAR(150),
  html_content TEXT NOT NULL,
  plain_text_content TEXT,
  variables TEXT[] DEFAULT '{}', -- {{customer_name}}, {{order_id}}, {{discount_code}}, etc
  category VARCHAR(100),
  thumbnail_url VARCHAR(500),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_responsive BOOLEAN DEFAULT true,
  preview_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, template_type)
);

-- Email Triggers (When to send emails)
CREATE TABLE IF NOT EXISTS email_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  trigger_name VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL, -- order_placed, payment_received, order_shipped, delivery_confirmed, cart_abandoned, user_signup, birthday, anniversary, etc
  template_id UUID REFERENCES email_templates(id),
  is_enabled BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0, -- Send after N minutes
  recipient_type VARCHAR(50) NOT NULL, -- customer, merchant, both
  conditions JSONB DEFAULT '{}', -- Additional conditions for sending
  max_frequency_hours INTEGER, -- Prevent sending more than X hours apart
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Logs (Track all sent emails)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  template_type VARCHAR(50),
  subject_line VARCHAR(255) NOT NULL,
  email_body TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, queued, sent, delivered, bounced, complained, opened, clicked
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  delivery_status VARCHAR(50), -- delivered, undelivered, bounced, complained
  open_status VARCHAR(50), -- opened, not_opened
  bounce_type VARCHAR(50), -- hard_bounce, soft_bounce, complaint
  bounce_reason TEXT,
  failure_reason TEXT,
  failure_code VARCHAR(50),
  click_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  related_order_id UUID REFERENCES orders(id),
  related_customer_id UUID REFERENCES customers(id),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Queue (For sending emails asynchronously)
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  template_id UUID REFERENCES email_templates(id),
  subject_line VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  plain_text_content TEXT,
  variables JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, sent, failed
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  related_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Preferences (Customer email settings)
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email_address VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  all_emails BOOLEAN DEFAULT true,
  order_notifications BOOLEAN DEFAULT true,
  order_confirmation BOOLEAN DEFAULT true,
  shipping_updates BOOLEAN DEFAULT true,
  delivery_confirmation BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  promotional_offers BOOLEAN DEFAULT true,
  newsletter BOOLEAN DEFAULT true,
  product_recommendations BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT false,
  birthday_offers BOOLEAN DEFAULT true,
  flash_sales BOOLEAN DEFAULT true,
  abandoned_cart BOOLEAN DEFAULT false,
  is_opted_in BOOLEAN DEFAULT true,
  opted_in_date TIMESTAMP WITH TIME ZONE,
  opted_out_date TIMESTAMP WITH TIME ZONE,
  opted_out_reason VARCHAR(255),
  do_not_contact BOOLEAN DEFAULT false,
  unsubscribe_token VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Email Campaigns (Bulk marketing emails)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50), -- newsletter, promotional, transactional, welcome, educational, seasonal, cart_recovery
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, active, paused, completed, cancelled
  template_id UUID REFERENCES email_templates(id),
  subject_line VARCHAR(255),
  preheader_text VARCHAR(150),
  html_content TEXT,
  plain_text_content TEXT,
  target_audience VARCHAR(50), -- all, segment, vip, at_risk, new_customers, birthday, inactive
  target_segment_id UUID, -- Reference to customer segment
  recipient_count INTEGER DEFAULT 0,
  segment_filter JSONB DEFAULT '{}', -- Dynamic segment criteria
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  budget_limit DECIMAL(12, 2),
  total_cost DECIMAL(12, 2) DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  complained_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12, 2) DEFAULT 0,
  open_rate DECIMAL(5, 2),
  click_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Analytics
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date TIMESTAMP WITH TIME ZONE,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_complained INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  delivery_rate DECIMAL(5, 2),
  bounce_rate DECIMAL(5, 2),
  complaint_rate DECIMAL(5, 2),
  open_rate DECIMAL(5, 2),
  click_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  revenue_per_email DECIMAL(10, 2),
  unique_recipients INTEGER DEFAULT 0,
  campaign_id UUID REFERENCES email_campaigns(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Bounce Management
CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  bounce_type VARCHAR(50) NOT NULL, -- hard_bounce, soft_bounce, complaint
  bounce_reason TEXT,
  is_permanent BOOLEAN DEFAULT false,
  first_bounce_at TIMESTAMP WITH TIME ZONE,
  last_bounce_at TIMESTAMP WITH TIME ZONE,
  bounce_count INTEGER DEFAULT 1,
  suppression_status VARCHAR(50), -- active, inactive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, email_address)
);

-- Email Compliance & Consent
CREATE TABLE IF NOT EXISTS email_compliance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  email_address VARCHAR(255),
  consent_type VARCHAR(50), -- marketing, transactional, newsletter, promotional
  consent_status VARCHAR(50), -- opted_in, opted_out, pending, revoked, unsupported
  consent_date TIMESTAMP WITH TIME ZONE,
  consent_method VARCHAR(50), -- web_form, email, import, api, import_without_consent
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  regulatory_framework VARCHAR(50), -- CAN-SPAM, GDPR, CASL, PECR, etc
  double_opt_in_date TIMESTAMP WITH TIME ZONE,
  list_id VARCHAR(100), -- Which mailing list
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Email
CREATE INDEX IF NOT EXISTS idx_email_templates_user_type ON email_templates(user_id, template_type);
CREATE INDEX IF NOT EXISTS idx_email_triggers_user_event ON email_triggers(user_id, trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_status ON email_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs(related_order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_opened ON email_logs(user_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_preferences_customer ON email_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email_address);
CREATE INDEX IF NOT EXISTS idx_email_preferences_opted_in ON email_preferences(user_id, is_opted_in);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_status ON email_campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON email_campaigns(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_analytics_user_date ON email_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_email_bounces_email ON email_bounces(email_address);
CREATE INDEX IF NOT EXISTS idx_email_bounces_permanent ON email_bounces(user_id, is_permanent);
CREATE INDEX IF NOT EXISTS idx_email_compliance_customer ON email_compliance(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_compliance_email ON email_compliance(email_address);
CREATE INDEX IF NOT EXISTS idx_email_compliance_status ON email_compliance(consent_status);

-- Create Triggers for Email
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_triggers_updated_at BEFORE UPDATE ON email_triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_bounces_updated_at BEFORE UPDATE ON email_bounces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_compliance_updated_at BEFORE UPDATE ON email_compliance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Email Tables
ALTER TABLE email_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_bounces ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_compliance ENABLE ROW LEVEL SECURITY;

-- Create Policies for Email Tables
CREATE POLICY "Allow all for email_providers" ON email_providers FOR ALL USING (true);
CREATE POLICY "Allow all for email_templates" ON email_templates FOR ALL USING (true);
CREATE POLICY "Allow all for email_triggers" ON email_triggers FOR ALL USING (true);
CREATE POLICY "Allow all for email_logs" ON email_logs FOR ALL USING (true);
CREATE POLICY "Allow all for email_queue" ON email_queue FOR ALL USING (true);
CREATE POLICY "Allow all for email_preferences" ON email_preferences FOR ALL USING (true);
CREATE POLICY "Allow all for email_campaigns" ON email_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all for email_analytics" ON email_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for email_bounces" ON email_bounces FOR ALL USING (true);
CREATE POLICY "Allow all for email_compliance" ON email_compliance FOR ALL USING (true);

-- ============================================
-- CUSTOMER SEGMENTATION & BEHAVIORAL ANALYTICS TABLES
-- ============================================

-- Segment Definitions
CREATE TABLE IF NOT EXISTS customer_segments_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  segment_type VARCHAR(50) NOT NULL, -- rfm, behavioral, cohort, custom, demographic, value-based
  criteria JSONB DEFAULT '{}', -- Segment membership rules
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Segment Memberships
CREATE TABLE IF NOT EXISTS segment_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  segment_id UUID NOT NULL REFERENCES customer_segments_v2(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(segment_id, customer_id)
);

-- Customer Behavior Events
CREATE TABLE IF NOT EXISTS customer_behavior_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- page_view, product_view, add_to_cart, purchase, review, wishlist, email_open, email_click, sms_open, etc
  event_category VARCHAR(50), -- website, email, sms, app, support
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255),
  product_category VARCHAR(100),
  event_value DECIMAL(10, 2),
  event_properties JSONB DEFAULT '{}',
  page_url VARCHAR(500),
  referrer_url VARCHAR(500),
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  device_type VARCHAR(50), -- desktop, mobile, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  location JSONB, -- country, state, city
  session_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Behavior Summary (Aggregated for Performance)
CREATE TABLE IF NOT EXISTS customer_behavior_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  total_page_views INTEGER DEFAULT 0,
  total_product_views INTEGER DEFAULT 0,
  total_add_to_cart INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_wishlist_adds INTEGER DEFAULT 0,
  total_email_opens INTEGER DEFAULT 0,
  total_email_clicks INTEGER DEFAULT 0,
  total_sms_opens INTEGER DEFAULT 0,
  avg_session_duration_minutes DECIMAL(10, 2),
  favorite_product_category VARCHAR(100),
  favorite_brand VARCHAR(255),
  device_preference VARCHAR(50),
  preferred_browser VARCHAR(100),
  preferred_channel VARCHAR(50), -- website, email, sms, app
  engagement_score DECIMAL(3, 2), -- 0-1
  purchase_stage VARCHAR(50), -- awareness, consideration, decision, retention, churn_risk
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Cohort Analysis
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  cohort_name VARCHAR(255) NOT NULL,
  cohort_type VARCHAR(50), -- acquisition, behavior, value
  acquisition_start_date DATE,
  acquisition_end_date DATE,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, cohort_name)
);

-- Cohort Members
CREATE TABLE IF NOT EXISTS cohort_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  acquired_date DATE,
  UNIQUE(cohort_id, customer_id)
);

-- Customer Journey Stages
CREATE TABLE IF NOT EXISTS customer_journey_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  current_stage VARCHAR(50) NOT NULL, -- awareness, consideration, decision, retention, advocacy, churn_risk
  stage_entered_at TIMESTAMP WITH TIME ZONE,
  days_in_stage INTEGER DEFAULT 0,
  previous_stage VARCHAR(50),
  stage_history JSONB DEFAULT '[]', -- Array of stage transitions
  exit_reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Customer Lifetime Value Predictions
CREATE TABLE IF NOT EXISTS customer_ltv_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  current_ltv DECIMAL(12, 2),
  predicted_ltv_1year DECIMAL(12, 2),
  predicted_ltv_3year DECIMAL(12, 2),
  predicted_ltv_5year DECIMAL(12, 2),
  churn_probability DECIMAL(5, 2), -- 0-100
  growth_potential VARCHAR(50), -- high, medium, low
  confidence_score DECIMAL(3, 2), -- 0-1
  prediction_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, customer_id)
);

-- Behavioral Analytics
CREATE TABLE IF NOT EXISTS behavioral_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE,
  segment_id UUID REFERENCES customer_segments_v2(id),
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  active_customers INTEGER DEFAULT 0,
  at_risk_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_product_views INTEGER DEFAULT 0,
  total_add_to_cart INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2),
  avg_session_duration_minutes DECIMAL(10, 2),
  bounce_rate DECIMAL(5, 2),
  repeat_purchase_rate DECIMAL(5, 2),
  avg_order_value DECIMAL(10, 2),
  revenue DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Segment Performance Metrics
CREATE TABLE IF NOT EXISTS segment_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  segment_id UUID NOT NULL REFERENCES customer_segments_v2(id) ON DELETE CASCADE,
  date DATE,
  member_count INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  churn_rate DECIMAL(5, 2),
  lifetime_value DECIMAL(12, 2),
  avg_order_value DECIMAL(10, 2),
  purchase_frequency DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  email_open_rate DECIMAL(5, 2),
  email_click_rate DECIMAL(5, 2),
  sms_open_rate DECIMAL(5, 2),
  engagement_score DECIMAL(3, 2),
  revenue_generated DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Segmentation
CREATE INDEX IF NOT EXISTS idx_customer_segments_v2_user ON customer_segments_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_v2_type ON customer_segments_v2(user_id, segment_type);
CREATE INDEX IF NOT EXISTS idx_customer_segments_v2_active ON customer_segments_v2(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_segment_members_segment ON segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_members_customer ON segment_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_segment_members_user ON segment_members(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_customer ON customer_behavior_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_behavior_events_type ON customer_behavior_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behavior_events_date ON customer_behavior_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_user ON customer_behavior_events(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_summary_user ON customer_behavior_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_summary_stage ON customer_behavior_summary(purchase_stage);
CREATE INDEX IF NOT EXISTS idx_cohorts_user ON cohorts(user_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_active ON cohorts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_customer ON cohort_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_journey_stages_customer ON customer_journey_stages(customer_id);
CREATE INDEX IF NOT EXISTS idx_journey_stages_stage ON customer_journey_stages(user_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_ltv_predictions_user ON customer_ltv_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ltv_predictions_churn ON customer_ltv_predictions(user_id, churn_probability DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_user_date ON behavioral_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_segment ON behavioral_analytics(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_performance_segment_date ON segment_performance(segment_id, date DESC);

-- Create Triggers for Segmentation
CREATE TRIGGER update_customer_segments_v2_updated_at BEFORE UPDATE ON customer_segments_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_behavior_summary_updated_at BEFORE UPDATE ON customer_behavior_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_journey_stages_updated_at BEFORE UPDATE ON customer_journey_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_ltv_predictions_updated_at BEFORE UPDATE ON customer_ltv_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Segmentation Tables
ALTER TABLE customer_segments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_behavior_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_ltv_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_performance ENABLE ROW LEVEL SECURITY;

-- Create Policies for Segmentation Tables
CREATE POLICY "Allow all for customer_segments_v2" ON customer_segments_v2 FOR ALL USING (true);
CREATE POLICY "Allow all for segment_members" ON segment_members FOR ALL USING (true);
CREATE POLICY "Allow all for customer_behavior_events" ON customer_behavior_events FOR ALL USING (true);
CREATE POLICY "Allow all for customer_behavior_summary" ON customer_behavior_summary FOR ALL USING (true);
CREATE POLICY "Allow all for cohorts" ON cohorts FOR ALL USING (true);
CREATE POLICY "Allow all for cohort_members" ON cohort_members FOR ALL USING (true);
CREATE POLICY "Allow all for customer_journey_stages" ON customer_journey_stages FOR ALL USING (true);
CREATE POLICY "Allow all for customer_ltv_predictions" ON customer_ltv_predictions FOR ALL USING (true);
CREATE POLICY "Allow all for behavioral_analytics" ON behavioral_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for segment_performance" ON segment_performance FOR ALL USING (true);

-- ============================================
-- PRODUCT RECOMMENDATIONS SYSTEM
-- ============================================

-- Recommendation Algorithms Configuration
CREATE TABLE IF NOT EXISTS recommendation_algorithms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  algorithm_type VARCHAR(100) NOT NULL,
  algorithm_name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product Embeddings
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  embedding_model VARCHAR(100),
  embedding_vector FLOAT8[],
  category_embedding FLOAT8[],
  quality_score DECIMAL(5, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product Relationships
CREATE TABLE IF NOT EXISTS product_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id_1 UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_id_2 UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  strength DECIMAL(5, 2),
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product Recommendations
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  recommended_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommendation_reason VARCHAR(255),
  rank_position INTEGER,
  relevance_score DECIMAL(5, 2),
  algorithm_type VARCHAR(100),
  recommendation_context VARCHAR(100),
  is_shown BOOLEAN DEFAULT false,
  shown_at TIMESTAMP WITH TIME ZONE,
  is_clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  is_purchased BOOLEAN DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation Click Tracking
CREATE TABLE IF NOT EXISTS recommendation_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  recommendation_id UUID REFERENCES product_recommendations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  device_type VARCHAR(50),
  referrer_page VARCHAR(255)
);

-- Recommendation Conversions
CREATE TABLE IF NOT EXISTS recommendation_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  recommendation_id UUID REFERENCES product_recommendations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  revenue DECIMAL(10, 2),
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation Rules
CREATE TABLE IF NOT EXISTS recommendation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100),
  condition_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  condition_category VARCHAR(100),
  condition_segment_id UUID,
  condition_price_min DECIMAL(10, 2),
  condition_price_max DECIMAL(10, 2),
  recommended_product_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation Analytics
CREATE TABLE IF NOT EXISTS recommendation_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE,
  algorithm_type VARCHAR(100),
  total_recommendations INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  revenue_generated DECIMAL(12, 2),
  avg_relevance_score DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation Performance by Product
CREATE TABLE IF NOT EXISTS recommendation_product_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date DATE,
  times_recommended INTEGER DEFAULT 0,
  times_clicked INTEGER DEFAULT 0,
  times_purchased INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2),
  click_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personalization Preferences
CREATE TABLE IF NOT EXISTS personalization_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  max_recommendations INTEGER DEFAULT 5,
  preferred_categories VARCHAR[] DEFAULT '{}',
  excluded_categories VARCHAR[] DEFAULT '{}',
  preferred_price_range_min DECIMAL(10, 2),
  preferred_price_range_max DECIMAL(10, 2),
  exclude_already_viewed BOOLEAN DEFAULT true,
  exclude_already_purchased BOOLEAN DEFAULT true,
  enable_trending BOOLEAN DEFAULT true,
  enable_similar BOOLEAN DEFAULT true,
  enable_seasonal BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Recommendations
CREATE INDEX IF NOT EXISTS idx_recommendation_algorithms_user ON recommendation_algorithms(user_id);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_product ON product_embeddings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_user ON product_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_product_relationships_product1 ON product_relationships(product_id_1);
CREATE INDEX IF NOT EXISTS idx_product_relationships_product2 ON product_relationships(product_id_2);
CREATE INDEX IF NOT EXISTS idx_product_relationships_type ON product_relationships(user_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_customer ON product_recommendations(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_product ON product_recommendations(recommended_product_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_context ON product_recommendations(recommendation_context);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_user_date ON product_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_clicks_customer ON recommendation_clicks(customer_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_clicks_product ON recommendation_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_conversions_customer ON recommendation_conversions(customer_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_conversions_product ON recommendation_conversions(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_user ON recommendation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_active ON recommendation_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_user_date ON recommendation_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_algorithm ON recommendation_analytics(algorithm_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_product_performance_product ON recommendation_product_performance(product_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_personalization_preferences_customer ON personalization_preferences(customer_id);

-- Create Triggers for Recommendations
CREATE TRIGGER update_recommendation_algorithms_updated_at BEFORE UPDATE ON recommendation_algorithms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_embeddings_updated_at BEFORE UPDATE ON product_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_relationships_updated_at BEFORE UPDATE ON product_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendation_rules_updated_at BEFORE UPDATE ON recommendation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalization_preferences_updated_at BEFORE UPDATE ON personalization_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Recommendations Tables
ALTER TABLE recommendation_algorithms ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_product_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_preferences ENABLE ROW LEVEL SECURITY;

-- Create Policies for Recommendations Tables
CREATE POLICY "Allow all for recommendation_algorithms" ON recommendation_algorithms FOR ALL USING (true);
CREATE POLICY "Allow all for product_embeddings" ON product_embeddings FOR ALL USING (true);
CREATE POLICY "Allow all for product_relationships" ON product_relationships FOR ALL USING (true);
CREATE POLICY "Allow all for product_recommendations" ON product_recommendations FOR ALL USING (true);
CREATE POLICY "Allow all for recommendation_clicks" ON recommendation_clicks FOR ALL USING (true);
CREATE POLICY "Allow all for recommendation_conversions" ON recommendation_conversions FOR ALL USING (true);
CREATE POLICY "Allow all for recommendation_rules" ON recommendation_rules FOR ALL USING (true);
CREATE POLICY "Allow all for recommendation_analytics" ON recommendation_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for recommendation_product_performance" ON recommendation_product_performance FOR ALL USING (true);
CREATE POLICY "Allow all for personalization_preferences" ON personalization_preferences FOR ALL USING (true);

-- ============================================
-- DYNAMIC PRICING SYSTEM
-- ============================================

-- Pricing Strategies
CREATE TABLE IF NOT EXISTS pricing_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  strategy_name VARCHAR(255) NOT NULL,
  strategy_type VARCHAR(100) NOT NULL,
  description TEXT,
  base_strategy_id UUID REFERENCES pricing_strategies(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  apply_to_all BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pricing Rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  strategy_id UUID NOT NULL REFERENCES pricing_strategies(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100) NOT NULL,
  condition_field VARCHAR(100),
  condition_operator VARCHAR(50),
  condition_value VARCHAR(500),
  price_adjustment_type VARCHAR(50),
  price_adjustment_value DECIMAL(10, 2),
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Competitor Prices
CREATE TABLE IF NOT EXISTS competitor_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  competitor_name VARCHAR(255) NOT NULL,
  competitor_sku VARCHAR(100),
  competitor_price DECIMAL(10, 2),
  our_price DECIMAL(10, 2),
  price_difference DECIMAL(10, 2),
  last_checked_at TIMESTAMP WITH TIME ZONE,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product Pricing History
CREATE TABLE IF NOT EXISTS product_pricing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  price_change_percentage DECIMAL(5, 2),
  change_reason VARCHAR(255),
  change_type VARCHAR(100),
  strategy_id UUID REFERENCES pricing_strategies(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES pricing_rules(id) ON DELETE SET NULL,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  effective_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Demand Indicators
CREATE TABLE IF NOT EXISTS demand_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date DATE,
  demand_level VARCHAR(50),
  stock_level INTEGER,
  conversion_rate DECIMAL(5, 2),
  views_count INTEGER,
  add_to_cart_count INTEGER,
  purchase_count INTEGER,
  average_rating DECIMAL(3, 2),
  review_count INTEGER,
  days_in_stock INTEGER,
  seasonality_index DECIMAL(5, 2),
  trend_score DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Price Elasticity
CREATE TABLE IF NOT EXISTS price_elasticity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  elasticity_coefficient DECIMAL(5, 2),
  price_range_min DECIMAL(10, 2),
  price_range_max DECIMAL(10, 2),
  optimal_price DECIMAL(10, 2),
  confidence_score DECIMAL(5, 2),
  calculated_at TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Pricing Analytics
CREATE TABLE IF NOT EXISTS dynamic_pricing_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE,
  strategy_id UUID REFERENCES pricing_strategies(id) ON DELETE SET NULL,
  total_products_affected INTEGER DEFAULT 0,
  total_price_changes INTEGER DEFAULT 0,
  average_price_change DECIMAL(5, 2),
  revenue_impact DECIMAL(12, 2),
  margin_impact DECIMAL(12, 2),
  demand_response DECIMAL(5, 2),
  conversion_rate_change DECIMAL(5, 2),
  customer_satisfaction_impact DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Price Testing / A/B Tests
CREATE TABLE IF NOT EXISTS price_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  test_type VARCHAR(100),
  control_price DECIMAL(10, 2),
  test_price DECIMAL(10, 2),
  test_percentage INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  winner_price DECIMAL(10, 2),
  revenue_control DECIMAL(12, 2),
  revenue_test DECIMAL(12, 2),
  conversion_control DECIMAL(5, 2),
  conversion_test DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Pricing
CREATE INDEX IF NOT EXISTS idx_pricing_strategies_user ON pricing_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_strategies_active ON pricing_strategies(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_strategy ON pricing_rules(strategy_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_user ON pricing_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_product ON competitor_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_user ON competitor_prices(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_date ON competitor_prices(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_product ON product_pricing_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_strategy ON product_pricing_history(strategy_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_date ON product_pricing_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_demand_indicators_product_date ON demand_indicators(product_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_demand_indicators_user ON demand_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_price_elasticity_product ON price_elasticity(product_id);
CREATE INDEX IF NOT EXISTS idx_price_elasticity_current ON price_elasticity(user_id, is_current);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_analytics_user_date ON dynamic_pricing_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_analytics_strategy ON dynamic_pricing_analytics(strategy_id);
CREATE INDEX IF NOT EXISTS idx_price_tests_product ON price_tests(product_id);
CREATE INDEX IF NOT EXISTS idx_price_tests_user ON price_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_price_tests_status ON price_tests(status);

-- Create Triggers for Pricing
CREATE TRIGGER update_pricing_strategies_updated_at BEFORE UPDATE ON pricing_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_prices_updated_at BEFORE UPDATE ON competitor_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_elasticity_updated_at BEFORE UPDATE ON price_elasticity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Pricing Tables
ALTER TABLE pricing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_elasticity ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_tests ENABLE ROW LEVEL SECURITY;

-- Create Policies for Pricing Tables
CREATE POLICY "Allow all for pricing_strategies" ON pricing_strategies FOR ALL USING (true);
CREATE POLICY "Allow all for pricing_rules" ON pricing_rules FOR ALL USING (true);
CREATE POLICY "Allow all for competitor_prices" ON competitor_prices FOR ALL USING (true);
CREATE POLICY "Allow all for product_pricing_history" ON product_pricing_history FOR ALL USING (true);
CREATE POLICY "Allow all for demand_indicators" ON demand_indicators FOR ALL USING (true);
CREATE POLICY "Allow all for price_elasticity" ON price_elasticity FOR ALL USING (true);
CREATE POLICY "Allow all for dynamic_pricing_analytics" ON dynamic_pricing_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for price_tests" ON price_tests FOR ALL USING (true);

-- ============================================
-- INVENTORY MANAGEMENT SYSTEM
-- ============================================

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  warehouse_name VARCHAR(255) NOT NULL,
  warehouse_code VARCHAR(50),
  location VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  manager_name VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Levels
CREATE TABLE IF NOT EXISTS stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER DEFAULT 0,
  quantity_damaged INTEGER DEFAULT 0,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  lead_time_days INTEGER,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(100),
  quantity_change INTEGER,
  reason VARCHAR(255),
  reference_type VARCHAR(100),
  reference_id UUID,
  notes TEXT,
  adjusted_by VARCHAR(255),
  adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER,
  status VARCHAR(50),
  transfer_date TIMESTAMP WITH TIME ZONE,
  shipped_date TIMESTAMP WITH TIME ZONE,
  received_date TIMESTAMP WITH TIME ZONE,
  shipped_by VARCHAR(255),
  received_by VARCHAR(255),
  tracking_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Low Stock Alerts
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  alert_type VARCHAR(100),
  current_quantity INTEGER,
  reorder_point INTEGER,
  alert_status VARCHAR(50),
  alerted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  action_taken VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Counts (Inventory Audits)
CREATE TABLE IF NOT EXISTS stock_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  count_date DATE,
  count_status VARCHAR(50),
  total_items_counted INTEGER,
  discrepancy_count INTEGER,
  counted_by VARCHAR(255),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Count Items
CREATE TABLE IF NOT EXISTS stock_count_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  expected_quantity INTEGER,
  counted_quantity INTEGER,
  discrepancy INTEGER,
  discrepancy_reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Forecasts
CREATE TABLE IF NOT EXISTS inventory_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  forecast_date DATE,
  forecast_quantity INTEGER,
  confidence_level DECIMAL(5, 2),
  based_on_days INTEGER,
  methodology VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Movements (Historical Ledger)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  movement_date TIMESTAMP WITH TIME ZONE,
  movement_type VARCHAR(100),
  quantity_in INTEGER DEFAULT 0,
  quantity_out INTEGER DEFAULT 0,
  balance_before INTEGER,
  balance_after INTEGER,
  reference_id UUID,
  reference_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Information
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_code VARCHAR(50),
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  payment_terms VARCHAR(100),
  lead_time_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  po_number VARCHAR(50),
  po_date DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status VARCHAR(50),
  total_amount DECIMAL(12, 2),
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PO Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_ordered INTEGER,
  quantity_received INTEGER,
  unit_price DECIMAL(10, 2),
  line_total DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Analytics
CREATE TABLE IF NOT EXISTS inventory_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  total_items_in_stock INTEGER,
  total_reserved_items INTEGER,
  total_available_items INTEGER,
  total_damaged_items INTEGER,
  total_inventory_value DECIMAL(12, 2),
  low_stock_items INTEGER,
  out_of_stock_items INTEGER,
  turnover_rate DECIMAL(5, 2),
  stockout_percentage DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Inventory
CREATE INDEX IF NOT EXISTS idx_warehouses_user ON warehouses(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_user ON stock_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_warehouse ON stock_adjustments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_date ON stock_adjustments(adjusted_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_product ON stock_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product ON low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_status ON low_stock_alerts(user_id, alert_status);
CREATE INDEX IF NOT EXISTS idx_stock_counts_warehouse ON stock_counts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_items_product ON stock_count_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date ON inventory_movements(product_id, movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_forecasts_product ON inventory_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_analytics_warehouse_date ON inventory_analytics(warehouse_id, date DESC);

-- Create Triggers for Inventory
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON stock_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_transfers_updated_at BEFORE UPDATE ON stock_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Inventory Tables
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_analytics ENABLE ROW LEVEL SECURITY;

-- Create Policies for Inventory Tables
CREATE POLICY "Allow all for warehouses" ON warehouses FOR ALL USING (true);
CREATE POLICY "Allow all for stock_levels" ON stock_levels FOR ALL USING (true);
CREATE POLICY "Allow all for stock_adjustments" ON stock_adjustments FOR ALL USING (true);
CREATE POLICY "Allow all for stock_transfers" ON stock_transfers FOR ALL USING (true);
CREATE POLICY "Allow all for low_stock_alerts" ON low_stock_alerts FOR ALL USING (true);
CREATE POLICY "Allow all for stock_counts" ON stock_counts FOR ALL USING (true);
CREATE POLICY "Allow all for stock_count_items" ON stock_count_items FOR ALL USING (true);
CREATE POLICY "Allow all for inventory_forecasts" ON inventory_forecasts FOR ALL USING (true);
CREATE POLICY "Allow all for inventory_movements" ON inventory_movements FOR ALL USING (true);
CREATE POLICY "Allow all for suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all for purchase_orders" ON purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow all for purchase_order_items" ON purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow all for inventory_analytics" ON inventory_analytics FOR ALL USING (true);

-- ============================================
-- RETURNS & RMA MANAGEMENT SYSTEM TABLES
-- ============================================

-- Return Reasons Reference Table
CREATE TABLE IF NOT EXISTS return_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason_code VARCHAR(50) UNIQUE NOT NULL,
  reason_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  refundable BOOLEAN DEFAULT true,
  requires_inspection BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main Returns/RMA Table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rma_number VARCHAR(50) UNIQUE NOT NULL,
  return_reason_id UUID REFERENCES return_reasons(id),
  reason_details TEXT,
  return_status VARCHAR(50) DEFAULT 'pending',
  return_condition VARCHAR(50),
  sub_reason TEXT,
  customer_notes TEXT,
  authorization_code VARCHAR(50),
  authorized_at TIMESTAMP WITH TIME ZONE,
  authorized_by UUID,
  return_shipping_address TEXT,
  return_shipping_method VARCHAR(100),
  return_carrier VARCHAR(100),
  return_tracking_number VARCHAR(255),
  expected_return_date DATE,
  return_received_date TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(12, 2),
  refund_status VARCHAR(50) DEFAULT 'pending',
  refund_method VARCHAR(100),
  refund_processed_at TIMESTAMP WITH TIME ZONE,
  restocking_fee_applied DECIMAL(12, 2),
  restocking_fee_percentage DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Return Items
CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity_returned INTEGER NOT NULL,
  quantity_approved INTEGER,
  unit_price DECIMAL(10, 2),
  item_condition VARCHAR(50),
  item_notes TEXT,
  inspection_notes TEXT,
  inspection_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Return Inspections
CREATE TABLE IF NOT EXISTS return_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_item_id UUID NOT NULL REFERENCES return_items(id) ON DELETE CASCADE,
  inspection_date TIMESTAMP WITH TIME ZONE,
  inspector_name VARCHAR(255),
  condition_assessment VARCHAR(255),
  is_resellable BOOLEAN,
  damages_found TEXT,
  photos_url TEXT[],
  inspection_result VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refund Transactions
CREATE TABLE IF NOT EXISTS refund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_payment_id UUID REFERENCES order_payments(id),
  refund_amount DECIMAL(12, 2) NOT NULL,
  refund_method VARCHAR(100),
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  refund_status VARCHAR(50),
  refund_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  expected_receipt_date DATE,
  actual_receipt_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Return Shipping
CREATE TABLE IF NOT EXISTS return_shipping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  outbound_tracking_number VARCHAR(255),
  outbound_carrier VARCHAR(100),
  outbound_shipped_date TIMESTAMP WITH TIME ZONE,
  inbound_tracking_number VARCHAR(255),
  inbound_carrier VARCHAR(100),
  inbound_shipped_date TIMESTAMP WITH TIME ZONE,
  inbound_delivery_date TIMESTAMP WITH TIME ZONE,
  warehouse_received_date TIMESTAMP WITH TIME ZONE,
  shipping_label_url TEXT,
  return_instructions_url TEXT,
  shipping_cost DECIMAL(10, 2),
  is_prepaid BOOLEAN DEFAULT false,
  shipping_status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Return Analytics
CREATE TABLE IF NOT EXISTS return_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  period_start_date DATE,
  period_end_date DATE,
  total_returns INTEGER,
  total_return_value DECIMAL(12, 2),
  total_refunded DECIMAL(12, 2),
  return_rate DECIMAL(5, 2),
  average_days_to_return INTEGER,
  average_days_to_refund INTEGER,
  resellable_items INTEGER,
  unrepairable_items INTEGER,
  restocking_fees_collected DECIMAL(12, 2),
  top_return_reason VARCHAR(255),
  refund_method_breakdown JSONB,
  return_by_category JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Returns
CREATE INDEX IF NOT EXISTS idx_returns_user ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(return_status);
CREATE INDEX IF NOT EXISTS idx_returns_rma_number ON returns(rma_number);
CREATE INDEX IF NOT EXISTS idx_returns_refund_status ON returns(refund_status);
CREATE INDEX IF NOT EXISTS idx_returns_created_date ON returns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product ON return_items(product_id);
CREATE INDEX IF NOT EXISTS idx_return_items_inspection_status ON return_items(inspection_status);
CREATE INDEX IF NOT EXISTS idx_return_inspections_item ON return_inspections(return_item_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_return ON refund_transactions(return_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_status ON refund_transactions(refund_status);
CREATE INDEX IF NOT EXISTS idx_return_shipping_return ON return_shipping(return_id);
CREATE INDEX IF NOT EXISTS idx_return_analytics_period ON return_analytics(period_start_date, period_end_date);

-- Create Triggers for Returns
CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_transactions_updated_at BEFORE UPDATE ON refund_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_return_shipping_updated_at BEFORE UPDATE ON return_shipping
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Returns Tables
ALTER TABLE return_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_analytics ENABLE ROW LEVEL SECURITY;

-- Create Policies for Returns Tables
CREATE POLICY "Allow all for return_reasons" ON return_reasons FOR ALL USING (true);
CREATE POLICY "Allow all for returns" ON returns FOR ALL USING (true);
CREATE POLICY "Allow all for return_items" ON return_items FOR ALL USING (true);
CREATE POLICY "Allow all for return_inspections" ON return_inspections FOR ALL USING (true);
CREATE POLICY "Allow all for refund_transactions" ON refund_transactions FOR ALL USING (true);
CREATE POLICY "Allow all for return_shipping" ON return_shipping FOR ALL USING (true);
CREATE POLICY "Allow all for return_analytics" ON return_analytics FOR ALL USING (true);

-- ============================================
-- COMPLAINT & FEEDBACK MANAGEMENT SYSTEM TABLES
-- ============================================

-- Complaint Categories
CREATE TABLE IF NOT EXISTS complaint_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_code VARCHAR(50) UNIQUE NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  escalation_required BOOLEAN DEFAULT false,
  sla_hours INT DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  complaint_ticket_id VARCHAR(50) UNIQUE NOT NULL,
  complaint_category_id UUID NOT NULL REFERENCES complaint_categories(id),
  complaint_type VARCHAR(50) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  complaint_status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  severity VARCHAR(50) DEFAULT 'medium',
  assigned_to_id UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  acknowledgment_status VARCHAR(50) DEFAULT 'pending',
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by_id UUID,
  resolution_summary TEXT,
  resolution_date TIMESTAMP WITH TIME ZONE,
  resolved_by_id UUID,
  satisfaction_rating INT,
  feedback_provided BOOLEAN DEFAULT false,
  requires_escalation BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalated_to_id UUID,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Comments/Responses
CREATE TABLE IF NOT EXISTS complaint_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  responder_id UUID,
  responder_type VARCHAR(50),
  message TEXT NOT NULL,
  attachments TEXT[],
  is_internal BOOLEAN DEFAULT false,
  response_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Escalations
CREATE TABLE IF NOT EXISTS complaint_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  escalation_level INT,
  escalated_from_id UUID,
  escalated_to_id UUID,
  escalation_reason TEXT,
  escalation_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolution_time TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Resolution
CREATE TABLE IF NOT EXISTS complaint_resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  resolution_type VARCHAR(50) NOT NULL,
  resolution_description TEXT,
  compensation_offered DECIMAL(12, 2),
  compensation_type VARCHAR(100),
  refund_amount DECIMAL(12, 2),
  replacement_offered BOOLEAN DEFAULT false,
  store_credit_amount DECIMAL(12, 2),
  actions_taken TEXT[],
  resolved_by_id UUID,
  resolution_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Feedback/Survey
CREATE TABLE IF NOT EXISTS complaint_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  satisfaction_rating INT CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  response_quality_rating INT CHECK (response_quality_rating >= 1 AND response_quality_rating >= 5),
  resolution_effectiveness_rating INT CHECK (resolution_effectiveness_rating >= 1 AND resolution_effectiveness_rating <= 5),
  communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
  overall_experience_rating INT CHECK (overall_experience_rating >= 1 AND overall_experience_rating <= 5),
  feedback_comments TEXT,
  would_recommend BOOLEAN,
  nps_score INT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Complaint Analytics
CREATE TABLE IF NOT EXISTS complaint_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  period_start_date DATE,
  period_end_date DATE,
  total_complaints INTEGER,
  open_complaints INTEGER,
  resolved_complaints INTEGER,
  average_resolution_days DECIMAL(10, 2),
  average_satisfaction_rating DECIMAL(3, 2),
  complaint_rate DECIMAL(5, 2),
  top_complaint_reason VARCHAR(255),
  escalation_rate DECIMAL(5, 2),
  customer_satisfaction_score DECIMAL(5, 2),
  complaint_by_category JSONB,
  complaint_by_priority JSONB,
  resolution_by_type JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Surveys
CREATE TABLE IF NOT EXISTS feedback_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  survey_type VARCHAR(50),
  survey_title VARCHAR(255),
  survey_description TEXT,
  survey_status VARCHAR(50) DEFAULT 'active',
  questions JSONB,
  start_date DATE,
  end_date DATE,
  target_customers INT,
  responses_received INT DEFAULT 0,
  average_rating DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey Responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES feedback_surveys(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  responses JSONB,
  rating INT,
  comments TEXT,
  response_time INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Complaints
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_customer ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_order ON complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(complaint_status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_ticket_id ON complaints(complaint_ticket_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_date ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_responses_complaint ON complaint_responses(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_escalations_complaint ON complaint_escalations(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_resolutions_complaint ON complaint_resolutions(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_feedback_complaint ON complaint_feedback(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_analytics_period ON complaint_analytics(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_user ON feedback_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);

-- Create Triggers for Complaints
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaint_responses_updated_at BEFORE UPDATE ON complaint_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_surveys_updated_at BEFORE UPDATE ON feedback_surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Complaint Tables
ALTER TABLE complaint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Create Policies for Complaint Tables
CREATE POLICY "Allow all for complaint_categories" ON complaint_categories FOR ALL USING (true);
CREATE POLICY "Allow all for complaints" ON complaints FOR ALL USING (true);
CREATE POLICY "Allow all for complaint_responses" ON complaint_responses FOR ALL USING (true);
CREATE POLICY "Allow all for complaint_escalations" ON complaint_escalations FOR ALL USING (true);
CREATE POLICY "Allow all for complaint_resolutions" ON complaint_resolutions FOR ALL USING (true);
CREATE POLICY "Allow all for complaint_feedback" ON complaint_feedback FOR ALL USING (true);
CREATE POLICY "Allow all for complaint_analytics" ON complaint_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for feedback_surveys" ON feedback_surveys FOR ALL USING (true);
CREATE POLICY "Allow all for survey_responses" ON survey_responses FOR ALL USING (true);

-- ============================================
-- ADVANCED ANALYTICS & REPORTING SYSTEM TABLES
-- ============================================

-- Sales Analytics
CREATE TABLE IF NOT EXISTS sales_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  analytics_date DATE NOT NULL,
  total_orders INT DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_order_value DECIMAL(12, 2),
  total_items_sold INT DEFAULT 0,
  total_discount_given DECIMAL(12, 2) DEFAULT 0,
  total_refunds DECIMAL(12, 2) DEFAULT 0,
  net_revenue DECIMAL(12, 2),
  orders_by_status JSONB,
  revenue_by_channel JSONB,
  revenue_by_category JSONB,
  top_products JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Analytics
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  analytics_date DATE NOT NULL,
  total_customers INT DEFAULT 0,
  new_customers INT DEFAULT 0,
  returning_customers INT DEFAULT 0,
  active_customers INT DEFAULT 0,
  customer_retention_rate DECIMAL(5, 2),
  average_customer_lifetime_value DECIMAL(12, 2),
  total_customer_spend DECIMAL(12, 2),
  customer_acquisition_cost DECIMAL(12, 2),
  churn_rate DECIMAL(5, 2),
  customers_by_segment JSONB,
  customers_by_location JSONB,
  repeat_purchase_rate DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product Analytics
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  analytics_date DATE NOT NULL,
  units_sold INT DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  cost_of_goods DECIMAL(12, 2),
  gross_profit DECIMAL(12, 2),
  gross_margin DECIMAL(5, 2),
  average_rating DECIMAL(3, 2),
  review_count INT,
  return_rate DECIMAL(5, 2),
  stock_level INT,
  turnover_rate DECIMAL(10, 2),
  inventory_value DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Analytics
CREATE TABLE IF NOT EXISTS financial_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  analytics_date DATE NOT NULL,
  period_type VARCHAR(50),
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_cost DECIMAL(12, 2) DEFAULT 0,
  gross_profit DECIMAL(12, 2),
  operating_expenses DECIMAL(12, 2),
  net_profit DECIMAL(12, 2),
  gross_margin DECIMAL(5, 2),
  operating_margin DECIMAL(5, 2),
  net_margin DECIMAL(5, 2),
  revenue_by_source JSONB,
  expense_by_category JSONB,
  cash_flow_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketing Analytics
CREATE TABLE IF NOT EXISTS marketing_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  analytics_date DATE NOT NULL,
  campaign_name VARCHAR(255),
  channel VARCHAR(100),
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  spend DECIMAL(12, 2) DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  email_sent INT DEFAULT 0,
  email_opened INT DEFAULT 0,
  email_clicked INT DEFAULT 0,
  sms_sent INT DEFAULT 0,
  sms_conversion INT DEFAULT 0,
  engagement_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  roi DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Operational Analytics
CREATE TABLE IF NOT EXISTS operational_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  analytics_date DATE NOT NULL,
  order_fulfillment_rate DECIMAL(5, 2),
  average_fulfillment_time INT,
  shipping_on_time_rate DECIMAL(5, 2),
  inventory_accuracy DECIMAL(5, 2),
  stock_out_incidents INT DEFAULT 0,
  warehouse_utilization DECIMAL(5, 2),
  average_complaint_resolution_time INT,
  complaint_rate DECIMAL(5, 2),
  return_rate DECIMAL(5, 2),
  customer_satisfaction_score DECIMAL(3, 2),
  nps_score INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard Reports
CREATE TABLE IF NOT EXISTS dashboard_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50),
  report_description TEXT,
  report_config JSONB,
  refresh_frequency VARCHAR(50),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  next_refresh_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Snapshots (for historical data)
CREATE TABLE IF NOT EXISTS report_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES dashboard_reports(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_data JSONB NOT NULL,
  metrics_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- KPI Tracking
CREATE TABLE IF NOT EXISTS kpi_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  kpi_name VARCHAR(255) NOT NULL,
  kpi_category VARCHAR(100),
  target_value DECIMAL(12, 2),
  actual_value DECIMAL(12, 2),
  current_date DATE NOT NULL,
  status VARCHAR(50),
  trend DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_sales_analytics_user_date ON sales_analytics(user_id, analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_user_date ON customer_analytics(user_id, analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_product_analytics_user_date ON product_analytics(user_id, analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_financial_analytics_user_date ON financial_analytics(user_id, analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_user_date ON marketing_analytics(user_id, analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_channel ON marketing_analytics(channel);
CREATE INDEX IF NOT EXISTS idx_operational_analytics_user_date ON operational_analytics(user_id, analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_reports_user ON dashboard_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_report_date ON report_snapshots(report_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_tracking_user_date ON kpi_tracking(user_id, current_date DESC);

-- Create Triggers for Analytics
CREATE TRIGGER update_sales_analytics_created_at BEFORE UPDATE ON sales_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_reports_updated_at BEFORE UPDATE ON dashboard_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for Analytics Tables
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_tracking ENABLE ROW LEVEL SECURITY;

-- Create Policies for Analytics Tables
CREATE POLICY "Allow all for sales_analytics" ON sales_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for customer_analytics" ON customer_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for product_analytics" ON product_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for financial_analytics" ON financial_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for marketing_analytics" ON marketing_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for operational_analytics" ON operational_analytics FOR ALL USING (true);
CREATE POLICY "Allow all for dashboard_reports" ON dashboard_reports FOR ALL USING (true);
CREATE POLICY "Allow all for report_snapshots" ON report_snapshots FOR ALL USING (true);
CREATE POLICY "Allow all for kpi_tracking" ON kpi_tracking FOR ALL USING (true);
