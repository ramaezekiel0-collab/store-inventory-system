const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT || 5000);
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
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      price NUMERIC(10,2) NOT NULL DEFAULT 0
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM items');
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO items (name, sku, quantity, price) VALUES
      ('Coffee Beans', 'COFFEE-001', 25, 8.50),
      ('Notebook', 'NOTE-101', 40, 4.00),
      ('Pen Pack', 'PEN-204', 52, 2.75);
    `);
  }
}

app.get('/health', async (_req, res) => {
  res.json({ status: 'ok', service: 'inventory-api' });
});

app.get('/api/items', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM items ORDER BY id');
    res.json(rows);
  } catch (error) {
    console.error('List items failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Get item failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

app.post('/api/items', async (req, res) => {
  const { name, sku, quantity, price } = req.body;

  if (!name || !sku || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: 'name, sku, quantity and price are required' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO items (name, sku, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, sku, Number(quantity), Number(price)]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create item failed:', error.message);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  const { name, sku, quantity, price } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE items
       SET name = COALESCE($1, name),
           sku = COALESCE($2, sku),
           quantity = COALESCE($3, quantity),
           price = COALESCE($4, price)
       WHERE id = $5
       RETURNING *;`,
      [name || null, sku || null, quantity === undefined ? null : Number(quantity), price === undefined ? null : Number(price), req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Update item failed:', error.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

if (require.main === module) {
  initDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`Inventory API running on port ${port}`);
      });
    })
    .catch((error) => {
      console.error('Database initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { app, pool, initDatabase };
