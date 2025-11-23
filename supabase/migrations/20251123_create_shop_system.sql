-- ============================================
-- SHOP SYSTEM MIGRATION
-- ============================================
-- This migration extends the existing orders and products tables
-- to support an e-commerce shop with guest checkout and payment processing

-- ============================================
-- MODIFY ORDERS TABLE FOR SHOP
-- ============================================

-- Make customer_id nullable to support guest checkout
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;

-- Add shop-specific columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50) UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- Update payment_status for existing records
UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- ============================================
-- SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at_trigger
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- ============================================
-- ORDER NUMBER SEQUENCE
-- ============================================

-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
  next_number INTEGER;
  order_date TEXT;
  order_num VARCHAR;
BEGIN
  -- Get next sequence value
  next_number := nextval('order_number_seq');

  -- Format: ORD-YYYYMMDD-XXXX
  order_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  order_num := 'ORD-' || order_date || '-' || LPAD(next_number::TEXT, 4, '0');

  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INVENTORY MANAGEMENT FUNCTIONS
-- ============================================

-- Function to check and decrement stock
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock with row lock
  SELECT stock INTO current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- Check if we have enough stock
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', current_stock, p_quantity;
  END IF;

  -- Decrement stock
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to restore stock (for cancelled orders)
CREATE OR REPLACE FUNCTION restore_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE products
  SET stock = stock + p_quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED INITIAL DATA
-- ============================================

-- Insert store settings
INSERT INTO settings (key, value) VALUES
  ('store_info', '{
    "name": "Omni Sales Shop",
    "description": "Your one-stop shop for quality products",
    "logo": "/logo.png",
    "email": "shop@omnisales.com",
    "phone": "+1 (555) 123-4567"
  }'::jsonb),
  ('bank_account', '{
    "bankName": "First National Bank",
    "accountNumber": "1234567890",
    "accountHolder": "Omni Sales LLC",
    "instructions": "Please include your order number in the payment reference"
  }'::jsonb),
  ('shipping_methods', '[
    {
      "id": "standard",
      "name": "Standard Shipping",
      "cost": 10.00,
      "estimatedDays": "5-7 business days"
    },
    {
      "id": "express",
      "name": "Express Shipping",
      "cost": 25.00,
      "estimatedDays": "2-3 business days"
    },
    {
      "id": "overnight",
      "name": "Overnight Shipping",
      "cost": 50.00,
      "estimatedDays": "Next business day"
    }
  ]'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = CURRENT_TIMESTAMP;

-- Insert sample products (only if products table is empty)
INSERT INTO products (name, category, price, cost, stock, sku, description, image)
SELECT * FROM (VALUES
  ('Wireless Bluetooth Headphones', 'Electronics', 79.99, 40.00, 50, 'ELEC-WBH-001', 'Premium wireless headphones with noise cancellation and 30-hour battery life', '/images/products/headphones.jpg'),
  ('Smart Fitness Watch', 'Electronics', 149.99, 75.00, 30, 'ELEC-SFW-002', 'Track your fitness goals with heart rate monitor, GPS, and sleep tracking', '/images/products/smartwatch.jpg'),
  ('Eco-Friendly Water Bottle', 'Home & Living', 24.99, 10.00, 100, 'HOME-EWB-003', 'Stainless steel insulated water bottle keeps drinks cold for 24 hours', '/images/products/bottle.jpg'),
  ('Organic Cotton T-Shirt', 'Clothing', 29.99, 12.00, 75, 'CLOT-OCT-004', '100% organic cotton, soft and breathable, available in multiple colors', '/images/products/tshirt.jpg'),
  ('Leather Laptop Bag', 'Accessories', 89.99, 45.00, 25, 'ACCS-LLB-005', 'Premium leather laptop bag with multiple compartments for 15" laptops', '/images/products/laptop-bag.jpg'),
  ('Yoga Mat Premium', 'Sports', 44.99, 20.00, 60, 'SPRT-YMP-006', 'Non-slip, eco-friendly yoga mat with carrying strap', '/images/products/yoga-mat.jpg'),
  ('Ceramic Coffee Mug Set', 'Home & Living', 34.99, 15.00, 80, 'HOME-CCM-007', 'Set of 4 handcrafted ceramic mugs, dishwasher safe', '/images/products/mugs.jpg'),
  ('Portable Phone Charger', 'Electronics', 39.99, 18.00, 90, 'ELEC-PPC-008', '20000mAh power bank with fast charging and dual USB ports', '/images/products/charger.jpg')
) AS v(name, category, price, cost, stock, sku, description, image)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Insert sample orders for testing
DO $$
DECLARE
  product1_id UUID;
  product2_id UUID;
  order1_id UUID;
  order2_id UUID;
BEGIN
  -- Get product IDs
  SELECT id INTO product1_id FROM products WHERE sku = 'ELEC-WBH-001' LIMIT 1;
  SELECT id INTO product2_id FROM products WHERE sku = 'ELEC-SFW-002' LIMIT 1;

  -- Only insert sample orders if we have products
  IF product1_id IS NOT NULL AND product2_id IS NOT NULL THEN
    -- Insert sample order 1
    INSERT INTO orders (
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      zip_code,
      subtotal,
      tax,
      shipping,
      total,
      status,
      payment_method,
      payment_status,
      channel,
      created_at
    ) VALUES (
      generate_order_number(),
      'John Doe',
      'john.doe@example.com',
      '+1 (555) 234-5678',
      '123 Main St, Apt 4B',
      'New York',
      '10001',
      79.99,
      6.40,
      10.00,
      96.39,
      'pending_payment',
      'bank_transfer',
      'pending',
      'web',
      CURRENT_TIMESTAMP - INTERVAL '2 hours'
    ) RETURNING id INTO order1_id;

    -- Insert order items for order 1
    INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
    VALUES (order1_id, product1_id, 'Wireless Bluetooth Headphones', 1, 79.99);

    -- Insert sample order 2
    INSERT INTO orders (
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      city,
      zip_code,
      subtotal,
      tax,
      shipping,
      total,
      status,
      payment_method,
      payment_status,
      channel,
      created_at
    ) VALUES (
      generate_order_number(),
      'Jane Smith',
      'jane.smith@example.com',
      '+1 (555) 345-6789',
      '456 Oak Avenue',
      'Los Angeles',
      '90001',
      149.99,
      12.00,
      10.00,
      171.99,
      'processing',
      'bank_transfer',
      'confirmed',
      'web',
      CURRENT_TIMESTAMP - INTERVAL '5 hours'
    ) RETURNING id INTO order2_id;

    -- Insert order items for order 2
    INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
    VALUES (order2_id, product2_id, 'Smart Fitness Watch', 1, 149.99);
  END IF;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE settings IS 'Global application settings stored as key-value pairs';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number (e.g., ORD-20251123-0001)';
COMMENT ON COLUMN orders.payment_status IS 'Payment confirmation status: pending, confirmed, failed';
COMMENT ON COLUMN orders.customer_name IS 'Customer name for guest checkout (when customer_id is null)';
COMMENT ON COLUMN orders.customer_email IS 'Customer email for guest checkout';
COMMENT ON COLUMN orders.customer_phone IS 'Customer phone for order updates';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users (adjust based on your RLS policies)
GRANT SELECT, INSERT ON settings TO authenticated;
GRANT UPDATE ON settings TO authenticated;

-- Add RLS policies if needed
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify settings (adjust role as needed)
CREATE POLICY "Allow admins to modify settings"
  ON settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
