import { Router } from 'express';
import { pool } from '../db';
import jwt from 'jsonwebtoken';

const router = Router();

async function computeNextProductId() {
  const r = await pool.query('SELECT COALESCE(MAX(product_id), 0) AS max_id FROM products');
  const maxId = Number(r.rows[0]?.max_id || 0);
  return maxId + 1;
}

router.get('/', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send('Server misconfigured');
  if (!token) return res.status(401).send('Unauthorized');
  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(401).send('Unauthorized');
  }

  try {
    const r = await pool.query('SELECT product_id, product_name, sku, category, low_stock_threshold FROM products ORDER BY product_id DESC');
    res.json({ products: r.rows });
  } catch (e: any) {
    res.status(500).send(e?.message || 'Server error');
  }
});

router.get('/next-id', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send('Server misconfigured');
  if (!token) return res.status(401).send('Unauthorized');
  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(401).send('Unauthorized');
  }

  try {
    const next = await computeNextProductId();
    res.json({ next_id: next });
  } catch (e: any) {
    res.status(500).send(e?.message || 'Server error');
  }
});

router.post('/', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send('Server misconfigured');
  if (!token) return res.status(401).send('Unauthorized');
  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(401).send('Unauthorized');
  }

  const { product_name, sku, category, low_stock_threshold } = req.body as {
    product_name: string; sku?: string; category?: string; low_stock_threshold?: number;
  };
  if (!product_name) return res.status(400).send('Missing product_name');
  try {
    const nextId = await computeNextProductId();
    const r = await pool.query(
      `INSERT INTO products (product_id, product_name, sku, category, low_stock_threshold) VALUES ($1, $2, $3, $4, $5)
       RETURNING product_id, product_name, sku, category, low_stock_threshold`,
      [nextId, product_name, sku || null, category || null, low_stock_threshold || 0]
    );
    res.json({ product: r.rows[0] });
  } catch (e: any) {
    if (e?.code === '23505') {
      return res.status(409).send('Conflict');
    }
    res.status(500).send(e?.message || 'Server error');
  }
});

router.put('/:id', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send('Server misconfigured');
  if (!token) return res.status(401).send('Unauthorized');
  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(401).send('Unauthorized');
  }

  const id = Number(req.params.id);
  const { product_name, sku, category, low_stock_threshold } = req.body as {
    product_name: string; sku?: string; category?: string; low_stock_threshold?: number;
  };
  
  if (!product_name) return res.status(400).send('Missing product_name');
  
  try {
    const r = await pool.query(
      `UPDATE products 
       SET product_name = $1, sku = $2, category = $3, low_stock_threshold = $4
       WHERE product_id = $5
       RETURNING product_id, product_name, sku, category, low_stock_threshold`,
      [product_name, sku || null, category || null, low_stock_threshold || 0, id]
    );
    
    if (r.rowCount === 0) {
      return res.status(404).send('Product not found');
    }
    
    res.json({ product: r.rows[0] });
  } catch (e: any) {
    if (e?.code === '23505') {
      return res.status(409).send('Conflict');
    }
    res.status(500).send(e?.message || 'Server error');
  }
});

router.delete('/:id', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send('Server misconfigured');
  if (!token) return res.status(401).send('Unauthorized');
  try {
    jwt.verify(token, secret);
  } catch {
    return res.status(401).send('Unauthorized');
  }

  const id = Number(req.params.id);
  if (!id) return res.status(400).send('Invalid id');
  
  try {
    const r = await pool.query(
      'DELETE FROM products WHERE product_id = $1 RETURNING product_id',
      [id]
    );
    
    if (r.rowCount === 0) {
      return res.status(404).send('Product not found');
    }
    
    res.json({ message: 'Product deleted successfully', product_id: r.rows[0].product_id });
  } catch (e: any) {
    res.status(500).send(e?.message || 'Server error');
  }
});

export default router;
