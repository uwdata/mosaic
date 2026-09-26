import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { conformanceRoot } from './cases.ts';
import type { Target } from '../implementations/index.ts';

const readyTimeout = Number(process.env.CONFORMANCE_READY_TIMEOUT ?? 300_000);
const logDir = path.join(conformanceRoot, '.logs');
const maxLog = 512 * 1024;

export interface RunningServer {
  url: string;
  stop: () => Promise<void>;
}

export async function startServer(config: Target, label = config.name): Promise<RunningServer> {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}/`;
  if (!config.command) throw new Error(`${config.name} is not a server target`);
  const { cmd, args, cwd, env } = config.command(port);
  const child = spawn(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let log = '';
  const append = (chunk: Buffer) => {
    log += chunk.toString();
    if (log.length > maxLog) log = log.slice(-maxLog);
  };
  child.stdout!.on('data', append);
  child.stderr!.on('data', append);
  let exited: { code: number | null; signal: NodeJS.Signals | null } | undefined;
  child.on('exit', (code, signal) => { exited = { code, signal }; });
  const spawnError = new Promise<Error>(resolve => child.on('error', resolve));

  const stop = async () => {
    await killTree(child);
    mkdirSync(logDir, { recursive: true });
    writeFileSync(path.join(logDir, `${label}.log`), log);
  };

  const started = Date.now();
  console.log(`[conformance] starting ${config.name}: ${cmd} ${args.join(' ')} (cwd ${cwd})`);
  while (Date.now() - started < readyTimeout) {
    if (exited) {
      await stop();
      throw new Error(`${config.name} exited before it was ready (code ${exited.code}, signal ${exited.signal})\n${log}`);
    }
    const error = await Promise.race([spawnError, sleep(0).then(() => undefined)]);
    if (error) throw new Error(`could not spawn ${cmd}: ${error.message}`);
    if (await answers(url)) {
      console.log(`[conformance] ${config.name} ready on ${url} after ${Date.now() - started} ms`);
      return { url, stop };
    }
    await sleep(250);
  }
  await stop();
  throw new Error(`${config.name} did not answer on ${url} within ${readyTimeout} ms\n${log}`);
}

async function answers(url: string) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'arrow', sql: 'SELECT 1' }),
      signal: AbortSignal.timeout(2_000)
    });
    await res.arrayBuffer();
    return true;
  } catch {
    return false;
  }
}

async function killTree(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null || child.pid === undefined) return;
  const exit = new Promise<void>(resolve => child.once('exit', () => resolve()));
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
  const finished = await Promise.race([exit.then(() => true), sleep(5_000).then(() => false)]);
  if (!finished) {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
    await exit;
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('could not allocate a port'));
      server.close(() => resolve(address.port));
    });
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
