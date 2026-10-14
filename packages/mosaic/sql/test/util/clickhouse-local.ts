import { spawn } from 'node:child_process';

const TIMEOUT_MS = 10_000;
const executable = process.env.CLICKHOUSE_BIN || 'clickhouse';
let version: string | undefined;

function output(chunks: Buffer[]) {
  return Buffer.concat(chunks).toString().trim();
}

function run(sql: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const args = [
      'local',
      '--query',
      sql
    ];
    const child = spawn(executable, args, {
      env: { ...process.env, TZ: 'UTC' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let settled = false;

    const finish = (callback: () => void) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        callback();
      }
    };
    const failure = (message: string) => new Error([
      message,
      `Executable: ${executable} local`,
      `Version: ${version ?? 'unknown'}`,
      `SQL:\n${sql}`,
      `stdout:\n${output(stdout) || '<empty>'}`,
      `stderr:\n${output(stderr) || '<empty>'}`
    ].join('\n\n'));
    const timer = setTimeout(() => finish(() => {
      child.kill();
      child.stdout.destroy();
      child.stderr.destroy();
      reject(failure(`ClickHouse Local timed out after ${TIMEOUT_MS} ms.`));
    }), TIMEOUT_MS);

    child.stdout.on('data', chunk => stdout.push(chunk));
    child.stderr.on('data', chunk => stderr.push(chunk));
    child.on('error', error => finish(() => {
      const missing = (error as NodeJS.ErrnoException).code === 'ENOENT';
      reject(new Error(missing
        ? `Unable to start ClickHouse Local: ${executable} was not found. `
          + 'Install ClickHouse or set CLICKHOUSE_BIN.'
        : `Unable to start ClickHouse Local: ${error.message}`
      ));
    }));
    child.on('close', (code, signal) => finish(() => {
      if (code === 0) {
        resolve(Buffer.concat(stdout));
        return;
      }
      reject(failure(
        `ClickHouse Local exited with code ${code}, signal ${signal ?? 'none'}.`
      ));
    }));
  });
}

export async function clickHouseLocalVersion(): Promise<string> {
  version = (await run('SELECT version()')).toString().trim();
  return version;
}

export async function executeClickHouseLocal(sql: string): Promise<void> {
  await run(sql);
}

export async function queryClickHouseLocal(
  sql: string
): Promise<Record<string, unknown>[]> {
  const text = (await run(`${sql} FORMAT JSONEachRow`)).toString().trim();
  return text ? text.split('\n').map(line => JSON.parse(line)) : [];
}
