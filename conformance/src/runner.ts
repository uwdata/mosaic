import { expandRequest, unresolvedVars } from './cases.ts';
import { captureValues, checkResponse, surplusViolations } from './check.ts';
import { CommClient, newUuid } from './comm.ts';
import type { Harness } from './harness.ts';
import { RequestTimeout, sendHttp } from './http.ts';
import { startServer, type RunningServer } from './server.ts';
import { clientSession, issue, SessionManager } from './session.ts';
import { layerOf, type CommandTransport, type ConformanceCase, type Response, type Step, type Violation } from './types.ts';
import { WsClient } from './ws.ts';

export interface RunnerOptions {
  stepTimeout?: number;
  // A server someone else started (CONFORMANCE_URL). It cannot be restarted.
  url?: string;
}

// Runs cases against one target and owns everything that talks to it: the
// spawned server, one session per command transport, the comm shim. A
// timed-out step means the target may still be executing that command, so
// before the next case the runner restores a known state: an in-process
// engine or the shim is disposed and rebuilt, and a spawned server is
// stopped and started again, which also drops the client sessions bound to
// it. Only a server the runner did not start cannot be restored; then
// `fatal` is set and every later case, on any transport, fails before
// sending anything.
export class Runner {
  private sessions = new Map<CommandTransport, SessionManager>();
  private comm?: SessionManager<CommClient>;
  private running?: RunningServer;
  private external?: string;
  restarts = 0;
  fatal?: Error;

  constructor(private readonly harness: Harness, private readonly options: RunnerOptions = {}) {
    this.external = options.url ?? process.env.CONFORMANCE_URL;
    if (this.external && !this.external.endsWith('/')) this.external += '/';
    if (harness.config.kind === 'comm') {
      this.comm = new SessionManager<CommClient>(async () => new CommClient(harness.config.comm!));
    }
  }

  async start() {
    if (this.harness.config.kind !== 'server' || this.external || this.running) return;
    this.running = await startServer(this.harness.config);
  }

  url(): string {
    if (this.external) return this.external;
    if (!this.running) throw new Error('the server has not been started; call start() first');
    return this.running.url;
  }

  wsUrl() {
    return this.url().replace(/^http/, 'ws');
  }

  async run(c: ConformanceCase): Promise<Violation[]> {
    if (this.fatal) throw this.fatal;
    if (c.transport === 'comm') return this.runCommCase(c);
    if (layerOf(c.transport) === 'wire') return this.runWireCase(c);
    return this.runCommandCase(c);
  }

  async dispose() {
    for (const m of this.sessions.values()) await m.dispose().catch(() => {});
    this.sessions.clear();
    await this.comm?.dispose().catch(() => {});
    await this.running?.stop();
    this.running = undefined;
  }

  private manager(transport: CommandTransport): SessionManager {
    let found = this.sessions.get(transport);
    if (!found) {
      const config = this.harness.config;
      const factory = config.kind === 'server'
        ? async () => clientSession(transport, this.url())
        : () => config.session!(undefined);
      found = new SessionManager(factory);
      this.sessions.set(transport, found);
    }
    return found;
  }

  // Called after a step timed out against a server target. Restarting the
  // server is the only way to be sure the command is no longer running;
  // the sessions bound to the old process go with it.
  private async restore(c: ConformanceCase, index: number) {
    const where = `${c.id} step ${index + 1} timed out and the ${this.harness.config.name} target may still be executing it`;
    if (this.external) {
      this.fatal ??= new Error(`${where}; it was not started by the suite, so its state cannot be restored and the remaining cases are not run`);
      return;
    }
    try {
      for (const m of this.sessions.values()) await m.dispose().catch(() => {});
      this.sessions.clear();
      await this.running?.stop();
      this.running = undefined;
      this.restarts++;
      console.log(`[conformance] ${where}; restarting the server (restart ${this.restarts})`);
      this.running = await startServer(this.harness.config, `${this.harness.config.name}.restart-${this.restarts}`);
    } catch (err) {
      this.fatal ??= new Error(`${where}; restarting it failed, so the remaining cases are not run (${(err as Error).message})`, { cause: err });
    }
  }

  // Every step runs even after an earlier one misbehaved, so follow-up
  // checks such as "the connection is still usable" are observed
  // independently, except after a timeout, which leaves the target's state
  // unknown: the remaining steps are blocked and the server is restored
  // before the next case. A step is also skipped when it references a
  // capture that never happened.
  private async runWireCase(c: ConformanceCase): Promise<Violation[]> {
    const vars: Record<string, string> = {};
    const violations: Violation[] = [];
    const client = c.transport === 'ws' || c.steps.some(s => s.transport === 'ws')
      ? await WsClient.open(this.wsUrl())
      : undefined;
    let timedOut: number | undefined;
    try {
      if (c.pipeline) {
        for (const step of c.steps) client!.send(step, vars);
        for (const [index, step] of c.steps.entries()) {
          if (timedOut !== undefined) {
            violations.push(...prefix(c, index, blockedByTimeout()));
            continue;
          }
          const response = await client!.next(this.options.stepTimeout);
          if (response.frame === 'timeout') timedOut = index;
          violations.push(...prefix(c, index, assess(c, step, response, vars)));
        }
        if (timedOut === undefined) violations.push(...surplusViolations(await client!.surplus()));
        return violations;
      }
      for (const [index, step] of c.steps.entries()) {
        if (timedOut !== undefined) {
          violations.push(...prefix(c, index, blockedByTimeout()));
          continue;
        }
        const missing = unresolvedVars(step, vars);
        if (missing.length) {
          violations.push(...prefix(c, index, blocked(missing)));
          continue;
        }
        const transport = step.transport ?? c.transport;
        let response: Response;
        if (transport === 'ws') {
          client!.send(step, vars);
          response = await client!.next(this.options.stepTimeout);
          if (response.frame === 'timeout') timedOut = index;
        } else {
          try {
            response = await sendHttp(this.url(), transport, step, vars, this.options.stepTimeout);
          } catch (err) {
            if (err instanceof RequestTimeout) await this.restore(c, index);
            throw err;
          }
        }
        violations.push(...prefix(c, index, assess(c, step, response, vars)));
      }
      if (client && timedOut === undefined) violations.push(...surplusViolations(await client.surplus()));
      return violations;
    } finally {
      client?.close();
      if (timedOut !== undefined) await this.restore(c, timedOut);
    }
  }

  // The command layer sends every step through the target's connector; a
  // step's own `transport` names a wire form that does not exist here, so it
  // runs on the same session. Pipelined steps are all issued before any is
  // awaited, each with its own deadline, which checks that concurrent calls
  // each get their own result but says nothing about arrival order. After a
  // timeout the remaining steps are blocked and the target is restored.
  private async runCommandCase(c: ConformanceCase): Promise<Violation[]> {
    const transport = c.transport as CommandTransport;
    const vars: Record<string, string> = {};
    const violations: Violation[] = [];
    const m = this.manager(transport);
    const session = await m.acquire();
    const request = (step: Step) => expandRequest(step.request ?? {}, vars, transport);
    let timedOut: number | undefined;

    try {
      if (c.pipeline) {
        const pending = settleAll(c.steps.map(step => issue(session, request(step), this.options.stepTimeout)));
        for (const [index, step] of c.steps.entries()) {
          if (timedOut !== undefined) {
            violations.push(...prefix(c, index, blockedByTimeout()));
            continue;
          }
          const response = unwrap(await pending[index]);
          if (response.kind === 'connector-timeout') timedOut = index;
          violations.push(...prefix(c, index, assess(c, step, response, vars)));
        }
        return violations;
      }
      for (const [index, step] of c.steps.entries()) {
        if (timedOut !== undefined) {
          violations.push(...prefix(c, index, blockedByTimeout()));
          continue;
        }
        const missing = unresolvedVars(step, vars);
        if (missing.length) {
          violations.push(...prefix(c, index, blocked(missing)));
          continue;
        }
        const response = await issue(session, request(step), this.options.stepTimeout);
        if (response.kind === 'connector-timeout') timedOut = index;
        violations.push(...prefix(c, index, assess(c, step, response, vars)));
      }
      return violations;
    } finally {
      if (timedOut !== undefined) {
        if (session.isolated) m.taint();
        else await this.restore(c, timedOut);
      }
    }
  }

  // The comm wire: each step is one message to the widget handler. A fresh
  // uuid is injected unless the step (or case) says `correlation: manual`,
  // in which case the request goes exactly as written; the checker then
  // expects an uncorrelated reply when no valid uuid was sent. Pipelined
  // steps are all sent before any is awaited and associated by the shim's
  // invocation id, so reply order is free. Killing the shim isolates it, so a
  // timeout only taints the session.
  private async runCommCase(c: ConformanceCase): Promise<Violation[]> {
    const vars: Record<string, string> = {};
    const violations: Violation[] = [];
    const comm = this.comm!;
    const client = await comm.acquire();
    const message = (step: Step) => {
      const request = expandRequest(step.request ?? {}, vars, 'comm');
      const manual = (step.correlation ?? c.definition.correlation) === 'manual';
      if (manual) {
        const given = request.uuid;
        return { request, uuid: typeof given === 'string' && given !== '' ? given : undefined };
      }
      const uuid = newUuid();
      return { request: { ...request, uuid }, uuid };
    };

    if (c.pipeline) {
      const pending = settleAll(c.steps.map(step => { const m = message(step); return client.send(m.request, m.uuid, this.options.stepTimeout); }));
      for (const [index, step] of c.steps.entries()) {
        const response = unwrap(await pending[index]);
        if (response.kind === 'comm-timeout') comm.taint();
        violations.push(...prefix(c, index, assess(c, step, response, vars)));
      }
      return violations;
    }

    let stopped = false;
    for (const [index, step] of c.steps.entries()) {
      if (stopped) {
        violations.push(...prefix(c, index, blockedByTimeout()));
        continue;
      }
      const missing = unresolvedVars(step, vars);
      if (missing.length) {
        violations.push(...prefix(c, index, blocked(missing)));
        continue;
      }
      const m = message(step);
      const response = await client.send(m.request, m.uuid, this.options.stepTimeout);
      if (response.kind === 'comm-timeout') {
        stopped = true;
        comm.taint();
      }
      violations.push(...prefix(c, index, assess(c, step, response, vars)));
    }
    return violations;
  }
}

// Every pipelined promise gets a handler the moment it is issued and none of
// the settled results ever rejects, so a harness failure that rejects them
// all surfaces once, from the first one awaited, instead of as unhandled
// rejections for the rest.
type Settled<T> = { value: T } | { error: unknown };

function settleAll<T>(promises: Promise<T>[]): Promise<Settled<T>>[] {
  return promises.map(p => p.then(value => ({ value }), (error: unknown) => ({ error })));
}

function unwrap<T>(outcome: Settled<T>): T {
  if ('error' in outcome) throw outcome.error;
  return outcome.value;
}

function prefix(c: ConformanceCase, index: number, list: Violation[]): Violation[] {
  return c.steps.length > 1 ? list.map(x => ({ id: `s${index + 1}.${x.id}`, detail: `step ${index + 1}: ${x.detail}` })) : list;
}

function blocked(missing: string[]): Violation[] {
  return missing.map(name => ({ id: `blocked.${name}`, detail: `skipped: {{${name}}} was never captured` }));
}

function blockedByTimeout(): Violation[] {
  return [{ id: 'blocked.timeout', detail: 'skipped: an earlier step timed out and left the state unknown' }];
}

function assess(c: ConformanceCase, step: Step, response: Response, vars: Record<string, string>): Violation[] {
  const transport = c.transport === 'comm' || layerOf(c.transport) === 'command' ? c.transport : step.transport ?? c.transport;
  const sql = step.request ? expandRequest(step.request, vars, transport).sql : undefined;
  const violations = checkResponse(step.expect, response, transport, vars, typeof sql === 'string' ? sql : undefined);
  const answered = response.kind === 'http' || response.kind === 'connector' || (response.kind === 'comm' && response.replies.length > 0) || (response.kind === 'ws' && response.frame !== 'close' && response.frame !== 'timeout');
  if (answered) {
    violations.push(...captureValues(step.capture, response, vars));
  } else {
    for (const name of Object.keys(step.capture ?? {})) {
      violations.push({ id: `capture.${name}`, detail: `cannot capture ${name}: no response` });
    }
  }
  return violations;
}
