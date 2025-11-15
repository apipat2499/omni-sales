-- Insert Sample Products
INSERT INTO products (name, category, price, cost, stock, sku, description) VALUES
  ('iPhone 15 Pro', 'Electronics', 45900, 35000, 25, 'IPH15P-001', 'Latest iPhone with A17 Pro chip'),
  ('Samsung Galaxy S24', 'Electronics', 32900, 25000, 15, 'SAM-S24-001', 'Premium Android smartphone'),
  ('MacBook Pro 14"', 'Electronics', 89900, 70000, 8, 'MBP14-001', 'M3 Pro chip with 16GB RAM'),
  ('Nike Air Max', 'Clothing', 4500, 2500, 50, 'NIKE-AM-001', 'Premium running shoes'),
  ('Adidas Ultraboost', 'Clothing', 5200, 3000, 35, 'ADI-UB-001', 'Comfortable sports shoes'),
  ('Coffee Beans (1kg)', 'Food & Beverage', 450, 250, 120, 'COF-ARB-001', 'Premium Arabica beans'),
  ('Green Tea Set', 'Food & Beverage', 890, 500, 5, 'TEA-GRN-001', 'Japanese green tea collection'),
  ('Sofa 3-Seater', 'Home & Garden', 18900, 12000, 12, 'SOF-3S-001', 'Modern fabric sofa'),
  ('Garden Tool Set', 'Home & Garden', 2200, 1200, 28, 'GRD-TLS-001', 'Complete gardening tools'),
  ('Yoga Mat Premium', 'Sports', 1200, 600, 45, 'YOG-MAT-001', 'Eco-friendly yoga mat');

-- Insert Sample Customers
INSERT INTO customers (name, email, phone, address, tags) VALUES
  ('สมชาย ใจดี', 'somchai@example.com', '081-234-5678', '123 ถนนสุขุมวิท กรุงเทพฯ', ARRAY['vip']),
  ('สมหญิง รักสวย', 'somying@example.com', '082-345-6789', '456 ถนนพระราม 4 กรุงเทพฯ', ARRAY['regular']),
  ('วิชัย มีสุข', 'wichai@example.com', '083-456-7890', '789 ถนนลาดพร้าว กรุงเทพฯ', ARRAY['new']),
  ('บริษัท ABC จำกัด', 'abc@company.com', '084-567-8901', '321 ถนนสาทร กรุงเทพฯ', ARRAY['wholesale', 'vip']),
  ('ปิยะ สวยงาม', 'piya@example.com', '085-678-9012', '654 ถนนรัชดา กรุงเทพฯ', ARRAY['regular']),
  ('ธนา รวยเงิน', 'thana@example.com', '086-789-0123', '987 ถนนเพชรบุรี กรุงเทพฯ', ARRAY['vip']);

-- Note: You'll need to add orders and order_items manually or via the application
-- because they require customer_id and product_id references

-- Example of creating orders (you'll need to replace with actual UUIDs after inserting customers and products)
-- INSERT INTO orders (customer_id, subtotal, tax, shipping, total, status, channel, payment_method, shipping_address)
-- VALUES ('customer-uuid-here', 45900, 3213, 0, 49113, 'delivered', 'online', 'Credit Card', '123 ถนนสุขุมวิท กรุงเทพฯ');
