import { describe } from 'vitest';
import { loadCases } from './src/cases.ts';
import { captureValues, checkResponse } from './src/check.ts';
import { conformanceTest, createHarness, skipReason, type Harness } from './src/harness.ts';
import { sendHttp } from './src/http.ts';
import type { ConformanceCase, Response, Step } from './src/types.ts';
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

async function runCase(harness: Harness, c: ConformanceCase) {
  const vars: Record<string, string> = {};
  const client = c.transport === 'ws' || c.steps.some(s => s.transport === 'ws')
    ? await WsClient.open(harness.wsUrl())
    : undefined;
  try {
    if (c.pipeline) {
      for (const step of c.steps) client!.send(step, vars);
      for (const [index, step] of c.steps.entries()) {
        assertStep(c, index, step, await client!.next(), vars);
      }
      return;
    }
    for (const [index, step] of c.steps.entries()) {
      const transport = step.transport ?? c.transport;
      let response: Response;
      if (transport === 'ws') {
        client!.send(step, vars);
        response = await client!.next();
      } else {
        response = await sendHttp(harness.url(), transport, step, vars);
      }
      assertStep(c, index, step, response, vars);
    }
  } finally {
    client?.close();
  }
}

function assertStep(c: ConformanceCase, index: number, step: Step, response: Response, vars: Record<string, string>) {
  const transport = step.transport ?? c.transport;
  const problems = checkResponse(step.expect, response, transport, vars);
  if (problems.length) {
    const prefix = c.steps.length > 1 ? `step ${index + 1}/${c.steps.length} (${describeStep(step)}): ` : '';
    throw new Error(prefix + problems.join('; '));
  }
  captureValues(step.capture, response, vars);
}

function describeStep(step: Step) {
  if (step.raw) return `${step.raw.method ?? 'raw'} ${JSON.stringify(step.raw.body ?? step.raw.query ?? '').slice(0, 60)}`;
  return JSON.stringify(step.request).slice(0, 80);
}
