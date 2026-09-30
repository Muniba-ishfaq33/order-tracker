require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { initDb } = require('./db');
const realtime = require('./realtime');
const restRoutes = require('./routes/rest');
const rpcRoutes = require('./routes/rpc');
const sseHandler = require('./sse');
const registerSockets = require('./sockets');

const app = express();
const server = http.createServer(app);

// FRONTEND_URL can hold one URL or several separated by commas
const origins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : '*';

app.use(cors({ origin: origins }));
app.use(express.json());

const io = new Server(server, { cors: { origin: origins, methods: ['GET', 'POST'] } });
realtime.setIO(io);
registerSockets(io);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    endpoints: { rest: '/api/v1/orders', rpc: '/rpc (POST)', sse: '/events', websocket: 'Socket.io on this same URL' },
  });
});

app.use('/api/v1', restRoutes);   // REST
app.use('/rpc', rpcRoutes);       // JSON-RPC 2.0
app.get('/events', sseHandler);   // SSE

// Central error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' && req.path === '/rpc') {
    return res.json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 5000;

initDb()
  .then(() => server.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => {
    console.error('Could not start. Is MySQL running and the database created?', err.message);
    process.exit(1);
  });