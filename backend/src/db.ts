import { Pool } from 'pg';

// Parse DATABASE_URL or use explicit parameters
const getDatabaseConfig = () => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    
    if (dbUrl) {
      // Parse connection string manually to avoid pg parsing issues
      const url = new URL(dbUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // Remove leading '/'
        user: url.username,
        password: url.password,
      };
    }
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error);
    // Fallback to default/env vars will happen below
  }
  
  // Fallback to individual env variables if needed
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
};

// Create a new pool instance using explicit parameters
export const pool = new Pool(getDatabaseConfig());

// Function to ensure the pool is connected/ready (mostly for compatibility with previous logic)
export async function ensurePool() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database.');
    client.release();
    return pool;
  } catch (err) {
    console.error('Error connecting to PostgreSQL database:', err);
    throw err;
  }
}
