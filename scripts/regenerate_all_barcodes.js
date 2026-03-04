const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function regenerateAllBarcodes() {
  const client = await pool.connect();
  
  try {
    console.log('Step 1: Clearing existing barcodes...\n');
    
    // Delete all existing barcodes
    await client.query('DELETE FROM barcode');
    console.log('✅ All existing barcodes cleared\n');
    
    console.log('Step 2: Regenerating barcodes with correct format...\n');
    
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
      
      // Format date properly for database
      const dateForDb = purchase_date ? (purchase_date instanceof Date ? purchase_date.toISOString().slice(0, 10) : String(purchase_date).slice(0, 10)) : null;
      
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
      
      if (created % 50 === 0) {
        console.log(`Progress: ${created}/${purchaseItems.length} barcodes created...`);
      }
    }
    
    await client.query('COMMIT');
    
    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('BARCODE REGENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${created} new barcodes`);
    console.log(`📊 Total processed: ${purchaseItems.length} purchase items\n`);
    
    if (samples.length > 0) {
      console.log('Sample of generated barcodes (with correct date format):');
      console.table(samples);
    }
    
    // Show final count
    const finalCount = await client.query('SELECT COUNT(*) as count FROM barcode');
    console.log(`\n📦 Total barcodes in database: ${finalCount.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

regenerateAllBarcodes();
