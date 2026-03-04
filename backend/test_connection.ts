import { pool } from './src/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL database!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('\n📅 Current database time:', result.rows[0].current_time);
    console.log('🗄️  PostgreSQL version:', result.rows[0].version);
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\n📋 Available tables:');
    tables.rows.forEach((row: any) => console.log('   -', row.table_name));
    
    // Check users
    const users = await client.query('SELECT username, role FROM users');
    console.log('\n👥 Users in database:');
    users.rows.forEach((row: any) => console.log(`   - ${row.username} (${row.role})`));
    
    client.release();
    console.log('\n✅ Database connection test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
}

testConnection();
