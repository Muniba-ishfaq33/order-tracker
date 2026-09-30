const express = require('express');
const { pool } = require('../db');
const service = require('../orderService');
const realtime = require('../realtime');
const { AppError } = require('../errors');

const router = express.Router();

// Passes async errors to the error handler in server.js
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/v1/catalog
router.get('/catalog', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM catalog ORDER BY id');
  res.json(rows);
}));

// GET /api/v1/orders  (optional: ?customer=Ali)
router.get('/orders', wrap(async (req, res) => {
  res.json(await service.listOrders(req.query.customer));
}));

// GET /api/v1/orders/:id
router.get('/orders/:id', wrap(async (req, res) => {
  res.json(await service.getOrderOrFail(req.params.id));
}));

// POST /api/v1/orders
router.post('/orders', wrap(async (req, res) => {
  const { customer_name, product_id, quantity = 1 } = req.body;
  if (!customer_name || !String(customer_name).trim()) throw new AppError('customer_name is required');
  if (!Number.isInteger(product_id)) throw new AppError('product_id must be a number');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new AppError('quantity must be between 1 and 20');
  }
  const order = await service.createOrder({
    customer_name: String(customer_name).trim(), product_id, quantity,
  });
  res.status(201).json(order);
}));

// PATCH /api/v1/orders/:id/status   body: { "status": "Preparing" }
router.patch('/orders/:id/status', wrap(async (req, res) => {
  res.json(await service.updateStatus(req.params.id, req.body.status));
}));

// POST /api/v1/alerts   body: { "message": "...", "level": "warning" }
router.post('/alerts', wrap(async (req, res) => {
  const { message, level = 'info' } = req.body;
  if (!message || !String(message).trim()) throw new AppError('message is required');
  realtime.broadcastAlert(String(message).trim(), level);
  res.status(201).json({ sent: true });
}));

module.exports = router;