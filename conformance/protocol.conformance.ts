import { afterAll, describe } from 'vitest';
import { captureValues, checkResponse, surplusViolations } from './src/check.ts';
import { expandRequest, unresolvedVars } from './src/cases.ts';
import { conformanceTest, createHarness, skipReason, type Harness } from './src/harness.ts';
import { sendHttp } from './src/http.ts';
import { clientSession, issue, SessionManager, type Session } from './src/session.ts';
import { layerOf, type CommandTransport, type ConformanceCase, type Response, type Step, type Violation } from './src/types.ts';
import { WsClient } from './src/ws.ts';

const harness = createHarness();

// One session per command transport for the whole run; see SessionManager
// for when it is replaced.
const sessions = new Map<CommandTransport, SessionManager>();

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
});

describe(`protocol conformance: ${harness.config.name}`, () => {
  for (const conformanceCase of harness.cases) {
    conformanceTest(
      harness,
      conformanceCase.id,
      skipReason(harness.config, conformanceCase),
      () => (layerOf(conformanceCase.transport) === 'wire' ? runWireCase(harness, conformanceCase) : runCommandCase(conformanceCase))
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
    const pending = c.steps.map(step => issue(session, request(step)));
    for (const [index, step] of c.steps.entries()) {
      const response = await pending[index];
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

function prefix(c: ConformanceCase, index: number, list: Violation[]): Violation[] {
  return c.steps.length > 1 ? list.map(x => ({ id: `s${index + 1}.${x.id}`, detail: `step ${index + 1}: ${x.detail}` })) : list;
}

function blocked(missing: string[]): Violation[] {
  return missing.map(name => ({ id: `blocked.${name}`, detail: `skipped: {{${name}}} was never captured` }));
}

function assess(c: ConformanceCase, step: Step, response: Response, vars: Record<string, string>): Violation[] {
  const transport = layerOf(c.transport) === 'wire' ? step.transport ?? c.transport : c.transport;
  const sql = step.request ? expandRequest(step.request, vars, transport).sql : undefined;
  const violations = checkResponse(step.expect, response, transport, vars, typeof sql === 'string' ? sql : undefined);
  const answered = response.kind === 'http' || response.kind === 'connector' || (response.kind === 'ws' && response.frame !== 'close' && response.frame !== 'timeout');
  if (answered) {
    violations.push(...captureValues(step.capture, response, vars));
  } else {
    for (const name of Object.keys(step.capture ?? {})) {
      violations.push({ id: `capture.${name}`, detail: `cannot capture ${name}: no response` });
    }
  }
  return violations;
}
