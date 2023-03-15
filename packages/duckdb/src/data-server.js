import http from 'node:http';
import url from 'node:url';
import zlib from 'node:zlib';
import stream from 'node:stream';
import {pipeline} from 'node:stream/promises';
import { WebSocketServer } from 'ws';

export function dataServer(db, {
  rest = true,
  socket = true,
  gzip = true,
  port = 3000
} = {}) {
  const handleQuery = queryHandler(db);
  const app = createHTTPServer(handleQuery, rest, gzip);
  if (socket) createSocketServer(app, handleQuery);

  app.listen(port);
  console.log(`Data server running on port ${port}`);
  if (rest) console.log(`  http://localhost:${port}/`);
  if (socket) console.log(`  ws://localhost:${port}/`);
}

function createHTTPServer(handleQuery, rest, gzip) {
  return http.createServer((req, resp) => {
    const res = httpResponse(resp, gzip);
    if (!rest) {
      res.done();
      return;
    }

    resp.setHeader('Access-Control-Allow-Origin', '*');
    resp.setHeader('Access-Control-Request-Method', '*');
    resp.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
    resp.setHeader('Access-Control-Allow-Headers', '*');
    resp.setHeader('Access-Control-Max-Age', 2592000);

    switch (req.method) {
      case 'OPTIONS':
        res.done();
        break;
      case 'GET':
        handleQuery(res, url.parse(req.url, true).query);
        break;
      case 'POST': {
        const chunks = [];
        req.on('error', err => res.error(err, 500));
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => handleQuery(res, Buffer.concat(chunks)));
        break;
      }
      default:
        res.error(`Unsupported HTTP method: ${req.method}`, 400);
    }
  });
}

function createSocketServer(server, handleQuery) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', socket => {
    const res = socketResponse(socket);
    socket.on('message', data => handleQuery(res, data));
  });
}

function queryHandler(db) {
  return async (res, data) => {
    const t0 = performance.now();

    // parse incoming query
    let query;
    try {
      query = JSON.parse(data);
    } catch (err) {
      res.error(err, 400);
      return;
    }

    try {
      const { sql, type } = query;
      console.log('QUERY', sql);

      // request the lock to serialize requests
      // we do this to avoid DuckDB + Arrow errors
      await res.lock?.();

      // process query and return result
      switch (type) {
        case 'arrow':
          // Apache Arrow response format
          await res.stream(await db.arrowStream(sql));
          break;
        case 'exec':
          // Execute query with no return value
          await db.exec(sql);
          res.done();
          break;
        default:
          // JSON response format
          res.json(await db.query(sql));
      }
    } catch (err) {
      res.error(err, 500);
    } finally {
      res.unlock?.();
    }

    console.log('REQUEST', Math.round(performance.now() - t0));
  };
}

let locked = false;
const queue = [];

function httpResponse(res, gzip) {
  return {
    lock() {
      // if locked, add a promise to the queue
      // otherwise, grab the lock and proceed
      return locked
        ? new Promise(resolve => queue.push(resolve))
        : (locked = true);
    },
    unlock() {
      locked = queue.length > 0;
      if (locked) {
        // resolve the next promise in the queue
        queue.shift()();
      }
    },
    async stream(iter) {
      res.setHeader('Content-Type', 'application/octet-stream');
      if (gzip) res.setHeader('Content-Encoding', 'gzip');
      await pipeline([
        stream.Readable.from(iter),
        ...gzip ? [zlib.createGzip()] : [],
        res
      ]);
    },
    json(data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    },
    done() {
      res.writeHead(200);
      res.end();
    },
    error(err, code) {
      console.error(err);
      res.writeHead(code);
      res.end();
    }
  }
}

function socketResponse(ws) {
  const STRING = { binary: false, fin: true };
  const FRAGMENT = { binary: true, fin: false };
  const DONE = { binary: true, fin: true };
  const NULL = new Uint8Array(0);

  return {
    async stream(iter) {
      for await (const chunk of iter) {
        ws.send(chunk, FRAGMENT);
      }
      ws.send(NULL, DONE);
    },
    json(data) {
      ws.send(JSON.stringify(data), STRING);
    },
    done() {
      this.json({});
    },
    error(err) {
      console.error(err);
      this.json({ error: String(err) });
    }
  };
}
