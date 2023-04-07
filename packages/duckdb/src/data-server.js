import cors from "@koa/cors";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import compress from "koa-compress";
import fs from "node:fs";
import http2 from "node:http2";
import path from "node:path";
import url from "node:url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export function dataServer(
  db,
  {
    compression = true,
    port = 443,
    responseTime = true,
    options = {
      key: fs.readFileSync(path.resolve(__dirname, "../localhost-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "../localhost.pem")),
    },
  } = {}
) {
  const app = new Koa();

  // locks

  let locked = false;
  const queue = [];

  function lock() {
    // if locked, add a promise to the queue
    // otherwise, grab the lock and proceed
    return locked
      ? new Promise((resolve) => queue.push(resolve))
      : (locked = true);
  }

  function unlock() {
    locked = queue.length > 0;
    if (locked) {
      // resolve the next promise in the queue
      queue.shift()();
    }
  }

  // cors support

  app.use(
    cors({
      allowMethods: ["OPTIONS", "POST", "GET"],
    })
  );

  // body parser

  app.use(bodyParser());

  // compression

  if (compression) {
    app.use(compress());
  }

  if (responseTime) {
    // logger

    app.use(async (ctx, next) => {
      await next();
      const rt = ctx.response.get("X-Response-Time");
      console.log(`${ctx.method} ${ctx.url} - ${rt}`);
    });

    // x-response-time

    app.use(async (ctx, next) => {
      const start = performance.now();
      await next();
      const ms = (performance.now() - start).toFixed(1);
      ctx.set("X-Response-Time", `${ms}ms`);
    });
  }

  // error handler

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.error(err);
      err.status = err.statusCode || err.status || 500;
      ctx.body = err.message;

      ctx.app.emit("error", err, ctx);
    }
  });

  // response

  /**
   * @param {Koa.ParameterizedContext<Koa.DefaultState} ctx the koa context
   * @param {{sql: string, type: string}} query the mosaic query
   */
  async function handleRequest(ctx, query) {
    const { sql, type } = query;
    console.log("QUERY", sql);

    // request the lock to serialize requests
    // we do this to avoid DuckDB + Arrow errors
    await lock();

    try {
      switch (type) {
        case "arrow": {
          // Apache Arrow response format
          const data = await db.arrowBuffer(sql);
          ctx.body = Buffer.from(data);
          break;
        }
        case "exec":
          // Execute query with no return value
          await db.exec(sql);
          ctx.status = 204;
          break;
        default:
          // JSON response format
          ctx.body = await db.query(sql);
          break;
      }
    } finally {
      unlock();
    }
  }

  app.use(async (ctx) => {
    switch (ctx.request.method) {
      case "OPTIONS":
        ctx.status = 204;
        break;
      case "GET":
        await handleRequest(ctx, ctx.request.query);
        break;
      case "POST": {
        await handleRequest(ctx, ctx.request.body);
        break;
      }
    }
  });

  const server = http2.createSecureServer(options, app.callback());
  server.listen(port);

  console.log(`Server running at https://localhost:${port}`)
}
