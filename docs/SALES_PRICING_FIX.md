# Sales Pricing Auto-Population Fix

## Problem
When inserting an item into the sales page under "Inventory Item", the Brand, Unit Price, and Selling Price fields were not auto-generating from the PostgreSQL database.

## Root Cause
The database schema was missing critical columns that the application code expected to exist:
- `purchase_items.selling_price`
- `purchase_items.remaining_qty`
- `purchases.unit_price`
- `purchases.selling_price`
- `purchases.purchase_date`

## Solution Applied
Created and executed migration: `sql/add_purchase_items_columns.sql`

### Changes Made
1. Added missing columns to `purchases` table:
   - `unit_price NUMERIC(10,2)`
   - `selling_price NUMERIC(10,2)`
   - `purchase_date DATE`

2. Added missing columns to `purchase_items` table:
   - `selling_price NUMERIC(10,2)`
   - `remaining_qty NUMERIC(12,2)`

3. Set default values for existing data:
   - Calculated `selling_price` as `unit_price * 1.3` for existing records
   - Set `remaining_qty` equal to `qty` for existing records

4. Created performance indexes:
   - `idx_purchase_items_product_brand` on `(product_id, brand)`
   - `idx_purchase_items_purchase_id` on `purchase_id`

## Testing Instructions

1. **Start/Restart your backend server** (if running)
   ```bash
   cd backend
   npm run dev
   ```

2. **Open the sales page** at `http://localhost:5173/sales`

3. **Test the fix:**
   - Click "Add Sale"
   - In the "Inventory Item" field, start typing a product name or brand
   - Select an inventory item from the dropdown
   - **Verify that:**
     - ✅ Brand field auto-populates
     - ✅ Unit Price field auto-populates
     - ✅ Selling Price field auto-populates

4. **If fields still don't populate:**
   - Check browser console for errors (F12)
   - Check backend logs for errors
   - Verify the selected product has purchase history with pricing data

## Files Modified
- ✅ `sql/add_purchase_items_columns.sql` - Migration SQL
- ✅ `scripts/run_purchase_migration.js` - Migration runner script
- ✅ `docs/SALES_PRICING_FIX.md` - This documentation

## Technical Notes
- The migration is idempotent (safe to run multiple times)
- Existing data has been backfilled with calculated values
- No breaking changes to existing functionality
- The fix addresses similar issues in barcode scanning and purchase creation
