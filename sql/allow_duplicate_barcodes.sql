-- Migration to allow duplicate barcodes with different purchase dates
-- This enables tracking the same product purchased on different dates

-- Step 1: Drop the existing UNIQUE constraint on barcode column
ALTER TABLE barcode 
DROP CONSTRAINT IF EXISTS barcode_barcode_key;

-- Step 2: Add composite unique constraint to prevent exact duplicates
-- Same barcode can exist with different product_id or purchase_date
ALTER TABLE barcode 
ADD CONSTRAINT barcode_unique_combo 
UNIQUE (barcode, product_id, purchase_date);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_barcode_lookup ON barcode(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_product_date ON barcode(product_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_barcode_date ON barcode(purchase_date);

-- Display the updated barcode table structure
SELECT 
    constraint_name, 
    constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'barcode';

-- Show current barcode entries
SELECT COUNT(*) as total_barcodes FROM barcode;
