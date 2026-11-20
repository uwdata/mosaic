import { loadClickHouseFixtures } from '../dev/clickhouse/fixtures.mjs';
import { startClickHouse } from '../dev/clickhouse/server.mjs';

const port = 8124;
const controller = new AbortController();

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => controller.abort());
}

let server;
try {
  server = await startClickHouse({ port, signal: controller.signal });
  await loadClickHouseFixtures(server.query);

  console.log(`ClickHouse demo ready on http://127.0.0.1:${port}.\nRun pnpm dev, then choose ClickHouse in the gallery. Ctrl-C stops the server and removes its data.`);
  await Promise.race([
    server.exited.then(code => { throw new Error(`ClickHouse exited unexpectedly (${code}).`); }),
    new Promise(resolve => {
      if (controller.signal.aborted) resolve();
      else controller.signal.addEventListener('abort', resolve, { once: true });
    })
  ]);
} catch (error) {
  if (!controller.signal.aborted) {
    console.error(error.message);
    process.exitCode = 1;
  }
} finally {
  await server?.stop();
}
