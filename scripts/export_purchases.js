const { Pool } = require('pg');
const XLSX = require('xlsx');
require('dotenv').config();

async function exportPurchases() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Connecting to database...');
    
    const query = `
      SELECT 
        p.product_name AS "Product Name",
        pi.qty AS "Quantity",
        pi.brand AS "Brand",
        pi.unit_price AS "Unit Price",
        pi.total_price AS "Total Price",
        pu.date AS "Purchase Date",
        pu.invoice_no AS "Invoice Number",
        v.name AS "Vendor"
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.product_id
      JOIN purchases pu ON pi.purchase_id = pu.purchase_id
      LEFT JOIN vendors v ON pu.vendor_id = v.vendor_id
      ORDER BY pu.date DESC, p.product_name
    `;

    console.log('Fetching purchase data...');
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('No purchase data found in the database.');
      await pool.end();
      return;
    }

    console.log(`Found ${result.rows.length} purchase records`);

    // Format dates
    const formattedData = result.rows.map(row => ({
      ...row,
      'Purchase Date': row['Purchase Date'] ? new Date(row['Purchase Date']).toLocaleString() : ''
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Auto-size columns
    const cols = [
      { wch: 30 }, // Product Name
      { wch: 10 }, // Quantity
      { wch: 15 }, // Brand
      { wch: 12 }, // Unit Price
      { wch: 12 }, // Total Price
      { wch: 20 }, // Purchase Date
      { wch: 15 }, // Invoice Number
      { wch: 20 }  // Vendor
    ];
    worksheet['!cols'] = cols;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchases');

    const filename = `Heaven_Bakers_Purchases_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    console.log(`\nExcel file created successfully: ${filename}`);
    console.log(`Total records exported: ${result.rows.length}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

exportPurchases();
