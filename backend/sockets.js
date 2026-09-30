const { customerRoom } = require('./realtime');

const history = {};          // room -> list of chat messages
const pending = new Map();   // room -> help requests no agent has picked up yet

module.exports = (io) => {
  io.on('connection', (socket) => {

    // ---- Presence ----
    socket.on('customer:online', ({ name }) => {
      if (!name) return;
      socket.data.name = name;
      socket.data.role = 'customer';
      socket.join(customerRoom(name)); // private room for this customer's order updates
    });

    socket.on('agent:online', ({ name }) => {
      socket.data.name = name;
      socket.data.role = 'agent';
      socket.join('agents');
      socket.emit('agent:ready', { openRequests: [...pending.values()] });
    });

    // ---- Customer asks for help ----
    socket.on('support:request', ({ orderId, customerName }) => {
      const room = `support-order-${orderId}`;
      socket.join(room);
      socket.data.name = customerName;
      socket.data.role = 'customer';

      const members = io.sockets.adapter.rooms.get(room);
      const agentAlreadyInside = members && members.size > 1;

      socket.emit('chat:joined', { room, history: history[room] || [] });

      if (!agentAlreadyInside) {
        const request = { room, orderId, customerName, time: new Date().toISOString() };
        pending.set(room, request);
        io.to('agents').emit('support:newRequest', request);
        socket.emit('chat:system', { room, text: 'Waiting for a support agent to join...' });
      }
    });

    // ---- Agent joins a customer's room ----
    socket.on('chat:join', ({ room, name }) => {
      if (!socket.rooms.has('agents')) {
        return socket.emit('chat:error', 'Only support agents can join');
      }
      const members = io.sockets.adapter.rooms.get(room);
      if (!members || members.size === 0) {
        return socket.emit('chat:error', 'This chat is no longer available');
      }
      if (members.size >= 2 && !members.has(socket.id)) {
        return socket.emit('chat:error', 'Another agent already took this chat (1-on-1 only)');
      }

      socket.join(room);
      socket.data.name = name;
      socket.data.role = 'agent';
      pending.delete(room);
      io.to('agents').emit('support:removed', { room });

      socket.emit('chat:joined', { room, history: history[room] || [] });
      socket.to(room).emit('chat:system', { room, text: `Support agent ${name} joined the chat` });
    });

    // ---- Messages ----
    socket.on('chat:message', ({ room, text }) => {
      if (!socket.rooms.has(room) || !text || !String(text).trim()) return;

      const msg = {
        id: `${Date.now()}-${Math.random()}`,
        room,
        sender: socket.data.name || 'Unknown',
        role: socket.data.role,
        text: String(text).trim().slice(0, 500),
        time: new Date().toISOString(),
      };
      history[room] = [...(history[room] || []), msg].slice(-100);
      io.to(room).emit('chat:message', msg);
    });

    socket.on('chat:typing', ({ room }) => {
      if (socket.rooms.has(room)) {
        socket.to(room).emit('chat:typing', { room, name: socket.data.name });
      }
    });

    // ---- Leaving ----
    socket.on('chat:leave', ({ room }) => {
      const who = socket.data.name || 'Someone';
      socket.leave(room);
      if (socket.data.role === 'customer' && pending.has(room)) {
        pending.delete(room);
        io.to('agents').emit('support:removed', { room });
      }
      socket.to(room).emit('chat:system', { room, text: `${who} left the chat` });
    });

    // "disconnecting" fires while socket.rooms is still filled
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (!room.startsWith('support-order-')) continue;
        socket.to(room).emit('chat:system', {
          room, text: `${socket.data.name || 'User'} disconnected`,
        });
        if (socket.data.role === 'customer' && pending.has(room)) {
          pending.delete(room);
          io.to('agents').emit('support:removed', { room });
        }
      }
    });
  });
};