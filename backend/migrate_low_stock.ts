
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './src/db';

async function migrate() {
  try {
    console.log('Starting migration: Adding low_stock_threshold to products table...');
    
    // Check if column exists first
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' AND column_name='low_stock_threshold';
    `);

    if (checkRes.rows.length === 0) {
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN low_stock_threshold NUMERIC(12,2) DEFAULT 0;
      `);
      console.log('Successfully added low_stock_threshold column.');
    } else {
      console.log('Column low_stock_threshold already exists.');
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
