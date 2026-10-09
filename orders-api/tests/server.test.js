const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, initDatabase, pool } = require('../server');

test('health endpoint works', async () => {
  await initDatabase();
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.service, 'orders-api');
});

test('orders endpoint returns seeded data', async () => {
  await initDatabase();
  const response = await request(app).get('/api/orders');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length >= 1);
});

test('create order endpoint adds new order', async () => {
  await initDatabase();
  const response = await request(app)
    .post('/api/orders')
    .send({ customer_name: 'Carol', total: 22.50 });

  assert.equal(response.status, 201);
  assert.equal(response.body.customer_name, 'Carol');
});

process.on('exit', () => {
  pool.end().catch(() => {});
});
