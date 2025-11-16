/**
 * Custom Next.js Server with WebSocket Support
 *
 * Usage:
 * 1. Update package.json scripts:
 *    "dev": "node server.js",
 *    "start": "NODE_ENV=production node server.js"
 *
 * 2. The WebSocket server will run on the same port as Next.js
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server
  // Note: Import must be after app.prepare() to ensure all modules are loaded
  const { wsManager } = require('./lib/websocket/server');
  wsManager.initialize(server);

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/ws`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    wsManager.shutdown();
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    wsManager.shutdown();
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});
