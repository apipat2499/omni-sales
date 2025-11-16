-- ============================================
-- ANALYTICS VIEWS MIGRATION
-- ============================================
-- This migration creates materialized views for advanced analytics
-- including customer analytics (CLV, RFM), product analytics,
-- order analytics, and daily metrics

-- ============================================
-- 1. CUSTOMER ANALYTICS VIEW
-- ============================================
-- Includes RFM scores, CLV, and customer segmentation

CREATE OR REPLACE VIEW customer_analytics_view AS
WITH customer_orders AS (
  SELECT
    customer_id,
    COUNT(DISTINCT id) as total_orders,
    SUM(total) as total_spent,
    AVG(total) as avg_order_value,
    MIN(created_at) as first_order_date,
    MAX(created_at) as last_order_date,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(created_at))) / 86400 as days_since_last_order
  FROM orders
  WHERE status NOT IN ('cancelled', 'refunded')
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT
    customer_id,
    -- Recency Score (1-5, 5 being most recent)
    CASE
      WHEN days_since_last_order <= 30 THEN 5
      WHEN days_since_last_order <= 90 THEN 4
      WHEN days_since_last_order <= 180 THEN 3
      WHEN days_since_last_order <= 365 THEN 2
      ELSE 1
    END as recency_score,
    -- Frequency Score (1-5, 5 being most frequent)
    CASE
      WHEN total_orders >= 20 THEN 5
      WHEN total_orders >= 10 THEN 4
      WHEN total_orders >= 5 THEN 3
      WHEN total_orders >= 2 THEN 2
      ELSE 1
    END as frequency_score,
    -- Monetary Score (1-5, 5 being highest value)
    CASE
      WHEN total_spent >= 10000 THEN 5
      WHEN total_spent >= 5000 THEN 4
      WHEN total_spent >= 1000 THEN 3
      WHEN total_spent >= 500 THEN 2
      ELSE 1
    END as monetary_score
  FROM customer_orders
),
customer_lifetime_value AS (
  SELECT
    co.customer_id,
    co.total_spent as historical_value,
    -- Predicted CLV = (Avg Order Value * Purchase Frequency * Customer Lifespan in years)
    (co.avg_order_value * (co.total_orders / GREATEST(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - co.first_order_date)) / 31536000, 1)) * 3) as predicted_clv,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - co.first_order_date)) / 86400 as customer_age_days
  FROM customer_orders co
)
SELECT
  c.id as customer_id,
  c.name,
  c.email,
  c.phone,
  c.tags,
  c.created_at as customer_since,
  COALESCE(co.total_orders, 0) as total_orders,
  COALESCE(co.total_spent, 0) as total_spent,
  COALESCE(co.avg_order_value, 0) as avg_order_value,
  co.first_order_date,
  co.last_order_date,
  COALESCE(co.days_since_last_order, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - c.created_at)) / 86400) as days_since_last_order,
  COALESCE(rfm.recency_score, 1) as recency_score,
  COALESCE(rfm.frequency_score, 1) as frequency_score,
  COALESCE(rfm.monetary_score, 1) as monetary_score,
  CONCAT(
    COALESCE(rfm.recency_score::text, '1'),
    COALESCE(rfm.frequency_score::text, '1'),
    COALESCE(rfm.monetary_score::text, '1')
  ) as rfm_segment,
  CASE
    WHEN COALESCE(rfm.recency_score, 1) >= 4 AND COALESCE(rfm.frequency_score, 1) >= 4 AND COALESCE(rfm.monetary_score, 1) >= 4 THEN 'Champions'
    WHEN COALESCE(rfm.recency_score, 1) >= 3 AND COALESCE(rfm.frequency_score, 1) >= 3 AND COALESCE(rfm.monetary_score, 1) >= 3 THEN 'Loyal Customers'
    WHEN COALESCE(rfm.recency_score, 1) >= 4 AND COALESCE(rfm.frequency_score, 1) <= 2 THEN 'New Customers'
    WHEN COALESCE(rfm.recency_score, 1) <= 2 AND COALESCE(rfm.frequency_score, 1) >= 3 THEN 'At Risk'
    WHEN COALESCE(rfm.recency_score, 1) <= 2 AND COALESCE(rfm.frequency_score, 1) <= 2 THEN 'Lost'
    WHEN COALESCE(rfm.monetary_score, 1) >= 4 THEN 'Big Spenders'
    ELSE 'Regular'
  END as customer_segment,
  COALESCE(clv.historical_value, 0) as customer_lifetime_value,
  COALESCE(clv.predicted_clv, 0) as predicted_lifetime_value,
  COALESCE(clv.customer_age_days, 0) as customer_age_days
FROM customers c
LEFT JOIN customer_orders co ON c.id = co.customer_id
LEFT JOIN rfm_scores rfm ON c.id = rfm.customer_id
LEFT JOIN customer_lifetime_value clv ON c.id = clv.customer_id;

-- ============================================
-- 2. PRODUCT ANALYTICS VIEW
-- ============================================
-- Includes sales performance, margins, and inventory metrics

CREATE OR REPLACE VIEW product_analytics_view AS
WITH product_sales AS (
  SELECT
    oi.product_id,
    COUNT(DISTINCT oi.order_id) as total_orders,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.price * oi.quantity) as total_revenue,
    AVG(oi.price) as avg_selling_price,
    MIN(o.created_at) as first_sale_date,
    MAX(o.created_at) as last_sale_date
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status NOT IN ('cancelled', 'refunded')
  GROUP BY oi.product_id
),
product_margins AS (
  SELECT
    ps.product_id,
    ps.total_revenue,
    (ps.total_quantity_sold * p.cost) as total_cost,
    ps.total_revenue - (ps.total_quantity_sold * p.cost) as gross_profit,
    CASE
      WHEN ps.total_revenue > 0 THEN
        ((ps.total_revenue - (ps.total_quantity_sold * p.cost)) / ps.total_revenue) * 100
      ELSE 0
    END as margin_percentage
  FROM product_sales ps
  JOIN products p ON ps.product_id = p.id
),
recent_sales AS (
  SELECT
    oi.product_id,
    SUM(oi.quantity) as quantity_sold_30d
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND o.status NOT IN ('cancelled', 'refunded')
  GROUP BY oi.product_id
)
SELECT
  p.id as product_id,
  p.name,
  p.category,
  p.sku,
  p.price,
  p.cost,
  p.stock,
  COALESCE(ps.total_orders, 0) as total_orders,
  COALESCE(ps.total_quantity_sold, 0) as total_quantity_sold,
  COALESCE(ps.total_revenue, 0) as total_revenue,
  COALESCE(ps.avg_selling_price, p.price) as avg_selling_price,
  COALESCE(pm.total_cost, 0) as total_cost,
  COALESCE(pm.gross_profit, 0) as gross_profit,
  COALESCE(pm.margin_percentage, 0) as margin_percentage,
  COALESCE(rs.quantity_sold_30d, 0) as quantity_sold_30d,
  ps.first_sale_date,
  ps.last_sale_date,
  CASE
    WHEN p.stock <= 0 THEN 'Out of Stock'
    WHEN p.stock <= 10 THEN 'Low Stock'
    WHEN p.stock >= 100 THEN 'Overstock'
    ELSE 'Normal'
  END as stock_status,
  CASE
    WHEN rs.quantity_sold_30d > 0 THEN p.stock / (rs.quantity_sold_30d / 30.0)
    ELSE NULL
  END as days_of_inventory,
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN product_sales ps ON p.id = ps.product_id
LEFT JOIN product_margins pm ON p.id = pm.product_id
LEFT JOIN recent_sales rs ON p.id = rs.product_id;

-- ============================================
-- 3. ORDER ANALYTICS VIEW
-- ============================================
-- Comprehensive order metrics with all calculations

CREATE OR REPLACE VIEW order_analytics_view AS
WITH order_items_agg AS (
  SELECT
    order_id,
    COUNT(*) as item_count,
    SUM(quantity) as total_items
  FROM order_items
  GROUP BY order_id
),
order_costs AS (
  SELECT
    oi.order_id,
    SUM(oi.quantity * p.cost) as total_cost
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  GROUP BY oi.order_id
)
SELECT
  o.id as order_id,
  o.customer_id,
  c.name as customer_name,
  c.email as customer_email,
  o.subtotal,
  o.tax,
  o.shipping,
  o.total,
  o.status,
  o.channel,
  o.payment_method,
  COALESCE(oia.item_count, 0) as item_count,
  COALESCE(oia.total_items, 0) as total_quantity,
  COALESCE(oc.total_cost, 0) as total_cost,
  o.total - COALESCE(oc.total_cost, 0) as gross_profit,
  CASE
    WHEN o.total > 0 THEN
      ((o.total - COALESCE(oc.total_cost, 0)) / o.total) * 100
    ELSE 0
  END as profit_margin_percentage,
  o.total / NULLIF(COALESCE(oia.total_items, 1), 0) as avg_item_price,
  o.created_at,
  o.updated_at,
  o.delivered_at,
  CASE
    WHEN o.delivered_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 86400
    ELSE NULL
  END as delivery_days,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at)) / 86400 as order_age_days,
  DATE_TRUNC('day', o.created_at) as order_date,
  DATE_TRUNC('week', o.created_at) as order_week,
  DATE_TRUNC('month', o.created_at) as order_month,
  DATE_TRUNC('year', o.created_at) as order_year,
  EXTRACT(HOUR FROM o.created_at) as order_hour,
  EXTRACT(DOW FROM o.created_at) as order_day_of_week
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items_agg oia ON o.id = oia.order_id
LEFT JOIN order_costs oc ON o.id = oc.order_id;

-- ============================================
-- 4. DAILY METRICS VIEW
-- ============================================
-- Daily aggregated metrics for dashboards and reporting

CREATE OR REPLACE VIEW daily_metrics_view AS
WITH daily_orders AS (
  SELECT
    DATE_TRUNC('day', created_at) as metric_date,
    COUNT(*) as total_orders,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(total) as total_revenue,
    AVG(total) as avg_order_value,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
    SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded_orders
  FROM orders
  GROUP BY DATE_TRUNC('day', created_at)
),
daily_customers AS (
  SELECT
    DATE_TRUNC('day', created_at) as metric_date,
    COUNT(*) as new_customers
  FROM customers
  GROUP BY DATE_TRUNC('day', created_at)
),
daily_items AS (
  SELECT
    DATE_TRUNC('day', o.created_at) as metric_date,
    SUM(oi.quantity) as total_items_sold,
    COUNT(DISTINCT oi.product_id) as unique_products_sold
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status NOT IN ('cancelled', 'refunded')
  GROUP BY DATE_TRUNC('day', o.created_at)
),
daily_costs AS (
  SELECT
    DATE_TRUNC('day', o.created_at) as metric_date,
    SUM(oi.quantity * p.cost) as total_cost
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  JOIN products p ON oi.product_id = p.id
  WHERE o.status NOT IN ('cancelled', 'refunded')
  GROUP BY DATE_TRUNC('day', o.created_at)
)
SELECT
  COALESCE(do.metric_date, dc.metric_date, di.metric_date) as metric_date,
  COALESCE(do.total_orders, 0) as total_orders,
  COALESCE(do.completed_orders, 0) as completed_orders,
  COALESCE(do.cancelled_orders, 0) as cancelled_orders,
  COALESCE(do.refunded_orders, 0) as refunded_orders,
  COALESCE(do.unique_customers, 0) as unique_customers,
  COALESCE(dc.new_customers, 0) as new_customers,
  COALESCE(do.total_revenue, 0) as total_revenue,
  COALESCE(do.avg_order_value, 0) as avg_order_value,
  COALESCE(di.total_items_sold, 0) as total_items_sold,
  COALESCE(di.unique_products_sold, 0) as unique_products_sold,
  COALESCE(dco.total_cost, 0) as total_cost,
  COALESCE(do.total_revenue, 0) - COALESCE(dco.total_cost, 0) as gross_profit,
  CASE
    WHEN COALESCE(do.total_revenue, 0) > 0 THEN
      ((COALESCE(do.total_revenue, 0) - COALESCE(dco.total_cost, 0)) / COALESCE(do.total_revenue, 0)) * 100
    ELSE 0
  END as profit_margin_percentage,
  CASE
    WHEN COALESCE(do.total_orders, 0) > 0 THEN
      (COALESCE(do.completed_orders, 0)::float / COALESCE(do.total_orders, 0)) * 100
    ELSE 0
  END as order_completion_rate,
  EXTRACT(DOW FROM COALESCE(do.metric_date, dc.metric_date, di.metric_date)) as day_of_week,
  TO_CHAR(COALESCE(do.metric_date, dc.metric_date, di.metric_date), 'Day') as day_name
FROM daily_orders do
FULL OUTER JOIN daily_customers dc ON do.metric_date = dc.metric_date
FULL OUTER JOIN daily_items di ON COALESCE(do.metric_date, dc.metric_date) = di.metric_date
FULL OUTER JOIN daily_costs dco ON COALESCE(do.metric_date, dc.metric_date, di.metric_date) = dco.metric_date
ORDER BY metric_date DESC;

-- ============================================
-- 5. MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================
-- Create materialized versions for faster queries on large datasets

CREATE MATERIALIZED VIEW IF NOT EXISTS customer_analytics_mat AS
SELECT * FROM customer_analytics_view;

CREATE MATERIALIZED VIEW IF NOT EXISTS product_analytics_mat AS
SELECT * FROM product_analytics_view;

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_metrics_mat AS
SELECT * FROM daily_metrics_view;

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_customer_analytics_mat_segment
  ON customer_analytics_mat(customer_segment);

CREATE INDEX IF NOT EXISTS idx_customer_analytics_mat_rfm
  ON customer_analytics_mat(recency_score, frequency_score, monetary_score);

CREATE INDEX IF NOT EXISTS idx_product_analytics_mat_category
  ON product_analytics_mat(category);

CREATE INDEX IF NOT EXISTS idx_product_analytics_mat_revenue
  ON product_analytics_mat(total_revenue DESC);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_mat_date
  ON daily_metrics_mat(metric_date DESC);

-- ============================================
-- 7. REFRESH FUNCTIONS
-- ============================================

-- Function to refresh all analytics materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY customer_analytics_mat;
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_analytics_mat;
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics_mat;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. SCHEDULED REFRESH (Optional - requires pg_cron extension)
-- ============================================

-- Uncomment if pg_cron extension is available
-- SELECT cron.schedule('refresh-analytics', '0 */6 * * *', 'SELECT refresh_analytics_views()');

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON VIEW customer_analytics_view IS 'Customer analytics including RFM scores, CLV, and segmentation';
COMMENT ON VIEW product_analytics_view IS 'Product performance metrics including sales, margins, and inventory';
COMMENT ON VIEW order_analytics_view IS 'Comprehensive order metrics with profitability calculations';
COMMENT ON VIEW daily_metrics_view IS 'Daily aggregated business metrics for dashboards';

COMMENT ON MATERIALIZED VIEW customer_analytics_mat IS 'Materialized view of customer analytics - refresh every 6 hours';
COMMENT ON MATERIALIZED VIEW product_analytics_mat IS 'Materialized view of product analytics - refresh every 6 hours';
COMMENT ON MATERIALIZED VIEW daily_metrics_mat IS 'Materialized view of daily metrics - refresh every 6 hours';

COMMENT ON FUNCTION refresh_analytics_views() IS 'Refreshes all analytics materialized views';
