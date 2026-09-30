const realtime = require('./realtime');

module.exports = (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // stops proxies from buffering the stream
  });
  res.flushHeaders();

  res.write('retry: 5000\n\n'); // browser reconnects after 5s if the line drops
  res.write(`event: alert\ndata: ${JSON.stringify({
    message: 'Connected to live alerts', level: 'success', time: new Date().toISOString(),
  })}\n\n`);

  realtime.addClient(res);

  // A comment line every 25s keeps the connection from timing out
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    realtime.removeClient(res);
  });
};