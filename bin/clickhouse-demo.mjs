import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { loadClickHouseFixtures } from '../dev/clickhouse/fixtures.mjs';

const port = 8124;
const binary = process.env.CLICKHOUSE_BIN || 'clickhouse';
const executable = binary.includes('/') || binary.includes('\\') ? resolve(binary) : binary;
const password = randomBytes(24).toString('hex');
const controller = new AbortController();
const root = await mkdtemp(join(tmpdir(), 'mosaic-clickhouse-'));
const dataPath = fileURLToPath(new URL('../data/', import.meta.url));
let child;
let exited;
let stopped = false;

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => controller.abort());
}

async function query(sql, database = 'default') {
  const response = await fetch(`http://127.0.0.1:${port}/?database=${database}`, {
    method: 'POST',
    headers: {
      'X-ClickHouse-User': 'default',
      'X-ClickHouse-Key': password
    },
    body: sql,
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)])
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text);
}

try {
  await writeFile(join(root, 'config.xml'), `<clickhouse>
  <logger><level>warning</level><console>true</console></logger>
  <listen_host>127.0.0.1</listen_host>
  <http_port>${port}</http_port>
  <timezone>UTC</timezone>
  <path>./data/</path>
  <tmp_path>./tmp/</tmp_path>
  <user_files_path>${dataPath.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</user_files_path>
  <background_schedule_pool_size>16</background_schedule_pool_size>
  <profiles>
    <default><max_threads>4</max_threads></default>
    <demo><readonly>2</readonly><max_threads>4</max_threads></demo>
  </profiles>
  <users>
    <default>
      <password>${password}</password>
      <networks><ip>127.0.0.1</ip></networks>
      <profile>default</profile><quota>default</quota>
    </default>
    <demo>
      <password></password>
      <networks><ip>127.0.0.1</ip></networks>
      <profile>demo</profile><quota>default</quota>
    </demo>
  </users>
  <quotas><default></default></quotas>
</clickhouse>`);

  child = spawn(executable, ['server', '--config-file', join(root, 'config.xml')], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit']
  });
  let startupError;
  child.once('error', error => { startupError = error; });
  exited = new Promise(resolve => child.once('close', code => {
    stopped = true;
    resolve(code);
  }));

  const deadline = Date.now() + 30_000;
  while (true) {
    controller.signal.throwIfAborted();
    if (startupError) throw new Error(`Cannot start ${executable}: ${startupError.message}. Install ClickHouse with server support first.`);
    if (stopped) throw new Error('ClickHouse exited during startup.');
    try {
      await query('SELECT 1');
      break;
    } catch (error) {
      if (Date.now() >= deadline) throw new Error(`ClickHouse did not become ready: ${error.message}`, { cause: error });
      await delay(200, undefined, { signal: controller.signal });
    }
  }

  await loadClickHouseFixtures(query);

  console.log(`ClickHouse demo ready on http://127.0.0.1:${port}.\nRun pnpm dev, then choose ClickHouse in the gallery. Ctrl-C stops the server and removes its data.`);
  await Promise.race([
    exited.then(code => { throw new Error(`ClickHouse exited unexpectedly (${code}).`); }),
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
  if (child?.pid && !stopped) {
    child.kill('SIGTERM');
    const kill = setTimeout(() => child.kill('SIGKILL'), 3000);
    await exited;
    clearTimeout(kill);
  }
  await rm(root, { recursive: true, force: true });
}
