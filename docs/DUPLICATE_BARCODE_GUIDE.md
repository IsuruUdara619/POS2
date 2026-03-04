# Duplicate Barcode Implementation Guide

## Overview

The barcode system has been updated to allow duplicate barcodes for products purchased on different dates. This enables proper inventory tracking for products received in multiple batches while maintaining simplicity in barcode scanning.

## What Changed

### Database Schema Changes

1. **Removed UNIQUE constraint** on `barcode` column
   - Previously: Each barcode could only exist once in the database
   - Now: Same barcode can exist multiple times

2. **Added Composite UNIQUE constraint**
   - Constraint: `(barcode, product_id, purchase_date)`
   - This prevents exact duplicates while allowing:
     - Same barcode for different products
     - Same barcode for same product on different dates
     - Same barcode for different products on same date

3. **Added Performance Indexes**
   - `idx_barcode_lookup`: Fast barcode searches
   - `idx_barcode_product_date`: Quick product+date lookups
   - `idx_barcode_date`: Efficient date-based queries

### Backend Logic Changes

1. **Barcode Creation (POST /barcode)**
   - Now accepts duplicate barcodes if the purchase date differs
   - Error message updated to be more descriptive
   - Error: "Barcode already exists for this product and purchase date combination"

2. **Barcode Lookup (GET /barcode/:barcode/pricing)**
   - Implements **FIFO (First In, First Out)** inventory management
   - When scanning a duplicate barcode, it automatically selects the oldest purchase date
   - Query: `ORDER BY purchase_date ASC NULLS LAST, created_at ASC`
   - To switch to LIFO (Last In, First Out), change `ASC` to `DESC`

3. **Barcode Search (GET /barcode/search)**
   - Can filter by product_id and/or purchase_date
   - Returns all matching barcodes with full details
   - Useful for viewing all batches of a product

## How It Works

### Example Scenario

**Product:** Cooking Cutter Mix (Product ID: 123)
**Barcode:** 4792154060325

#### Batch 1 - November 15, 2025
```json
{
  "product_id": 123,
  "barcode": "4792154060325",
  "purchase_date": "2025-11-15",
  "invoice_no": "INV-101",
  "brand": "Astra"
}
```

#### Batch 2 - November 29, 2025
```json
{
  "product_id": 123,
  "barcode": "4792154060325",
  "purchase_date": "2025-11-29",
  "invoice_no": "INV-117",
  "brand": "Astra"
}
```

### Sales Process

When a cashier scans barcode `4792154060325`:

1. **System queries** for all matching barcodes
2. **Selects the oldest** purchase date (Nov 15) - FIFO
3. **Retrieves pricing** from that specific purchase
4. **Deducts quantity** from that batch's inventory
5. When Batch 1 is depleted, **automatically uses Batch 2**

## Benefits

✅ **Simplified Operations**
- Use the same physical barcode sticker for multiple batches
- No need to create new barcodes for each purchase date

✅ **Accurate Inventory Tracking**
- Each purchase batch is tracked separately by date
- Proper FIFO/LIFO inventory management

✅ **Clear Reporting**
- Know exactly which batch a sale came from
- Track product movement by purchase date

✅ **No Confusion**
- System automatically selects the correct batch
- Date-based tracking prevents mix-ups

## Migration Process

The migration was completed successfully:

```sql
-- Step 1: Remove unique constraint
ALTER TABLE barcode DROP CONSTRAINT IF EXISTS barcode_barcode_key;

-- Step 2: Add composite constraint
ALTER TABLE barcode 
ADD CONSTRAINT barcode_unique_combo 
UNIQUE (barcode, product_id, purchase_date);

-- Step 3: Create indexes
CREATE INDEX idx_barcode_lookup ON barcode(barcode);
CREATE INDEX idx_barcode_product_date ON barcode(product_id, purchase_date);
CREATE INDEX idx_barcode_date ON barcode(purchase_date);
```

## Usage Guidelines

### Creating Barcodes

1. **Same product, different dates**: ✅ Allowed
   ```
   Barcode: 4792154060325
   Date: 2025-11-15
   ---
   Barcode: 4792154060325
   Date: 2025-11-29
   ```

2. **Same product, same date, same barcode**: ❌ Prevented
   ```
   Barcode: 4792154060325
   Date: 2025-11-15
   ---
   Barcode: 4792154060325  (duplicate - will fail)
   Date: 2025-11-15
   ```

3. **Different products, same barcode**: ✅ Allowed
   ```
   Product: Cooking Oil (ID: 50)
   Barcode: 1234567890123
   ---
   Product: Baking Soda (ID: 75)
   Barcode: 1234567890123
   ```

### Best Practices

1. **Always specify purchase date** when creating barcodes
2. **Use invoice numbers** for additional tracking
3. **Monitor inventory levels** by purchase date
4. **Rotate stock** following FIFO principle

## Switching from FIFO to LIFO

If you prefer to sell the newest stock first (LIFO), modify this line in `backend/src/routes/barcode.ts`:

```typescript
// Current (FIFO - sell oldest first)
ORDER BY purchase_date ASC NULLS LAST, created_at ASC

// Change to (LIFO - sell newest first)
ORDER BY purchase_date DESC NULLS LAST, created_at DESC
```

## API Examples

### Create Barcode with Date
```bash
POST /api/barcode
{
  "product_id": 123,
  "barcode": "4792154060325",
  "date": "2025-11-29",
  "invoice_no": "INV-117",
  "brand": "Astra"
}
```

### Search Barcodes by Product
```bash
GET /api/barcode/search?product_id=123
```

### Search Barcodes by Date
```bash
GET /api/barcode/search?purchase_date=2025-11-29
```

### Get Pricing (Auto-selects oldest batch)
```bash
GET /api/barcode/4792154060325/pricing
```

## Troubleshooting

### Error: "Barcode already exists..."
**Cause:** Trying to create the same barcode for the same product on the same date

**Solution:** 
- Change the purchase date, OR
- Use a different barcode, OR
- Verify the date is correct

### Wrong Batch Being Sold
**Cause:** FIFO/LIFO order might not match your preference

**Solution:**
- Check the `ORDER BY` clause in the pricing endpoint
- Modify to use ASC (FIFO) or DESC (LIFO)

### Multiple Barcodes for Same Product
**Expected Behavior:** This is intentional and allows batch tracking

**Action:** Use the search endpoint to view all batches

## Files Modified

1. `allow_duplicate_barcodes.sql` - Database migration script
2. `backend/src/routes/barcode.ts` - Backend logic updates
3. `backend/run_barcode_migration.js` - Migration runner
4. `DUPLICATE_BARCODE_GUIDE.md` - This documentation

## Testing Checklist

- [x] Database migration runs successfully
- [ ] Can create duplicate barcodes with different dates
- [ ] Cannot create exact duplicates (same barcode, product, date)
- [ ] Barcode lookup returns oldest purchase date (FIFO)
- [ ] Sales deduct from correct batch
- [ ] Search functionality works with filters
- [ ] Frontend displays purchase date information
- [ ] Error messages are clear and helpful

## Support

For issues or questions about the duplicate barcode system, refer to this guide or contact the development team.
