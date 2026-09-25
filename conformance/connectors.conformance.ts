import { restConnector, socketConnector } from '@uwdata/mosaic-core';
import { describe } from 'vitest';
import { arrowViolations } from './src/arrow.ts';
import { conformanceTest, createHarness, skipReason } from './src/harness.ts';
import { rejectionStatus } from './src/connector-cases.ts';
import type { Violation } from './src/types.ts';

const harness = createHarness();
const exec = skipReason(harness.config, ['exec']);

// Smoke coverage through the real client connectors. These observe fewer
// details than the wire cases, so their violation ids are coarser.
describe(`@uwdata/mosaic-core connectors: ${harness.config.name}`, () => {
  conformanceTest(harness, 'connector/rest-arrow', undefined, async () => {
    const bytes = await restConnector({ uri: harness.url() }).query({ type: 'arrow', sql: 'SELECT 1 AS x' });
    return arrow(bytes, [[1]]);
  });

  conformanceTest(harness, 'connector/rest-exec', exec, async () => {
    const rest = restConnector({ uri: harness.url() });
    await rest.query({ type: 'exec', sql: 'CREATE OR REPLACE TABLE conformance_connector AS SELECT 7 AS x' });
    return arrow(await rest.query({ type: 'arrow', sql: 'SELECT x FROM conformance_connector' }), [[7]]);
  });

  conformanceTest(harness, 'connector/rest-error', undefined, async () => {
    return rejection(restConnector({ uri: harness.url() }).query({ type: 'arrow', sql: 'SELEC 1' }), 400);
  });

  conformanceTest(harness, 'connector/socket-arrow', undefined, async () => {
    const socket = socketConnector({ uri: harness.wsUrl() });
    return arrow(await socket.query({ type: 'arrow', sql: 'SELECT 1 AS x' }), [[1]]);
  });

  conformanceTest(harness, 'connector/socket-pipeline', undefined, async () => {
    const socket = socketConnector({ uri: harness.wsUrl() });
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map(i => socket.query({ type: 'arrow', sql: `SELECT ${i} AS x` }))
    );
    return results.flatMap((bytes, i) => arrow(bytes, [[i + 1]]).map(x => ({ ...x, id: `q${i + 1}.${x.id}` })));
  });

  conformanceTest(harness, 'connector/socket-error-then-ok', undefined, async () => {
    const socket = socketConnector({ uri: harness.wsUrl() });
    const failed = socket.query({ type: 'arrow', sql: 'SELEC 1' });
    const ok = socket.query({ type: 'arrow', sql: 'SELECT 2 AS x' });
    const violations = await rejection(failed, undefined);
    try {
      violations.push(...arrow(await ok, [[2]]).map(x => ({ ...x, id: `ok.${x.id}` })));
    } catch (err) {
      violations.push({ id: 'ok.rejected', detail: `second query rejected: ${String(err)}` });
    }
    return violations;
  });
});

function arrow(bytes: ArrayBuffer, rows: unknown[][]): Violation[] {
  return arrowViolations(new Uint8Array(bytes), { rows });
}

async function rejection(promise: Promise<unknown>, status: number | undefined): Promise<Violation[]> {
  try {
    await promise;
    return [{ id: 'connector.resolved', detail: 'query resolved instead of rejecting' }];
  } catch (err) {
    if (status === undefined) return [];
    const observed = rejectionStatus(err);
    if (observed !== status) {
      const message = err instanceof Error ? err.message : String(err);
      return [{ id: 'connector.status', detail: `rejected with status ${observed ?? 'unknown'} (${JSON.stringify(message.slice(0, 120))}), expected ${status}` }];
    }
    return [];
  }
}
