-- Migration to add missing columns to purchase_items and purchases tables
-- These columns are required for the sales and inventory pricing functionality

-- ============================================
-- Add columns to purchases table
-- ============================================
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2);

ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2);

ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS purchase_date DATE;

-- Populate purchase_date from existing date column
UPDATE purchases
SET purchase_date = date::DATE
WHERE purchase_date IS NULL AND date IS NOT NULL;

-- ============================================
-- Add columns to purchase_items table
-- ============================================
ALTER TABLE purchase_items 
ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2);

ALTER TABLE purchase_items 
ADD COLUMN IF NOT EXISTS remaining_qty NUMERIC(12,2);

-- Set default values for existing rows where these columns are NULL
-- For existing rows without selling_price, calculate it as unit_price * 1.3
UPDATE purchase_items
SET selling_price = ROUND(unit_price * 1.3, 2)
WHERE selling_price IS NULL AND unit_price IS NOT NULL;

-- For existing rows without remaining_qty, set it equal to qty (assuming no sales have been made yet)
UPDATE purchase_items
SET remaining_qty = qty
WHERE remaining_qty IS NULL AND qty IS NOT NULL;

-- Create indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_brand ON purchase_items(product_id, brand);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);

-- Verify the changes
SELECT 'purchases table columns:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'purchases'
ORDER BY ordinal_position;

SELECT 'purchase_items table columns:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_items'
ORDER BY ordinal_position;
