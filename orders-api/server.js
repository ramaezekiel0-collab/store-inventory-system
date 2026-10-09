const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT || 5001);
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'store_inventory',
  user: process.env.DB_USER || 'storeuser',
  password: process.env.DB_PASSWORD || 'storepass',
});

app.use(express.json());

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      total NUMERIC(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM orders');
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO orders (customer_name, total, status) VALUES
      ('Alicia', 13.25, 'completed'),
      ('Bruno', 8.50, 'pending');
    `);
  }
}

app.get('/health', async (_req, res) => {
  res.json({ status: 'ok', service: 'orders-api' });
});

app.get('/api/orders', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error('List orders failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customer_name, total } = req.body;

  if (!customer_name || total === undefined) {
    return res.status(400).json({ error: 'customer_name and total are required' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO orders (customer_name, total, status) VALUES ($1, $2, $3) RETURNING *',
      [customer_name, Number(total), 'pending']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create order failed:', error.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Update status failed:', error.message);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

if (require.main === module) {
  initDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`Orders API running on port ${port}`);
      });
    })
    .catch((error) => {
      console.error('Database initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { app, pool, initDatabase };
