import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import type { CommReply, CommResponse, CommTimeout } from './types.ts';

const stepTimeout = Number(process.env.CONFORMANCE_STEP_TIMEOUT ?? 15_000);
const settleTimeout = Number(process.env.CONFORMANCE_SETTLE_TIMEOUT ?? 250);

export interface CommSpawn {
  cmd: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
}

type ShimRecord =
  | { id: number; kind: 'reply'; content: unknown; buffers: string[] }
  | { id: number; kind: 'done'; raised: string | null };

interface Pending {
  uuid: string | undefined;
  replies: CommReply[];
  resolve: (response: CommResponse | CommTimeout) => void;
  reject: (error: Error) => void;
  deadline: NodeJS.Timeout;
}

// Talks the shim's line protocol (packages/vgplot/widget/conformance/shim.py).
// Only what the widget handler did is an observation: its replies and
// whether it raised. The shim exiting before `done`, writing a line that is
// not JSON, or answering for an id that was never issued are harness
// failures and reject every outstanding send.
export class CommClient {
  private child: ChildProcess;
  private next = 1;
  private pending = new Map<number, Pending>();
  private fatal?: Error;

  constructor(spec: CommSpawn) {
    this.child = spawn(spec.cmd, spec.args, {
      cwd: spec.cwd,
      env: { ...process.env, ...spec.env },
      stdio: ['pipe', 'pipe', 'inherit']
    });
    this.child.once('error', err => this.fail(err));
    this.child.once('exit', (code, signal) => {
      if (this.pending.size) this.fail(new Error(`comm shim exited (${signal ?? `code ${code}`}) with ${this.pending.size} invocation(s) outstanding`));
    });
    createInterface({ input: this.child.stdout! }).on('line', line => this.onLine(line));
  }

  private onLine(line: string) {
    if (!line.trim()) return;
    let record: ShimRecord;
    try {
      record = JSON.parse(line);
    } catch {
      return this.fail(new Error(`comm shim wrote a line that is not JSON: ${line.slice(0, 120)}`));
    }
    const pending = this.pending.get(record.id);
    if (!pending) return this.fail(new Error(`comm shim answered for unknown invocation ${record.id}`));
    if (record.kind === 'reply') {
      pending.replies.push({ content: record.content, buffers: record.buffers.map(b => new Uint8Array(Buffer.from(b, 'base64'))) });
      return;
    }
    // After `done`, replies are still collected for a short settle window
    // so a late one is seen as surplus. That is a bounded check, not
    // support for asynchronous handlers, which the shim does not model.
    clearTimeout(pending.deadline);
    const raised = record.raised;
    setTimeout(() => {
      this.pending.delete(record.id);
      pending.resolve({ kind: 'comm', uuid: pending.uuid, replies: pending.replies, ...(raised ? { raised } : {}) });
    }, settleTimeout).unref();
  }

  private fail(error: Error) {
    this.fatal ??= error;
    for (const [id, p] of this.pending) {
      clearTimeout(p.deadline);
      this.pending.delete(id);
      p.reject(error);
    }
    this.child.kill();
  }

  send(content: Record<string, unknown>, uuid: string | undefined, timeout = stepTimeout): Promise<CommResponse | CommTimeout> {
    if (this.fatal) return Promise.reject(this.fatal);
    const id = this.next++;
    return new Promise((resolve, reject) => {
      const deadline = setTimeout(() => {
        this.pending.delete(id);
        resolve({ kind: 'comm-timeout', after: timeout });
      }, timeout);
      deadline.unref();
      this.pending.set(id, { uuid, replies: [], resolve, reject, deadline });
      this.child.stdin!.write(`${JSON.stringify({ id, content })}\n`);
    });
  }

  async dispose() {
    this.child.stdin?.end();
    if (this.child.exitCode !== null || this.child.signalCode !== null) return;
    const exited = new Promise<void>(resolve => this.child.once('exit', () => resolve()));
    this.child.kill();
    await Promise.race([exited, new Promise<void>(r => setTimeout(r, 2000).unref())]);
  }
}

export function newUuid() {
  return randomUUID();
}
