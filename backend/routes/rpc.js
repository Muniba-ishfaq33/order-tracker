const express = require('express');
const service = require('../orderService');
const { AppError } = require('../errors');

const router = express.Router();

const invalidParams = (msg) => Object.assign(new Error(msg), { rpcCode: -32602 });

// Each key is a method name a client can call
const methods = {
  listMethods: async () => Object.keys(methods),

  getOrderStatus: async ({ orderId }) => {
    if (orderId === undefined) throw invalidParams('orderId is required');
    const order = await service.getOrderOrFail(orderId);
    return { orderId: order.id, status: order.status };
  },

  cancelOrder: async ({ orderId }) => {
    if (orderId === undefined) throw invalidParams('orderId is required');
    const order = await service.cancelOrder(orderId);
    return { orderId: order.id, status: order.status, message: `Order #${order.id} cancelled` };
  },
};

router.post('/', async (req, res) => {
  const body = req.body || {};
  const { jsonrpc, method, params, id } = body;
  const isNotification = !('id' in body); // no id = client wants no reply
  const reply = (payload) => res.json({ jsonrpc: '2.0', ...payload, id: id ?? null });

  if (Array.isArray(body) || jsonrpc !== '2.0' || typeof method !== 'string') {
    return reply({ error: { code: -32600, message: 'Invalid Request' } });
  }
  if (!Object.prototype.hasOwnProperty.call(methods, method)) {
    return reply({ error: { code: -32601, message: `Method not found: ${method}` } });
  }

  try {
    const safeParams = params && typeof params === 'object' && !Array.isArray(params) ? params : {};
    const result = await methods[method](safeParams);
    if (isNotification) return res.status(204).end();
    reply({ result });
  } catch (err) {
    if (err.rpcCode) return reply({ error: { code: err.rpcCode, message: err.message } });
    if (err instanceof AppError) {
      return reply({ error: { code: -32000, message: err.message, data: { httpStatus: err.status } } });
    }
    console.error(err);
    reply({ error: { code: -32603, message: 'Internal error' } });
  }
});

module.exports = router;