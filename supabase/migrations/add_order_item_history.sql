-- Create order_item_history table for tracking changes to order items
CREATE TABLE IF NOT EXISTS order_item_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  old_quantity INTEGER,
  new_quantity INTEGER,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  changed_by VARCHAR(255),
  notes TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_order_item_history_order_id ON order_item_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_history_item_id ON order_item_history(item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_history_changed_at ON order_item_history(changed_at DESC);

-- Add RLS policy
ALTER TABLE order_item_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON order_item_history
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON order_item_history
  FOR INSERT WITH CHECK (true);
