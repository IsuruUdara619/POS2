const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Heaven_Bakers',
  password: 'postgres',
  port: 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database. Running migration...\n');
    
    // Read the SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'allow_duplicate_barcodes.sql'), 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('SELECT')) {
        const result = await client.query(statement);
        console.log('Query result:');
        console.table(result.rows);
      } else {
        await client.query(statement);
        console.log('✓ Executed:', statement.substring(0, 60) + '...');
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nThe barcode table now allows duplicate barcodes with different dates.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
