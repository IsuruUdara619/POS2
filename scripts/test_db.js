const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://heaven_user:heaven_password@postgres:5432/Heaven_Bakers'
});

async function test() {
  try {
    // Test connection
    const res = await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful:', res.rows[0]);
    
    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n✓ Tables found:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
    // Check if there's data in users table
    if (tables.rows.some(r => r.table_name === 'users')) {
      const users = await pool.query('SELECT COUNT(*) FROM users');
      console.log('\n✓ Users count:', users.rows[0].count);
    }
    
    // Check if there's data in products table
    if (tables.rows.some(r => r.table_name === 'products')) {
      const products = await pool.query('SELECT COUNT(*) FROM products');
      console.log('✓ Products count:', products.rows[0].count);
    }
    
  } catch (err) {
    console.error('✗ Database error:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

test();
