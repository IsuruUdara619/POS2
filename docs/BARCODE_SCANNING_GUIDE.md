# Barcode Scanning Guide for Sales Page

## ✅ Status: FULLY FUNCTIONAL

The barcode scanning functionality is **already implemented** and working on the sales page (`http://localhost:5173/sales`). The database has been successfully updated with the required schema.

## 🎯 How It Works

### 1. Barcode Format
Barcodes must follow this format:
```
BC-{product_id}-{brand}-INV-{inventory_id}-{YYYYMMDD}
```

Example: `BC-123-BrandName-INV-45-20251128`

### 2. Automatic Product Lookup

When you scan or type a barcode in the **Inventory Item** field:

1. **Real-time Detection**: The system automatically detects barcodes starting with "BC-"
2. **API Call**: Makes a request to `/barcode/:barcode/pricing` endpoint
3. **Auto-Fill**: Automatically populates:
   - Product name
   - Brand
   - SKU (unit type: Grams/PCS)
   - Unit price
   - Selling price
   - Available quantity
   - Purchase date

### 3. Inventory Management

The system:
- ✅ Checks available stock from the database
- ✅ Prevents overselling (quantity cannot exceed available stock)
- ✅ Updates available quantity in real-time
- ✅ Handles both Grams and PCS units correctly

## 📝 Usage Instructions

### Using Barcode Scanner

1. **Open Sales Page**: Navigate to `http://localhost:5173/sales`
2. **Click "Add Sale"**: Opens the sales form
3. **Focus on Inventory Item Field**: Click on the first "Inventory Item" input field
4. **Scan Barcode**: Use your barcode scanner to scan the product barcode
5. **Auto-Complete**: The system will automatically:
   - Fill in product details
   - Set unit price and selling price
   - Show available quantity
   - Clamp quantity to available stock

### Manual Barcode Entry

You can also paste or type the barcode:
1. Click in the "Inventory Item" field
2. Type or paste the barcode (e.g., `BC-123-BrandName-INV-45-20251128`)
3. The system will detect and process it automatically

## 🔧 Technical Details

### Database Schema

The `barcode` table now includes:
```sql
CREATE TABLE barcode (
    barcode_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(product_id),
    invoice_no VARCHAR(100),
    brand VARCHAR(100),
    purchase_date DATE,
    barcode VARCHAR(200) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoint

**GET** `/barcode/:barcode/pricing`

**Response:**
```json
{
  "inventory_id": 123,
  "product_name": "Product Name",
  "vendor_name": "Vendor Name",
  "brand": "Brand Name",
  "sku": "Grams",
  "unit_price": 100.00,
  "selling_price": 130.00,
  "available_qty": 500,
  "purchase_date": "2025-11-28"
}
```

### Frontend Implementation

The barcode scanning is implemented in `frontend/src/pages/Sales.tsx`:

- **onChange Handler**: Detects "BC-" prefix and triggers API call
- **onPaste Handler**: Handles pasted barcodes
- **Automatic Population**: Fills all fields based on API response
- **Stock Validation**: Prevents exceeding available quantity
- **Unit Conversion**: Handles Grams ↔ KG conversion automatically

## 🎨 User Experience Features

1. **Instant Feedback**: Product details appear immediately after scanning
2. **Stock Warnings**: Visual indicator shows available quantity
3. **Auto-Clamping**: Quantity automatically adjusts if you exceed available stock
4. **Smart Suggestions**: Also supports manual search by product name, brand, or ID
5. **Keyboard Navigation**: Full keyboard support for fast data entry

## 🔍 Troubleshooting

### Barcode Not Found
- Ensure the barcode exists in the database
- Check that the barcode format is correct
- Verify the product_id is valid

### Incorrect Pricing
- Check the purchase_items table for unit_price
- Verify selling_price in purchase_items
- Default markup is 30% for Grams, rounded to nearest 5 for PCS

### Stock Issues
- Verify inventory_items table has correct quantities
- Check purchase_items.remaining_qty is updated
- Ensure brand matching is correct

## 📊 Creating Barcodes

To create a barcode, use the **POST** `/barcode` endpoint:

```javascript
POST /barcode
{
  "product_id": 123,
  "invoice_no": "INV-001",
  "date": "2025-11-28",
  "brand": "BrandName",
  "barcode": "BC-123-BrandName-INV-45-20251128" // Optional, auto-generated if not provided
}
```

## ✨ Benefits

1. **Speed**: Scan barcodes instead of searching manually
2. **Accuracy**: Eliminates data entry errors
3. **Real-time**: Immediate stock availability checks
4. **Traceability**: Links sales to specific purchase batches
5. **Automation**: Automatic price calculation and stock updates

## 🚀 Next Steps

The barcode scanning functionality is ready to use! Simply:

1. Create barcodes for your products (via Products page or API)
2. Print barcode labels for your inventory
3. Use barcode scanner on the Sales page
4. Enjoy faster, more accurate sales processing!

---

**Last Updated**: November 28, 2025
**Status**: ✅ Production Ready
