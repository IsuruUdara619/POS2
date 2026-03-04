import { ensurePool, pool } from './src/db';

async function main() {
  await ensurePool();
  try {
    const res = await pool.query('SELECT * FROM users');
    console.log('Users:', res.rows);
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
