const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migration to add missing columns to purchases and purchase_items tables...\n');
    
    const sqlPath = path.join(__dirname, '..', 'sql', 'add_purchase_items_columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query('BEGIN');
    
    // Execute the migration
    await client.query(sql);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📋 The following columns have been added:');
    console.log('   - purchases.unit_price');
    console.log('   - purchases.selling_price');
    console.log('   - purchases.purchase_date');
    console.log('   - purchase_items.selling_price');
    console.log('   - purchase_items.remaining_qty\n');
    console.log('✨ Your sales page should now properly populate Brand, Unit Price, and Selling Price fields!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
