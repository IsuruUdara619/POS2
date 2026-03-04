require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkInventory() {
  try {
    console.log('Checking inventory dates for inventory_id = 1...\n');
    
    // Check what the inventory endpoint query returns
    const result = await pool.query(`
      SELECT
        i.inventory_id,
        i.product_id,
        p.product_name,
        i.brand,
        MAX(pr.purchase_date::date) AS purchase_date,
        MAX(pr.date::date) AS original_date
      FROM inventory_items i
      LEFT JOIN products p ON p.product_id = i.product_id
      LEFT JOIN purchase_items pi ON pi.product_id = i.product_id AND (pi.brand IS NOT DISTINCT FROM i.brand)
      LEFT JOIN purchases pr ON pr.purchase_id = pi.purchase_id AND pr.vendor_id = i.vendor_id
      WHERE i.inventory_id = 1
      GROUP BY i.inventory_id, i.product_id, p.product_name, i.brand
    `);
    
    console.log('Inventory query result:');
    console.table(result.rows);
    
    // Check the actual purchase_items and purchases for this inventory
    const purchaseDetails = await pool.query(`
      SELECT 
        pi.purchase_item_id,
        pi.product_id,
        pi.brand,
        pi.unit_price,
        pi.selling_price,
        p.purchase_id,
        p.date,
        p.purchase_date
      FROM purchase_items pi
      JOIN purchases p ON p.purchase_id = pi.purchase_id
      JOIN inventory_items i ON i.product_id = pi.product_id AND (i.brand IS NOT DISTINCT FROM pi.brand)
      WHERE i.inventory_id = 1
      ORDER BY pi.purchase_item_id DESC
      LIMIT 5
    `);
    
    console.log('\nRelated purchase items:');
    console.table(purchaseDetails.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkInventory();
