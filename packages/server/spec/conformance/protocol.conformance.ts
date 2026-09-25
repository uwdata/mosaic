import { describe } from 'vitest';
import { expandRequest, loadCases, unresolvedVars } from './src/cases.ts';
import { captureValues, checkResponse, surplusViolations } from './src/check.ts';
import { conformanceTest, createHarness, skipReason, type Harness } from './src/harness.ts';
import { sendHttp } from './src/http.ts';
import type { ConformanceCase, Response, Step, Violation } from './src/types.ts';
import { WsClient } from './src/ws.ts';

const cases = loadCases();
const harness = createHarness();

describe(`protocol conformance: ${harness.config.name}`, () => {
  for (const conformanceCase of cases) {
    const { definition } = conformanceCase;
    conformanceTest(
      harness,
      conformanceCase.id,
      skipReason(harness.config, definition.requires, definition.unless),
      () => runCase(harness, conformanceCase)
    );
  }
});

// Every step runs even after an earlier one misbehaved, so follow-up checks
// such as "the connection is still usable" are observed independently. A
// step is skipped only when it references a capture that never happened.
async function runCase(harness: Harness, c: ConformanceCase): Promise<Violation[]> {
  const vars: Record<string, string> = {};
  const violations: Violation[] = [];
  const prefix = (index: number, list: Violation[]) =>
    c.steps.length > 1 ? list.map(x => ({ id: `s${index + 1}.${x.id}`, detail: `step ${index + 1}: ${x.detail}` })) : list;
  const client = c.transport === 'ws' || c.steps.some(s => s.transport === 'ws')
    ? await WsClient.open(harness.wsUrl())
    : undefined;
  try {
    if (c.pipeline) {
      for (const step of c.steps) client!.send(step, vars);
      for (const [index, step] of c.steps.entries()) {
        violations.push(...prefix(index, assess(c, step, await client!.next(), vars)));
      }
      violations.push(...surplusViolations(await client!.surplus()));
      return violations;
    }
    for (const [index, step] of c.steps.entries()) {
      const missing = unresolvedVars(step, vars);
      if (missing.length) {
        violations.push(...prefix(index, missing.map(name => ({ id: `blocked.${name}`, detail: `skipped: {{${name}}} was never captured` }))));
        continue;
      }
      const transport = step.transport ?? c.transport;
      let response: Response;
      if (transport === 'ws') {
        client!.send(step, vars);
        response = await client!.next();
      } else {
        response = await sendHttp(harness.url(), transport, step, vars);
      }
      violations.push(...prefix(index, assess(c, step, response, vars)));
    }
    if (client) violations.push(...surplusViolations(await client.surplus()));
    return violations;
  } finally {
    client?.close();
  }
}

function assess(c: ConformanceCase, step: Step, response: Response, vars: Record<string, string>): Violation[] {
  const transport = step.transport ?? c.transport;
  const sql = step.request ? expandRequest(step.request, vars, transport).sql : undefined;
  const violations = checkResponse(step.expect, response, transport, vars, typeof sql === 'string' ? sql : undefined);
  const answered = response.kind === 'http' || (response.kind === 'ws' && response.frame !== 'close' && response.frame !== 'timeout');
  if (answered) {
    violations.push(...captureValues(step.capture, response, vars));
  } else {
    for (const name of Object.keys(step.capture ?? {})) {
      violations.push({ id: `capture.${name}`, detail: `cannot capture ${name}: no response` });
    }
  }
  return violations;
}
