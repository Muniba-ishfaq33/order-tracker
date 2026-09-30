const { pool } = require('./db');
const realtime = require('./realtime');
const { AppError } = require('./errors');

const STATUSES = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

const BASE_QUERY = `
  SELECT o.*, c.name AS product_name
  FROM orders o JOIN catalog c ON c.id = o.product_id
`;

function toId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Invalid order id');
  return id;
}

async function getOrder(orderId) {
  const [rows] = await pool.query(`${BASE_QUERY} WHERE o.id = ?`, [toId(orderId)]);
  return rows[0] || null;
}

async function getOrderOrFail(orderId) {
  const order = await getOrder(orderId);
  if (!order) throw new AppError('Order not found', 404);
  return order;
}

async function listOrders(customer) {
  if (customer) {
    const [rows] = await pool.query(
      `${BASE_QUERY} WHERE LOWER(o.customer_name) = LOWER(?) ORDER BY o.id DESC`,
      [customer]
    );
    return rows;
  }
  const [rows] = await pool.query(`${BASE_QUERY} ORDER BY o.id DESC`);
  return rows;
}

async function createOrder({ customer_name, product_id, quantity }) {
  const [products] = await pool.query('SELECT * FROM catalog WHERE id = ?', [product_id]);
  if (!products[0]) throw new AppError('Product not found', 404);

  const total = Number(products[0].price) * quantity;
  const [result] = await pool.query(
    'INSERT INTO orders (customer_name, product_id, quantity, total) VALUES (?, ?, ?, ?)',
    [customer_name, product_id, quantity, total]
  );

  const order = await getOrder(result.insertId);
  realtime.emitOrderEvent('order:created', order);
  realtime.broadcastAlert(`New order #${order.id} placed by ${order.customer_name}`, 'info');
  return order;
}

async function updateStatus(orderId, status) {
  if (!STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${STATUSES.join(', ')}`);
  }
  const order = await getOrderOrFail(orderId);
  if (['Delivered', 'Cancelled'].includes(order.status)) {
    throw new AppError(`Order #${order.id} is already ${order.status}`, 409);
  }

  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
  const updated = await getOrder(order.id);

  realtime.emitOrderEvent('order:statusUpdated', updated); // WebSocket
  const level = status === 'Cancelled' ? 'warning' : status === 'Delivered' ? 'success' : 'info';
  realtime.broadcastAlert(`Order #${updated.id} is now "${status}"`, level); // SSE
  return updated;
}

async function cancelOrder(orderId) {
  const order = await getOrderOrFail(orderId);
  if (!['Placed', 'Preparing'].includes(order.status)) {
    throw new AppError(`Order #${order.id} is "${order.status}" and can no longer be cancelled`, 409);
  }
  return updateStatus(order.id, 'Cancelled');
}

module.exports = {
  STATUSES, getOrder, getOrderOrFail, listOrders, createOrder, updateStatus, cancelOrder,
};