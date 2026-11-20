import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const dataPath = join(import.meta.dirname, '../../data/');

/** @param {{ port: number, signal?: AbortSignal }} options */
export async function startClickHouse({ port, signal }) {
  const binary = process.env.CLICKHOUSE_BIN || 'clickhouse';
  const executable = binary.includes('/') || binary.includes('\\') ? resolve(binary) : binary;
  const password = randomBytes(24).toString('hex');
  const root = await mkdtemp(join(tmpdir(), 'mosaic-clickhouse-'));
  let child;
  let exited;
  let stopped = false;

  async function query(sql, database = 'default') {
    const response = await fetch(`http://127.0.0.1:${port}/?database=${database}`, {
      method: 'POST',
      headers: {
        'X-ClickHouse-User': 'default',
        'X-ClickHouse-Key': password
      },
      body: sql,
      signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)].filter(Boolean))
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text);
  }

  async function stop() {
    if (child?.pid && !stopped) {
      child.kill('SIGTERM');
      const kill = setTimeout(() => child.kill('SIGKILL'), 3000);
      await exited;
      clearTimeout(kill);
    }
    await rm(root, { recursive: true, force: true });
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
      // The macOS Objective-C runtime aborts ClickHouse's forked child during startup otherwise.
      env: { ...process.env, OBJC_DISABLE_INITIALIZE_FORK_SAFETY: 'YES' },
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
      signal?.throwIfAborted();
      if (startupError) throw new Error(`Cannot start ${executable}: ${startupError.message}. Install ClickHouse with server support first, or set CLICKHOUSE_BIN to its path.`);
      if (stopped) throw new Error('ClickHouse exited during startup.');
      try {
        await query('SELECT 1');
        break;
      } catch (error) {
        if (Date.now() >= deadline) throw new Error(`ClickHouse did not become ready: ${error.message}`, { cause: error });
        await delay(200, undefined, { signal });
      }
    }
  } catch (error) {
    await stop();
    throw error;
  }

  return { query, stop, exited };
}
