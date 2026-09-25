import { restConnector, socketConnector } from '@uwdata/mosaic-core';
import { describe, expect } from 'vitest';
import { arrowProblems, decodeArrow } from './src/arrow.ts';
import { conformanceTest, createHarness, skipReason } from './src/harness.ts';

const harness = createHarness();
const exec = skipReason(harness.config, ['exec']);

describe(`@uwdata/mosaic-core connectors: ${harness.config.name}`, () => {
  conformanceTest(harness, 'connector/rest-arrow', undefined, async () => {
    const bytes = await restConnector({ uri: harness.url() }).query({ type: 'arrow', sql: 'SELECT 1 AS x' });
    expectArrow(bytes, [[1]]);
  });

  conformanceTest(harness, 'connector/rest-exec', exec, async () => {
    const rest = restConnector({ uri: harness.url() });
    await rest.query({ type: 'exec', sql: 'CREATE OR REPLACE TABLE conformance_connector AS SELECT 7 AS x' });
    expectArrow(await rest.query({ type: 'arrow', sql: 'SELECT x FROM conformance_connector' }), [[7]]);
  });

  conformanceTest(harness, 'connector/rest-error', undefined, async () => {
    await expect(restConnector({ uri: harness.url() }).query({ type: 'arrow', sql: 'SELEC 1' }))
      .rejects.toThrow(/HTTP status 400/);
  });

  conformanceTest(harness, 'connector/socket-arrow', undefined, async () => {
    const socket = socketConnector({ uri: harness.wsUrl() });
    expectArrow(await socket.query({ type: 'arrow', sql: 'SELECT 1 AS x' }), [[1]]);
  });

  conformanceTest(harness, 'connector/socket-pipeline', undefined, async () => {
    const socket = socketConnector({ uri: harness.wsUrl() });
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map(i => socket.query({ type: 'arrow', sql: `SELECT ${i} AS x` }))
    );
    results.forEach((bytes, i) => expectArrow(bytes, [[i + 1]]));
  });

  conformanceTest(harness, 'connector/socket-error-then-ok', undefined, async () => {
    const socket = socketConnector({ uri: harness.wsUrl() });
    const failed = socket.query({ type: 'arrow', sql: 'SELEC 1' });
    const ok = socket.query({ type: 'arrow', sql: 'SELECT 2 AS x' });
    await expect(failed).rejects.toBeTruthy();
    expectArrow(await ok, [[2]]);
  });
});

function expectArrow(bytes: ArrayBuffer, rows: unknown[][]) {
  const body = new Uint8Array(bytes);
  const problems = arrowProblems(body, { rows });
  if (problems.length) throw new Error(problems.join('; '));
  expect(decodeArrow(body).rows).toEqual(rows);
}
