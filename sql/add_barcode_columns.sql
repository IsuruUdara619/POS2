-- Migration to add missing columns to barcode table
-- These columns are required for the barcode scanning functionality

ALTER TABLE barcode 
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS purchase_date DATE;

-- Drop the purchase_id foreign key constraint since we're using invoice_no and purchase_date instead
ALTER TABLE barcode 
DROP CONSTRAINT IF EXISTS barcode_purchase_id_fkey;

-- Remove the purchase_id column as it's not being used in the current implementation
ALTER TABLE barcode 
DROP COLUMN IF EXISTS purchase_id;

-- Create an index for faster barcode lookups
CREATE INDEX IF NOT EXISTS idx_barcode_lookup ON barcode(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_product ON barcode(product_id, brand, purchase_date);
