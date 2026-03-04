const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/Heaven_Bakers'
});

async function test() {
  try {
    console.log('Testing connection to local PostgreSQL...');
    
    const res = await pool.query('SELECT NOW()');
    console.log('✓ Connection successful:', res.rows[0]);
    
    // Check if admin user exists
    const userCheck = await pool.query('SELECT COUNT(*) FROM users WHERE username = $1', ['admin']);
    console.log('✓ Admin user exists:', userCheck.rows[0].count > 0);
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('✓ Tables found:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
  } catch (err) {
    console.error('✗ Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

test();
