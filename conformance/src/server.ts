import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { connect as connectTls } from 'node:tls';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { conformanceRoot } from './cases.ts';
import type { Target } from '../implementations/index.ts';

const defaultReadyTimeout = Number(process.env.CONFORMANCE_READY_TIMEOUT ?? 300_000);
const logDir = path.join(conformanceRoot, '.logs');
const maxLog = 512 * 1024;

export interface RunningServer {
  url: string;
  pid: number;
  stop: () => Promise<void>;
}

export interface StartOptions {
  label?: string;
  readyTimeout?: number;
}

export async function startServer(config: Target, { label = config.name, readyTimeout = defaultReadyTimeout }: StartOptions = {}): Promise<RunningServer> {
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
    const state = await answers(url);
    if (state === 'ready') {
      console.log(`[conformance] ${config.name} ready on ${url} after ${Date.now() - started} ms`);
      return { url, pid: child.pid!, stop };
    }
    if (state === 'tls') {
      await stop();
      throw new Error(
        `${config.name} answered ${url} with TLS: it found a localhost certificate pair (see packages/server/README.md) ` +
        'and the suite only speaks plain HTTP. Remove or move the pair, or run the server yourself and set CONFORMANCE_URL.'
      );
    }
    await sleep(250);
  }
  await stop();
  throw new Error(`${config.name} did not answer on ${url} within ${readyTimeout} ms\n${log}`);
}

// Every reference server serves HTTPS instead of HTTP when it finds a local
// certificate pair. A plain-HTTP probe cannot tell that apart on its own:
// Node and Rust drop the connection, but Go's net/http answers a plaintext
// request on a TLS port with a well-formed 400. So once the port is
// answering at all, a TLS handshake decides; a server that completes one is
// speaking TLS whatever it said to the probe.
async function answers(url: string): Promise<'ready' | 'tls' | 'waiting'> {
  const { hostname, port } = new URL(url);
  let responded = false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'arrow', sql: 'SELECT 1' }),
      signal: AbortSignal.timeout(2_000)
    });
    await res.arrayBuffer();
    responded = true;
  } catch (err) {
    const cause = (err as { cause?: { code?: string } }).cause;
    if (cause?.code !== 'UND_ERR_SOCKET' && cause?.code !== 'ECONNRESET') return 'waiting';
  }
  if (await speaksTls(hostname, Number(port))) return 'tls';
  return responded ? 'ready' : 'waiting';
}

function speaksTls(host: string, port: number): Promise<boolean> {
  return new Promise(resolve => {
    const socket = connectTls({ host, port, rejectUnauthorized: false, servername: 'localhost' }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.setTimeout(1_000, () => { socket.destroy(); resolve(false); });
    socket.on('error', () => resolve(false));
  });
}

// Terminates the child and everything in its process group (the child is
// spawned detached as its own group leader, so `uv run` or `go run` wrappers
// go with their children), escalating to SIGKILL and waiting for the exit
// event. Throws if the process is still alive afterwards rather than
// pretending it stopped.
export async function killTree(child: ChildProcess, grace = 5_000) {
  if (child.exitCode !== null || child.signalCode !== null || child.pid === undefined) return;
  const pid = child.pid;
  const exit = new Promise<void>(resolve => child.once('exit', () => resolve()));
  const signal = (sig: NodeJS.Signals) => {
    try {
      process.kill(-pid, sig);
    } catch {
      try { child.kill(sig); } catch { /* already gone */ }
    }
  };
  signal('SIGTERM');
  if (await Promise.race([exit.then(() => true), sleep(grace).then(() => false)])) return;
  signal('SIGKILL');
  if (await Promise.race([exit.then(() => true), sleep(grace).then(() => false)])) return;
  throw new Error(`process ${pid} did not exit after SIGKILL`);
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
