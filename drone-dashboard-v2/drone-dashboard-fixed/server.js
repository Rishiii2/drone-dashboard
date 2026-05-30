const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Always run in production mode when bundled, unless dev is specified
const dev = process.env.NODE_ENV === 'development';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

async function startServer() {
  await app.prepare();
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  
  return new Promise((resolve, reject) => {
    server.listen(3000, (err) => {
      if (err) return reject(err);
      console.log('> Ready on http://localhost:3000');
      resolve('http://localhost:3000');
    });
  });
}

module.exports = { startServer };
