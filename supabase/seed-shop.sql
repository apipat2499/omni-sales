-- ============================================
-- SHOP SYSTEM SEED DATA
-- ============================================
-- This file contains seed data for testing the shop system
-- Run this after the migration to populate the database with test data

-- ============================================
-- CLEAR EXISTING DATA (for testing)
-- ============================================

-- Uncomment to clear existing data before seeding
-- DELETE FROM order_items;
-- DELETE FROM orders WHERE channel = 'web';
-- DELETE FROM products WHERE sku LIKE 'ELEC-%' OR sku LIKE 'HOME-%' OR sku LIKE 'CLOT-%' OR sku LIKE 'ACCS-%' OR sku LIKE 'SPRT-%';
-- DELETE FROM settings WHERE key IN ('store_info', 'bank_account', 'shipping_methods');

-- ============================================
-- STORE SETTINGS
-- ============================================

INSERT INTO settings (key, value) VALUES
  ('store_info', '{
    "name": "Omni Sales Shop",
    "description": "Your one-stop shop for quality products",
    "tagline": "Quality products at affordable prices",
    "logo": "/logo.png",
    "email": "shop@omnisales.com",
    "phone": "+1 (555) 123-4567",
    "address": "123 Commerce Street, Business District, NY 10001",
    "supportHours": "Mon-Fri: 9AM-6PM EST",
    "returnPolicy": "30-day money-back guarantee",
    "shippingPolicy": "Free shipping on orders over $100"
  }'::jsonb),
  ('bank_account', '{
    "bankName": "First National Bank",
    "accountNumber": "1234567890",
    "accountHolder": "Omni Sales LLC",
    "routingNumber": "021000021",
    "swiftCode": "FNBAUS33",
    "instructions": "Please include your order number in the payment reference. Payments are typically processed within 1-2 business days."
  }'::jsonb),
  ('shipping_methods', '[
    {
      "id": "standard",
      "name": "Standard Shipping",
      "cost": 10.00,
      "estimatedDays": "5-7 business days",
      "description": "Economy shipping option"
    },
    {
      "id": "express",
      "name": "Express Shipping",
      "cost": 25.00,
      "estimatedDays": "2-3 business days",
      "description": "Faster delivery option"
    },
    {
      "id": "overnight",
      "name": "Overnight Shipping",
      "cost": 50.00,
      "estimatedDays": "Next business day",
      "description": "Guaranteed next-day delivery"
    },
    {
      "id": "free",
      "name": "Free Shipping",
      "cost": 0.00,
      "estimatedDays": "7-10 business days",
      "description": "Free shipping on orders over $100",
      "minOrderValue": 100.00
    }
  ]'::jsonb),
  ('payment_methods', '{
    "bank_transfer": {
      "enabled": true,
      "name": "Bank Transfer",
      "description": "Direct bank transfer - Manual verification required",
      "processingTime": "1-2 business days"
    },
    "credit_card": {
      "enabled": false,
      "name": "Credit Card",
      "description": "Pay securely with credit card (Coming soon)",
      "processingTime": "Instant"
    },
    "paypal": {
      "enabled": false,
      "name": "PayPal",
      "description": "Pay with PayPal (Coming soon)",
      "processingTime": "Instant"
    }
  }'::jsonb),
  ('tax_settings', '{
    "enabled": true,
    "rate": 0.08,
    "includedInPrice": false,
    "regions": [
      {"state": "NY", "rate": 0.08},
      {"state": "CA", "rate": 0.0725},
      {"state": "TX", "rate": 0.0625}
    ]
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- PRODUCTS
-- ============================================

-- Insert products with detailed information
INSERT INTO products (name, category, price, cost, stock, sku, description, image)
VALUES
  (
    'Wireless Bluetooth Headphones',
    'Electronics',
    79.99,
    40.00,
    50,
    'ELEC-WBH-001',
    'Premium wireless headphones with active noise cancellation, 30-hour battery life, and comfortable over-ear design. Perfect for music lovers and professionals.',
    '/images/products/headphones.jpg'
  ),
  (
    'Smart Fitness Watch',
    'Electronics',
    149.99,
    75.00,
    30,
    'ELEC-SFW-002',
    'Track your fitness goals with heart rate monitoring, GPS tracking, sleep analysis, and 50+ sport modes. Water-resistant up to 50m.',
    '/images/products/smartwatch.jpg'
  ),
  (
    'Eco-Friendly Water Bottle',
    'Home & Living',
    24.99,
    10.00,
    100,
    'HOME-EWB-003',
    'Stainless steel insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and eco-friendly design.',
    '/images/products/bottle.jpg'
  ),
  (
    'Organic Cotton T-Shirt',
    'Clothing',
    29.99,
    12.00,
    75,
    'CLOT-OCT-004',
    '100% organic cotton, soft and breathable fabric. Available in multiple colors. Ethically sourced and sustainably produced.',
    '/images/products/tshirt.jpg'
  ),
  (
    'Leather Laptop Bag',
    'Accessories',
    89.99,
    45.00,
    25,
    'ACCS-LLB-005',
    'Premium genuine leather laptop bag with padded compartment for 15" laptops. Multiple pockets for accessories and documents.',
    '/images/products/laptop-bag.jpg'
  ),
  (
    'Yoga Mat Premium',
    'Sports',
    44.99,
    20.00,
    60,
    'SPRT-YMP-006',
    'Non-slip, eco-friendly yoga mat made from natural rubber. Extra thick for superior comfort. Includes carrying strap.',
    '/images/products/yoga-mat.jpg'
  ),
  (
    'Ceramic Coffee Mug Set',
    'Home & Living',
    34.99,
    15.00,
    80,
    'HOME-CCM-007',
    'Set of 4 handcrafted ceramic mugs with ergonomic handles. Microwave and dishwasher safe. Perfect for coffee, tea, or hot chocolate.',
    '/images/products/mugs.jpg'
  ),
  (
    'Portable Phone Charger',
    'Electronics',
    39.99,
    18.00,
    90,
    'ELEC-PPC-008',
    '20000mAh power bank with fast charging technology. Dual USB ports allow charging two devices simultaneously. LED battery indicator.',
    '/images/products/charger.jpg'
  ),
  (
    'Running Shoes Professional',
    'Sports',
    119.99,
    60.00,
    40,
    'SPRT-RSP-009',
    'Lightweight running shoes with responsive cushioning and breathable mesh upper. Designed for long-distance running and daily training.',
    '/images/products/running-shoes.jpg'
  ),
  (
    'Wireless Mouse Ergonomic',
    'Electronics',
    34.99,
    15.00,
    65,
    'ELEC-WME-010',
    'Ergonomic wireless mouse with adjustable DPI settings. Rechargeable battery lasts up to 3 months. Compatible with Windows and Mac.',
    '/images/products/mouse.jpg'
  ),
  (
    'Kitchen Knife Set',
    'Home & Living',
    69.99,
    30.00,
    45,
    'HOME-KKS-011',
    'Professional chef knife set with 5 essential knives. High-carbon stainless steel blades with comfortable handles. Includes knife block.',
    '/images/products/knife-set.jpg'
  ),
  (
    'Backpack Travel',
    'Accessories',
    59.99,
    28.00,
    55,
    'ACCS-BPT-012',
    'Durable travel backpack with laptop compartment, USB charging port, and water-resistant material. Perfect for daily commute or travel.',
    '/images/products/backpack.jpg'
  )
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  stock = EXCLUDED.stock,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- SAMPLE ORDERS
-- ============================================

DO $$
DECLARE
  product1_id UUID;
  product2_id UUID;
  product3_id UUID;
  product4_id UUID;
  order1_id UUID;
  order2_id UUID;
  order3_id UUID;
  order4_id UUID;
BEGIN
  -- Get product IDs
  SELECT id INTO product1_id FROM products WHERE sku = 'ELEC-WBH-001' LIMIT 1;
  SELECT id INTO product2_id FROM products WHERE sku = 'ELEC-SFW-002' LIMIT 1;
  SELECT id INTO product3_id FROM products WHERE sku = 'HOME-EWB-003' LIMIT 1;
  SELECT id INTO product4_id FROM products WHERE sku = 'ACCS-LLB-005' LIMIT 1;

  -- Sample Order 1: Pending Payment
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
    '123 Main Street, Apartment 4B',
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

  INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
  VALUES (order1_id, product1_id, 'Wireless Bluetooth Headphones', 1, 79.99);

  -- Sample Order 2: Processing
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

  INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
  VALUES (order2_id, product2_id, 'Smart Fitness Watch', 1, 149.99);

  -- Sample Order 3: Shipped (Multiple Items)
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
    'Bob Johnson',
    'bob.johnson@example.com',
    '+1 (555) 456-7890',
    '789 Pine Road',
    'Chicago',
    '60601',
    114.98,
    9.20,
    10.00,
    134.18,
    'shipped',
    'bank_transfer',
    'confirmed',
    'web',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  ) RETURNING id INTO order3_id;

  INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
  VALUES
    (order3_id, product3_id, 'Eco-Friendly Water Bottle', 2, 24.99),
    (order3_id, product4_id, 'Leather Laptop Bag', 1, 89.99);

  -- Sample Order 4: Delivered
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
    created_at,
    delivered_at
  ) VALUES (
    generate_order_number(),
    'Alice Williams',
    'alice.williams@example.com',
    '+1 (555) 567-8901',
    '321 Maple Lane',
    'Boston',
    '02101',
    79.99,
    6.40,
    0.00,  -- Free shipping
    86.39,
    'delivered',
    'bank_transfer',
    'confirmed',
    'web',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
  ) RETURNING id INTO order4_id;

  INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
  VALUES (order4_id, product1_id, 'Wireless Bluetooth Headphones', 1, 79.99);

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify the data was inserted correctly

-- SELECT * FROM settings;
-- SELECT id, name, category, price, stock, sku FROM products ORDER BY category, name;
-- SELECT order_number, customer_name, total, status, payment_status, created_at FROM orders ORDER BY created_at DESC;
-- SELECT COUNT(*) as total_products FROM products;
-- SELECT COUNT(*) as total_orders FROM orders;
