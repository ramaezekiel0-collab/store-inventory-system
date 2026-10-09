const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, initDatabase, pool } = require('../server');

test('health endpoint works', async () => {
  await initDatabase();
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.service, 'inventory-api');
});

test('items endpoint returns seeded data', async () => {
  await initDatabase();
  const response = await request(app).get('/api/items');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length >= 1);
});

test('create item endpoint adds new item', async () => {
  await initDatabase();
  const response = await request(app)
    .post('/api/items')
    .send({ name: 'Notebook', sku: 'NOTE-NEW-222', quantity: 12, price: 3.25 });

  assert.equal(response.status, 201);
  assert.equal(response.body.name, 'Notebook');
});

process.on('exit', () => {
  pool.end().catch(() => {});
});
