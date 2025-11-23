-- ============================================
-- UPDATE ORDERS WITH CUSTOMER NAMES
-- ============================================
-- This migration populates customer_name and customer_email
-- in orders table from customers table

-- Update existing orders with customer information
UPDATE orders o
SET
  customer_name = c.name,
  customer_email = c.email
FROM customers c
WHERE o.customer_id = c.id
  AND (o.customer_name IS NULL OR o.customer_name = '');

-- Verify update
-- SELECT COUNT(*) FROM orders WHERE customer_name IS NOT NULL;
