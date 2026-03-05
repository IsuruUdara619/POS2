import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool, ensurePool } from './src/db';
import { Pool } from 'pg';
import authRouter from './src/routes/auth';
import usersRouter from './src/routes/users';
import productsRouter from './src/routes/products';
import barcodeRouter from './src/routes/barcode';
import vendorsRouter from './src/routes/vendors';
import purchasesRouter from './src/routes/purchases';
import inventoryRouter from './src/routes/inventory';
import salesRouter from './src/routes/sales';
import expensesRouter from './src/routes/expenses';
import customersRouter from './src/routes/customers';
import loyaltyRouter from './src/routes/loyalty';
import printRouter from './src/routes/print';
import logsRouter from './src/routes/logs';
import printerSettingsRouter from './src/routes/printerSettings';
import diagnosticsRouter from './src/routes/diagnostics';
import whatsappRouter from './src/routes/whatsapp';
import errorLogger from './src/middleware/errorLogger';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const app = express();
// Replace the manual CORS block with this:
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    return callback(null, origin); // reflect all origins
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
// Manual CORS headers - MUST BE FIRST middleware
// Debug middleware to log origin and headers
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  next();
});

// Root route to ensure backend is reachable
app.get('/', (req, res) => {
  res.status(200).send('Backend is running. API is available at /api');
});

app.use(express.json());

// Add request logging middleware
app.use(errorLogger.requestLogger());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/barcode', barcodeRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/sales', salesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/print', printRouter);
app.use('/api/logs', logsRouter);
app.use('/api/printer-settings', printerSettingsRouter);
app.use('/api/diagnostics', diagnosticsRouter);
app.use('/api/whatsapp', whatsappRouter);

// Serve frontend static files
// Backend-only mode
console.log('📦 Frontend not found, running in backend-only mode');

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Add error handling middleware (must be last)
app.use(errorLogger.errorHandler());

const port = process.env.PORT ? Number(process.env.PORT) : 5000;

async function init() {
  console.log('🔧 Initializing backend server...');
  
  console.log('📊 Environment:', {
    DATABASE_URL: process.env.DATABASE_URL ? '***configured***' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? '***configured***' : 'NOT SET',
    PORT: port
  });

  try {
    await ensurePool();
    console.log('✅ Database pool initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database pool:', error);
    throw new Error(`Database pool initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  const targetUrl = process.env.DATABASE_URL;
  if (!targetUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please configure database connection.');
  }

  let urlObj, dbName, adminUrl;
  try {
    urlObj = new URL(targetUrl);
    dbName = urlObj.pathname.slice(1);
    adminUrl = new URL(targetUrl);
    adminUrl.pathname = '/postgres';
    console.log('📂 Database:', dbName);
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('🗄️  Creating database tables...');
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier'))
    )
    `);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'cashier'`);
    await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await pool.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'cashier'))`);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      product_id SERIAL PRIMARY KEY,
      product_name VARCHAR(200) NOT NULL,
      sku VARCHAR(100),
      category VARCHAR(100)
    )
    `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      vendor_id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      contact_no1 VARCHAR(20),
      contact_no2 VARCHAR(20),
      email VARCHAR(200),
      address TEXT
    )
    `);
    await pool.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key`);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      inventory_id SERIAL PRIMARY KEY,
      product_id INT REFERENCES products(product_id),
      vendor_id INT REFERENCES vendors(vendor_id),
      brand VARCHAR(100),
      qty NUMERIC(12,2) NOT NULL DEFAULT 0,
      UNIQUE(product_id, vendor_id, brand)
    )
    `);
    // Deduplicate any accidental duplicates caused by NULL brand allowing multiple rows
    await pool.query(`
      DELETE FROM inventory_items i USING inventory_items j
      WHERE i.inventory_id > j.inventory_id
        AND i.product_id = j.product_id
        AND i.vendor_id = j.vendor_id
        AND (i.brand IS NOT DISTINCT FROM j.brand)
    `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id SERIAL PRIMARY KEY,
      name VARCHAR(200),
      contact_no VARCHAR(20),
      address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
    `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS sales (
      sale_id SERIAL PRIMARY KEY,
      sale_invoice_no VARCHAR(100),
      customer_id INT REFERENCES customers(customer_id),
      date TIMESTAMP DEFAULT NOW(),
      total_amount NUMERIC(12,2),
      discount NUMERIC(10,2),
      note TEXT
    )
    `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_items (
      sales_item_id SERIAL PRIMARY KEY,
      sale_id INT REFERENCES sales(sale_id) ON DELETE CASCADE,
      inventory_id INT REFERENCES inventory_items(inventory_id),
      qty NUMERIC(12,2) NOT NULL,
      brand VARCHAR(100),
      unit_price NUMERIC(10,2),
      selling_price NUMERIC(10,2),
      profit NUMERIC(12,2)
    )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        purchase_id SERIAL PRIMARY KEY,
        invoice_no VARCHAR(100),
        vendor_id INT REFERENCES vendors(vendor_id),
        date TIMESTAMP DEFAULT NOW(),
        bill_price NUMERIC(12,2) DEFAULT 0,
        unit_price NUMERIC(10,2),
        selling_price NUMERIC(10,2)
      )
    `);
    await pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS purchase_date DATE`);
    await pool.query(`ALTER TABLE purchases ALTER COLUMN purchase_date TYPE DATE USING purchase_date::date`);
    await pool.query(`UPDATE purchases SET purchase_date = date::date WHERE purchase_date IS NULL OR purchase_date IS DISTINCT FROM date::date`);
    await pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2)`);
    await pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2)`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS barcode (
        barcode_id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(product_id),
        invoice_no VARCHAR(100),
        brand VARCHAR(100),
        purchase_date DATE,
        barcode VARCHAR(200) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE barcode ADD COLUMN IF NOT EXISTS purchase_id INT`);
    await pool.query(`ALTER TABLE barcode ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(100)`);
    await pool.query(`ALTER TABLE barcode ADD COLUMN IF NOT EXISTS brand VARCHAR(100)`);
    await pool.query(`ALTER TABLE barcode ADD COLUMN IF NOT EXISTS purchase_date DATE`);
    await pool.query(`ALTER TABLE barcode DROP CONSTRAINT IF EXISTS fk_purchase`);
    await pool.query(`ALTER TABLE barcode ADD CONSTRAINT fk_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id) ON DELETE CASCADE`);
    await pool.query(`ALTER TABLE barcode DROP COLUMN IF EXISTS purchase_id`);
    await pool.query(`ALTER TABLE barcode DROP COLUMN IF EXISTS date`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        expense_id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        note TEXT
      )
    `);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
    await pool.query(`UPDATE expenses SET created_at = NOW() WHERE created_at IS NULL`);
    await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS nic VARCHAR(20)`);
    await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS joined_date DATE`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loyalty_customers (
        loyalty_customer_id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        mobile_no VARCHAR(20),
        nic VARCHAR(20),
        address TEXT,
        joined_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_items (
        purchase_item_id SERIAL PRIMARY KEY,
        purchase_id INT REFERENCES purchases(purchase_id) ON DELETE CASCADE,
        product_id INT REFERENCES products(product_id),
        qty NUMERIC(12,2) NOT NULL,
        total_price NUMERIC(12,2) NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL,
        brand VARCHAR(100),
        selling_price NUMERIC(10,2),
        remaining_qty NUMERIC(12,2)
      )
    `);
    await pool.query(`ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS remaining_qty NUMERIC(12,2)`);
    await pool.query(`ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2)`);
    await pool.query(`UPDATE purchase_items SET remaining_qty = qty WHERE remaining_qty IS NULL`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS printer_settings (
        setting_id SERIAL PRIMARY KEY,
        printer_name VARCHAR(255) DEFAULT 'XP-80C',
        font_header INTEGER DEFAULT 13,
        font_items INTEGER DEFAULT 6,
        font_subtotal INTEGER DEFAULT 6,
        font_total INTEGER DEFAULT 8,
        font_payment INTEGER DEFAULT 7,
        margin_top INTEGER DEFAULT 10,
        margin_bottom INTEGER DEFAULT 10,
        footer_spacing INTEGER DEFAULT 20,
        paper_height INTEGER DEFAULT 842,
        line_spacing INTEGER DEFAULT 12,
        align_header VARCHAR(10) DEFAULT 'center',
        align_items VARCHAR(10) DEFAULT 'left',
        align_totals VARCHAR(10) DEFAULT 'right',
        align_payment VARCHAR(10) DEFAULT 'left',
        align_footer VARCHAR(10) DEFAULT 'center',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      INSERT INTO printer_settings (
        printer_name, font_header, font_items, font_subtotal, font_total, font_payment,
        margin_top, margin_bottom, footer_spacing, paper_height, line_spacing,
        align_header, align_items, align_totals, align_payment, align_footer
      )
      SELECT 'XP-80C', 13, 6, 6, 8, 7, 10, 10, 20, 842, 12, 'center', 'left', 'right', 'left', 'center'
      WHERE NOT EXISTS (SELECT 1 FROM printer_settings LIMIT 1)
    `);
    console.log('✅ All database tables created successfully');
  } catch (e: any) {
    console.error('❌ Error creating tables:', e.message);
    if (e?.message && /does not exist/i.test(e.message)) {
      const adminPool = new Pool({ connectionString: adminUrl.toString() });
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      await adminPool.end();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role VARCHAR(20) DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier'))
        )
      `);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'cashier'`);
      await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
      await pool.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'cashier'))`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          product_id SERIAL PRIMARY KEY,
          product_name VARCHAR(200) NOT NULL,
          sku VARCHAR(100),
          category VARCHAR(100)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vendors (
          vendor_id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          contact_no1 VARCHAR(20),
          contact_no2 VARCHAR(20),
          email VARCHAR(200),
          address TEXT
        )
      `);
      await pool.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          inventory_id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(product_id),
          vendor_id INT REFERENCES vendors(vendor_id),
          brand VARCHAR(100),
          qty NUMERIC(12,2) NOT NULL DEFAULT 0,
          UNIQUE(product_id, vendor_id, brand)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          customer_id SERIAL PRIMARY KEY,
          name VARCHAR(200),
          contact_no VARCHAR(20),
          address TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sales (
          sale_id SERIAL PRIMARY KEY,
          sale_invoice_no VARCHAR(100),
          customer_id INT REFERENCES customers(customer_id),
          date TIMESTAMP DEFAULT NOW(),
          total_amount NUMERIC(12,2),
          discount NUMERIC(10,2),
          note TEXT
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sales_items (
          sales_item_id SERIAL PRIMARY KEY,
          sale_id INT REFERENCES sales(sale_id) ON DELETE CASCADE,
          inventory_id INT REFERENCES inventory_items(inventory_id),
          qty NUMERIC(12,2) NOT NULL,
          brand VARCHAR(100),
          unit_price NUMERIC(10,2),
          selling_price NUMERIC(10,2),
          profit NUMERIC(12,2)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS purchases (
          purchase_id SERIAL PRIMARY KEY,
          invoice_no VARCHAR(100),
          vendor_id INT REFERENCES vendors(vendor_id),
          date TIMESTAMP DEFAULT NOW(),
          bill_price NUMERIC(12,2) DEFAULT 0,
          unit_price NUMERIC(10,2),
          selling_price NUMERIC(10,2)
        )
      `);
      await pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS purchase_date DATE`);
      await pool.query(`ALTER TABLE purchases ALTER COLUMN purchase_date TYPE DATE USING purchase_date::date`);
      await pool.query(`UPDATE purchases SET purchase_date = date::date WHERE purchase_date IS NULL OR purchase_date IS DISTINCT FROM date::date`);
      await pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2)`);
      await pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2)`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS barcode (
          barcode_id SERIAL PRIMARY KEY,
          product_id INT REFERENCES products(product_id),
          invoice_no VARCHAR(100),
          brand VARCHAR(100),
          purchase_date DATE,
          barcode VARCHAR(200) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`ALTER TABLE barcode ADD COLUMN IF NOT EXISTS purchase_id INT`);
      await pool.query(`ALTER TABLE barcode ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(100)`);
      await pool.query(`ALTER TABLE barcode ADD COLUMN IF NOT EXISTS brand VARCHAR(100)`);
      await pool.query(`ALTER TABLE barcode ADD COLUMN IF NOT EXISTS purchase_date DATE`);
      await pool.query(`ALTER TABLE barcode DROP CONSTRAINT IF EXISTS fk_purchase`);
      await pool.query(`ALTER TABLE barcode ADD CONSTRAINT fk_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id) ON DELETE CASCADE`);
      await pool.query(`ALTER TABLE barcode DROP COLUMN IF EXISTS purchase_id`);
      await pool.query(`ALTER TABLE barcode DROP COLUMN IF EXISTS date`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS expenses (
          expense_id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          amount NUMERIC(12,2) NOT NULL,
          note TEXT
        )
      `);
      await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
      await pool.query(`UPDATE expenses SET created_at = NOW() WHERE created_at IS NULL`);
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS nic VARCHAR(20)`);
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS joined_date DATE`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS loyalty_customers (
          loyalty_customer_id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          mobile_no VARCHAR(20),
          nic VARCHAR(20),
          address TEXT,
          joined_date DATE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS purchase_items (
          purchase_item_id SERIAL PRIMARY KEY,
          purchase_id INT REFERENCES purchases(purchase_id) ON DELETE CASCADE,
          product_id INT REFERENCES products(product_id),
          qty NUMERIC(12,2) NOT NULL,
          total_price NUMERIC(12,2) NOT NULL,
          unit_price NUMERIC(10,2) NOT NULL,
          brand VARCHAR(100),
          selling_price NUMERIC(10,2),
          remaining_qty NUMERIC(12,2)
        )
      `);
      await pool.query(`ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS remaining_qty NUMERIC(12,2)`);
      await pool.query(`ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10,2)`);
      await pool.query(`UPDATE purchase_items SET remaining_qty = qty WHERE remaining_qty IS NULL`);
      console.log('✅ Database created and tables initialized');
    } catch (e) {
      console.error('❌ Unexpected database error:', e);
      throw e;
    }
  }

  console.log('👤 Setting up admin user...');
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (username && password) {
    try {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (username, password, role) VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role`,
        [username, hash, 'admin']
      );
      console.log(`✅ Admin user '${username}' configured`);
    } catch (error) {
      console.error('❌ Failed to setup admin user:', error);
      throw new Error(`Admin user setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    console.warn('⚠️  Admin credentials not configured');
  }

  console.log('✅ Backend initialization complete');
}

// Health check endpoint
let isReady = false;
let initError: Error | null = null;

app.get('/health', (req, res) => {
  if (initError) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Backend initialization failed', 
      error: initError.message 
    });
  }
  if (!isReady) {
    return res.status(503).json({ 
      status: 'initializing', 
      message: 'Backend is starting up...' 
    });
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server immediately
const server = app.listen(port, '0.0.0.0', () => { 
  console.log(`✅ Server listening on port ${port}`);
  console.log(`🚀 Backend server starting...`);
  
  // Run initialization in background
  init().then(() => {
    isReady = true;
    console.log('✨ System fully operational');
  }).catch((e) => {
    isReady = false;
    initError = e;
    console.error('❌ Backend initialization failed:', e);
    console.error('Stack trace:', e.stack);
    // Do NOT exit process, keep server alive for logs/health check
  });
});
