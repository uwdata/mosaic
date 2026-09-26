import { expandRequest, unresolvedVars } from './cases.ts';
import { captureValues, checkResponse, surplusViolations } from './check.ts';
import { CommClient, newUuid } from './comm.ts';
import type { Harness } from './harness.ts';
import { sendHttp } from './http.ts';
import { clientSession, issue, SessionManager } from './session.ts';
import { layerOf, type CommandTransport, type ConformanceCase, type Response, type Step, type Violation } from './types.ts';
import { WsClient } from './ws.ts';

export interface RunnerOptions {
  stepTimeout?: number;
}

// Runs cases against one target. Sessions for the command layer and the comm
// shim are owned here, one per transport for the whole run, and replaced
// after a timeout only when disposing them isolates the implementation. When
// it does not (a client connector against a server whose SQL may still be
// running), the whole target is in an unknown state: `fatal` is set and every
// later case, on any transport, fails before sending anything.
export class Runner {
  private sessions = new Map<CommandTransport, SessionManager>();
  private comm?: SessionManager<CommClient>;
  fatal?: Error;

  constructor(private readonly harness: Harness, private readonly options: RunnerOptions = {}) {
    if (harness.config.kind === 'comm') {
      this.comm = new SessionManager<CommClient>(async () => new CommClient(harness.config.comm!));
    }
  }

  async run(c: ConformanceCase): Promise<Violation[]> {
    if (this.fatal) throw this.fatal;
    if (c.transport === 'comm') return this.runCommCase(c);
    if (layerOf(c.transport) === 'wire') return this.runWireCase(c);
    return this.runCommandCase(c);
  }

  async dispose() {
    for (const m of this.sessions.values()) await m.dispose().catch(() => {});
    await this.comm?.dispose().catch(() => {});
  }

  private manager(transport: CommandTransport): SessionManager {
    let found = this.sessions.get(transport);
    if (!found) {
      const config = this.harness.config;
      const factory = config.kind === 'server'
        ? async () => clientSession(transport, this.harness.url()!)
        : () => config.session!(this.harness.url());
      found = new SessionManager(factory);
      this.sessions.set(transport, found);
    }
    return found;
  }

  private abort(c: ConformanceCase, index: number) {
    this.fatal ??= new Error(
      `${c.id} step ${index + 1} timed out and disposing the ${c.transport} session cannot stop the ${this.harness.config.name} target's work; ` +
      'its state is unknown, so the remaining cases are not run'
    );
  }

  // Every step runs even after an earlier one misbehaved, so follow-up
  // checks such as "the connection is still usable" are observed
  // independently. A step is skipped only when it references a capture that
  // never happened.
  private async runWireCase(c: ConformanceCase): Promise<Violation[]> {
    const vars: Record<string, string> = {};
    const violations: Violation[] = [];
    const client = c.transport === 'ws' || c.steps.some(s => s.transport === 'ws')
      ? await WsClient.open(this.harness.wsUrl()!)
      : undefined;
    try {
      if (c.pipeline) {
        for (const step of c.steps) client!.send(step, vars);
        for (const [index, step] of c.steps.entries()) {
          violations.push(...prefix(c, index, assess(c, step, await client!.next(), vars)));
        }
        violations.push(...surplusViolations(await client!.surplus()));
        return violations;
      }
      for (const [index, step] of c.steps.entries()) {
        const missing = unresolvedVars(step, vars);
        if (missing.length) {
          violations.push(...prefix(c, index, blocked(missing)));
          continue;
        }
        const transport = step.transport ?? c.transport;
        let response: Response;
        if (transport === 'ws') {
          client!.send(step, vars);
          response = await client!.next();
        } else {
          response = await sendHttp(this.harness.url()!, transport, step, vars);
        }
        violations.push(...prefix(c, index, assess(c, step, response, vars)));
      }
      if (client) violations.push(...surplusViolations(await client.surplus()));
      return violations;
    } finally {
      client?.close();
    }
  }

  // The command layer sends every step through the target's connector; a
  // step's own `transport` names a wire form that does not exist here, so it
  // runs on the same session. Pipelined steps are all issued before any is
  // awaited, each with its own deadline, which checks that concurrent calls
  // each get their own result but says nothing about arrival order. After a
  // timeout the remaining steps are blocked; the session is replaced if that
  // isolates the implementation and the target is marked fatal if not.
  private async runCommandCase(c: ConformanceCase): Promise<Violation[]> {
    const transport = c.transport as CommandTransport;
    const vars: Record<string, string> = {};
    const violations: Violation[] = [];
    const m = this.manager(transport);
    const session = await m.acquire();
    const request = (step: Step) => expandRequest(step.request ?? {}, vars, transport);
    const timedOut = (index: number) => {
      m.taint();
      if (!session.isolated) this.abort(c, index);
    };

    if (c.pipeline) {
      const pending = settleAll(c.steps.map(step => issue(session, request(step), this.options.stepTimeout)));
      let stopped = false;
      for (const [index, step] of c.steps.entries()) {
        if (stopped) {
          violations.push(...prefix(c, index, blockedByTimeout()));
          continue;
        }
        const response = unwrap(await pending[index]);
        if (response.kind === 'connector-timeout') {
          timedOut(index);
          stopped = !session.isolated;
        }
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
      const response = await issue(session, request(step), this.options.stepTimeout);
      if (response.kind === 'connector-timeout') {
        timedOut(index);
        stopped = true;
      }
      violations.push(...prefix(c, index, assess(c, step, response, vars)));
    }
    return violations;
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
