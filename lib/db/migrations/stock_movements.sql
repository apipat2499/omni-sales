-- Stock movements table to track all inventory changes
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'sale', 'purchase', 'adjustment', 'return', 'transfer'
  quantity INTEGER NOT NULL, -- Positive for additions, negative for deductions
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_type VARCHAR(50), -- 'order', 'manual', 'import', etc.
  reference_id INTEGER, -- ID of related order, adjustment, etc.
  notes TEXT,
  user_id INTEGER, -- Future: track who made the change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_movements_updated_at
  BEFORE UPDATE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_movements_updated_at();

-- Comments for documentation
COMMENT ON TABLE stock_movements IS 'Tracks all inventory stock movements and changes';
COMMENT ON COLUMN stock_movements.type IS 'Type of movement: sale, purchase, adjustment, return, transfer';
COMMENT ON COLUMN stock_movements.quantity IS 'Change in quantity (positive for additions, negative for deductions)';
COMMENT ON COLUMN stock_movements.reference_type IS 'Type of entity that triggered this movement';
COMMENT ON COLUMN stock_movements.reference_id IS 'ID of the entity that triggered this movement';
