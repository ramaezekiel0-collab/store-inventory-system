CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
);

INSERT INTO items (name, sku, quantity, price)
VALUES
  ('Coffee Beans', 'COFFEE-001', 24, 8.50),
  ('Notebook', 'NOTE-101', 40, 4.00),
  ('Pen Pack', 'PEN-204', 55, 2.75)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO orders (customer_name, total, status)
VALUES
  ('Alicia', 13.25, 'completed'),
  ('Bruno', 8.50, 'pending')
ON CONFLICT DO NOTHING;
