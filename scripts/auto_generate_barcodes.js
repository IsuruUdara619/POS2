const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function autoGenerateBarcodes() {
  const client = await pool.connect();
  
  try {
    console.log('Starting barcode auto-generation...\n');
    
    // Get all purchase items with their purchase information
    const purchaseItemsQuery = `
      SELECT 
        pi.purchase_item_id,
        pi.product_id,
        pi.brand,
        p.invoice_no,
        p.purchase_date
      FROM purchase_items pi
      JOIN purchases p ON p.purchase_id = pi.purchase_id
      ORDER BY p.purchase_date DESC, pi.purchase_item_id ASC
    `;
    
    const result = await client.query(purchaseItemsQuery);
    const purchaseItems = result.rows;
    
    console.log(`Found ${purchaseItems.length} purchase items to process\n`);
    
    let created = 0;
    let skipped = 0;
    const samples = [];
    
    await client.query('BEGIN');
    
    for (const item of purchaseItems) {
      const { product_id, brand, invoice_no, purchase_date } = item;
      
      // Generate barcode string with proper date formatting
      const pid = product_id;
      const brandPart = brand ? brand.replace(/\s+/g, '') : '';
      const invoicePart = invoice_no ? String(invoice_no).replace(/\s+/g, '').toUpperCase() : '';
      
      // Format date properly as YYYYMMDD
      let datePart = '';
      if (purchase_date) {
        const dateObj = new Date(purchase_date);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          datePart = `${year}${month}${day}`;
        }
      }
      
      const barcodeStr = `BC-${pid}${brandPart ? '-' + brandPart : ''}${invoicePart ? '-' + invoicePart : ''}${datePart ? '-' + datePart : ''}`;
      
      // Format date properly
      const dateForDb = purchase_date ? (purchase_date instanceof Date ? purchase_date.toISOString().slice(0, 10) : String(purchase_date).slice(0, 10)) : null;
      
      // Check if barcode already exists
      const existingCheck = await client.query(
        `SELECT barcode_id FROM barcode 
         WHERE product_id = $1 
         AND (brand IS NOT DISTINCT FROM $2)
         AND (invoice_no IS NOT DISTINCT FROM $3)
         AND (purchase_date IS NOT DISTINCT FROM $4)`,
        [product_id, brand || null, invoice_no || null, dateForDb]
      );
      
      if (existingCheck.rows.length > 0) {
        skipped++;
        continue;
      }
      
      // Insert new barcode
      const insertResult = await client.query(
        `INSERT INTO barcode (product_id, invoice_no, brand, purchase_date, barcode)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING barcode_id, barcode`,
        [
          product_id,
          invoice_no || null,
          brand || null,
          dateForDb,
          barcodeStr
        ]
      );
      
      created++;
      
      // Store first 5 samples
      if (samples.length < 5) {
        samples.push({
          barcode_id: insertResult.rows[0].barcode_id,
          product_id,
          barcode: barcodeStr,
          brand: brand || 'N/A',
          invoice: invoice_no || 'N/A',
          date: dateForDb || 'N/A'
        });
      }
    }
    
    await client.query('COMMIT');
    
    // Print results
    console.log('='.repeat(60));
    console.log('BARCODE AUTO-GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${created} new barcodes`);
    console.log(`⏭️  Skipped: ${skipped} (already existed)`);
    console.log(`📊 Total processed: ${purchaseItems.length} purchase items\n`);
    
    if (samples.length > 0) {
      console.log('Sample of generated barcodes:');
      console.table(samples);
    }
    
    // Show final count
    const finalCount = await client.query('SELECT COUNT(*) as count FROM barcode');
    console.log(`\n📦 Total barcodes in database: ${finalCount.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating barcodes:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

autoGenerateBarcodes();
