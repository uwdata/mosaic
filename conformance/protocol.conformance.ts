import { afterAll, describe } from 'vitest';
import { captureValues, checkResponse, surplusViolations } from './src/check.ts';
import { expandRequest, unresolvedVars } from './src/cases.ts';
import { CommClient, newUuid } from './src/comm.ts';
import { conformanceTest, createHarness, skipReason, type Harness } from './src/harness.ts';
import { sendHttp } from './src/http.ts';
import { clientSession, issue, SessionManager, type Session } from './src/session.ts';
import { layerOf, type CommandTransport, type ConformanceCase, type Response, type Step, type Violation } from './src/types.ts';
import { WsClient } from './src/ws.ts';

const harness = createHarness();

// One session per command transport for the whole run; see SessionManager
// for when it is replaced. The comm shim is managed the same way.
const sessions = new Map<CommandTransport, SessionManager>();
const comm = harness.config.kind === 'comm'
  ? new SessionManager<CommClient>(async () => new CommClient(harness.config.comm!))
  : undefined;

function manager(transport: CommandTransport): SessionManager {
  let found = sessions.get(transport);
  if (!found) {
    const config = harness.config;
    const factory = config.kind === 'server'
      ? async () => clientSession(transport, harness.url()!)
      : () => config.session!(harness.url());
    found = new SessionManager(factory);
    sessions.set(transport, found);
  }
  return found;
}

afterAll(async () => {
  for (const m of sessions.values()) await m.dispose();
  await comm?.dispose();
});

describe(`protocol conformance: ${harness.config.name}`, () => {
  for (const conformanceCase of harness.cases) {
    conformanceTest(
      harness,
      conformanceCase.id,
      skipReason(harness.config, conformanceCase),
      () => (conformanceCase.transport === 'comm' ? runCommCase(conformanceCase)
        : layerOf(conformanceCase.transport) === 'wire' ? runWireCase(harness, conformanceCase)
          : runCommandCase(conformanceCase))
    );
  }
});

// Every step runs even after an earlier one misbehaved, so follow-up checks
// such as "the connection is still usable" are observed independently. A
// step is skipped only when it references a capture that never happened.
async function runWireCase(harness: Harness, c: ConformanceCase): Promise<Violation[]> {
  const vars: Record<string, string> = {};
  const violations: Violation[] = [];
  const client = c.transport === 'ws' || c.steps.some(s => s.transport === 'ws')
    ? await WsClient.open(harness.wsUrl()!)
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
        response = await sendHttp(harness.url()!, transport, step, vars);
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
// timeout the remaining steps are blocked and the session is replaced.
async function runCommandCase(c: ConformanceCase): Promise<Violation[]> {
  const transport = c.transport as CommandTransport;
  const vars: Record<string, string> = {};
  const violations: Violation[] = [];
  const m = manager(transport);
  const session: Session = await m.acquire();
  const request = (step: Step) => expandRequest(step.request ?? {}, vars, transport);

  if (c.pipeline) {
    const pending = settleAll(c.steps.map(step => issue(session, request(step))));
    for (const [index, step] of c.steps.entries()) {
      const response = unwrap(await pending[index]);
      if (response.kind === 'connector-timeout') m.taint();
      violations.push(...prefix(c, index, assess(c, step, response, vars)));
    }
    return violations;
  }

  let timedOut = false;
  for (const [index, step] of c.steps.entries()) {
    if (timedOut) {
      violations.push(...prefix(c, index, [{ id: 'blocked.timeout', detail: 'skipped: an earlier step timed out and left the session state unknown' }]));
      continue;
    }
    const missing = unresolvedVars(step, vars);
    if (missing.length) {
      violations.push(...prefix(c, index, blocked(missing)));
      continue;
    }
    const response = await issue(session, request(step));
    if (response.kind === 'connector-timeout') {
      timedOut = true;
      m.taint();
    }
    violations.push(...prefix(c, index, assess(c, step, response, vars)));
  }
  return violations;
}

// The comm wire: each step is one message to the widget handler. A fresh
// uuid is injected unless the step (or case) says `correlation: manual`, in
// which case the request goes exactly as written; the checker then expects
// an uncorrelated reply when no valid uuid was sent. Pipelined steps are all
// sent before any is awaited and associated by the shim's invocation id, so
// reply order is free. A timeout taints the shim like any other session.
async function runCommCase(c: ConformanceCase): Promise<Violation[]> {
  const vars: Record<string, string> = {};
  const violations: Violation[] = [];
  const client = await comm!.acquire();
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
    const pending = settleAll(c.steps.map(step => { const m = message(step); return client.send(m.request, m.uuid); }));
    for (const [index, step] of c.steps.entries()) {
      const response = unwrap(await pending[index]);
      if (response.kind === 'comm-timeout') comm!.taint();
      violations.push(...prefix(c, index, assess(c, step, response, vars)));
    }
    return violations;
  }

  let timedOut = false;
  for (const [index, step] of c.steps.entries()) {
    if (timedOut) {
      violations.push(...prefix(c, index, [{ id: 'blocked.timeout', detail: 'skipped: an earlier step timed out and left the widget state unknown' }]));
      continue;
    }
    const missing = unresolvedVars(step, vars);
    if (missing.length) {
      violations.push(...prefix(c, index, blocked(missing)));
      continue;
    }
    const m = message(step);
    const response = await client.send(m.request, m.uuid);
    if (response.kind === 'comm-timeout') {
      timedOut = true;
      comm!.taint();
    }
    violations.push(...prefix(c, index, assess(c, step, response, vars)));
  }
  return violations;
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
