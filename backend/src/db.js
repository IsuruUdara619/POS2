"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.ensurePool = ensurePool;
const pg_1 = require("pg");
// Parse DATABASE_URL or use explicit parameters
const getDatabaseConfig = () => {
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
exports.pool = new pg_1.Pool(getDatabaseConfig());
// Function to ensure the pool is connected/ready (mostly for compatibility with previous logic)
async function ensurePool() {
    try {
        // Test connection
        const client = await exports.pool.connect();
        console.log('Successfully connected to PostgreSQL database.');
        client.release();
        return exports.pool;
    }
    catch (err) {
        console.error('Error connecting to PostgreSQL database:', err);
        throw err;
    }
}
