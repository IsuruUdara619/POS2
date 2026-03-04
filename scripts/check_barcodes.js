const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM barcode');
    console.log('Total barcode records:', result.rows[0].count);
    
    const withData = await pool.query('SELECT COUNT(*) as count FROM barcode WHERE brand IS NOT NULL OR purchase_date IS NOT NULL');
    console.log('Barcode records with brand/date:', withData.rows[0].count);
    
    const sample = await pool.query('SELECT * FROM barcode LIMIT 3');
    console.log('\nSample barcode records:');
    console.table(sample.rows);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
