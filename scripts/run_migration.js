const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    const sql = fs.readFileSync('add_barcode_columns.sql', 'utf8');
    await pool.query(sql);
    console.log('Migration completed successfully');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'barcode' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nCurrent barcode table structure:');
    console.table(result.rows);
    
    await pool.end();
  } catch (err) {
    console.error('Migration error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
