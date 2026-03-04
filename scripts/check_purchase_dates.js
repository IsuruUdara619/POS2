require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDates() {
  try {
    console.log('Checking purchase dates...\n');
    
    const result = await pool.query(`
      SELECT purchase_id, date, purchase_date 
      FROM purchases 
      ORDER BY purchase_id 
      LIMIT 10
    `);
    
    console.log('Sample purchases:');
    console.table(result.rows);
    
    const nullCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM purchases 
      WHERE purchase_date IS NULL
    `);
    
    console.log(`\nPurchases with NULL purchase_date: ${nullCount.rows[0].count}`);
    
    const totalCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM purchases
    `);
    
    console.log(`Total purchases: ${totalCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDates();
