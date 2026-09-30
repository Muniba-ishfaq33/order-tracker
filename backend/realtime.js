let io = null;
const sseClients = new Set();

const customerRoom = (name) => `customer:${String(name).trim().toLowerCase()}`;

function setIO(instance) {
  io = instance;
}

// Sends an order event only to agents and to the customer who owns the order
function emitOrderEvent(event, order) {
  if (!io) return;
  io.to('agents').to(customerRoom(order.customer_name)).emit(event, order);
}

function addClient(res) {
  sseClients.add(res);
}

function removeClient(res) {
  sseClients.delete(res);
}

// SSE: push an alert to everyone listening on /events
function broadcastAlert(message, level = 'info') {
  const data = JSON.stringify({ message, level, time: new Date().toISOString() });
  for (const res of sseClients) {
    res.write(`event: alert\ndata: ${data}\n\n`);
  }
}

module.exports = { setIO, customerRoom, emitOrderEvent, addClient, removeClient, broadcastAlert };