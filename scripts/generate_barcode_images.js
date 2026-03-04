const { Pool } = require('pg');
const { createCanvas } = require('canvas');
const JsBarcode = require('jsbarcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create output directory
const outputDir = path.join(__dirname, 'barcode_images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateBarcodeImages() {
  const client = await pool.connect();
  
  try {
    console.log('Fetching barcodes from database...\n');
    
    // Query all barcodes with product names and prices
    const query = `
      SELECT 
        b.barcode_id,
        b.product_id,
        b.barcode,
        b.brand,
        b.invoice_no,
        b.purchase_date,
        p.product_name,
        pi.unit_price,
        pi.selling_price
      FROM barcode b
      LEFT JOIN products p ON p.product_id = b.product_id
      LEFT JOIN purchase_items pi ON pi.product_id = b.product_id
      LEFT JOIN purchases pu ON pu.purchase_id = pi.purchase_id
        AND (pu.purchase_date = b.purchase_date OR (pu.purchase_date IS NULL AND b.purchase_date IS NULL))
        AND (pu.invoice_no = b.invoice_no OR (pu.invoice_no IS NULL AND b.invoice_no IS NULL))
        AND (pi.brand = b.brand OR (pi.brand IS NULL AND b.brand IS NULL))
      ORDER BY b.product_id, b.barcode_id
    `;
    
    const result = await client.query(query);
    const barcodes = result.rows;
    
    console.log(`Found ${barcodes.length} barcodes to generate images for\n`);
    
    let generated = 0;
    let errors = 0;
    
    for (const item of barcodes) {
      try {
        // Create canvas (680 x 285 as specified)
        const canvas = createCanvas(680, 285);
        const ctx = canvas.getContext('2d');
        
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 680, 285);
        
        // Draw border
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 660, 265);
        
        // Product name (top-left)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        const productName = item.product_name || `Product ${item.product_id}`;
        ctx.fillText(productName, 25, 40);
        
        // Price (top-right)
        const price = item.selling_price || item.unit_price || 0;
        if (price > 0) {
          ctx.textAlign = 'right';
          ctx.font = 'bold 22px Arial';
          const formattedPrice = `Rs. ${Number(price).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}`;
          ctx.fillText(formattedPrice, 655, 40);
        }
        
        // Generate barcode with user-specified settings
        const barcodeCanvas = createCanvas(640, 120);
        JsBarcode(barcodeCanvas, item.barcode, {
          format: 'CODE128',
          width: 2.4,  // Bar width as specified by user
          height: 100,
          displayValue: false,
          margin: 0  // No margins as specified by user
        });
        
        // Position barcode as specified by user
        const barcodeX = 45;  // 45px from left edge
        const barcodeY = 75;  // Vertical position
        
        // Draw barcode on main canvas
        ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);
        
        // Barcode text (centered below barcode)
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.barcode, 340, 240);
        
        // Save as JPEG
        const filename = `product_${item.product_id}.jpg`;
        const filepath = path.join(outputDir, filename);
        
        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
        fs.writeFileSync(filepath, buffer);
        
        generated++;
        
        if (generated % 50 === 0) {
          console.log(`Progress: ${generated}/${barcodes.length} images generated...`);
        }
        
      } catch (err) {
        console.error(`Error generating image for barcode ${item.barcode_id}:`, err.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('BARCODE IMAGE GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Generated: ${generated} images`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('='.repeat(60));
    
    // List first few files as samples
    const files = fs.readdirSync(outputDir).slice(0, 5);
    if (files.length > 0) {
      console.log('\nSample files created:');
      files.forEach(file => console.log(`  - ${file}`));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

generateBarcodeImages();
