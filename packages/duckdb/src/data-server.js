import http from 'node:http';
import path from 'node:path';
import url from 'node:url';
import { WebSocketServer } from 'ws';
import { Cache, cacheKey } from './Cache.js';
import { createBundle, loadBundle } from './load/bundle.js';

const CACHE_DIR = '.cache';

export function dataServer(db, {
  cache = true,
  rest = true,
  socket = true,
  port = 3000
} = {}) {
  const queryCache = cache ? new Cache({ dir: CACHE_DIR }) : null;
  const handleQuery = queryHandler(db, queryCache);
  const app = createHTTPServer(handleQuery, rest);
  if (socket) createSocketServer(app, handleQuery);

  app.listen(port);
  console.log(`Data server running on port ${port}`);
  if (rest) console.log(`  http://localhost:${port}/`);
  if (socket) console.log(`  ws://localhost:${port}/`);
}

function createHTTPServer(handleQuery, rest) {
  return http.createServer((req, resp) => {
    const res = httpResponse(resp);
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

function queryHandler(db, queryCache) {

  // retrieve query result
  async function retrieve(query, get) {
    const { sql, type, persist } = query;
    const key = cacheKey(sql, type);
    let result = queryCache?.get(key);

    if (result) {
      console.log('CACHE HIT');
    } else {
      result = await get(sql);
      if (persist) {
        queryCache?.set(key, result, { persist });
      }
    }

    return result;
  }

  // query request handler
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
      // request the lock to serialize requests
      // we do this to avoid DuckDB + Arrow errors
      if (res.lock) await res.lock();

      const { sql, type } = query;
      console.log(`QUERY (${type})`, sql);

      // process query and return result
      switch (type) {
        case 'arrow':
          // Apache Arrow response format
          res.arrow(
            await retrieve(query, sql => db.arrowBuffer(sql))
          );
          break;
        case 'exec':
          // Execute query with no return value
          await db.exec(sql);
          res.done();
          break;
        case 'bundle':
          // Create a named bundle of precomputed resources
          await createBundle(
            db, queryCache, query.queries,
            path.resolve(CACHE_DIR, query.name)
          );
          res.done();
          break;
        case 'load':
          // Load a named bundle of precomputed resources
          loadBundle(db, queryCache, path.resolve(CACHE_DIR, query.name));
          res.done();
          break;
        default:
          // JSON response format
          res.json(
            await retrieve(query, sql => db.query(sql))
          );
      }
    } catch (err) {
      res.error(err, 500);
    } finally {
      res.unlock?.();
    }

    console.log('REQUEST', (performance.now() - t0).toFixed(1));
  };
}

let locked = false;
const queue = [];

function httpResponse(res) {
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
    arrow(data) {
      res.setHeader('Content-Type', 'application/vnd.apache.arrow.stream');
      res.end(data);
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
  const BINARY = { binary: true, fin: true };

  return {
    arrow(data) {
      ws.send(data, BINARY);
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
