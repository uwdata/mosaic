import assert from 'node:assert';
import {
  Query, argmax, argmin, avg, corr, count, covarPop, covariance,
  isNotDistinct, literal, loadObjects, max, min, product, stddev,
  stddevPop, sum, varPop, variance
} from '@uwdata/mosaic-sql';
import { Coordinator, Selection } from '../src/index.js';
import { nodeConnector } from './util/node-connector.js';
import { TestClient } from './util/test-client.js';

async function setup(loadQuery) {
  const mc = new Coordinator(nodeConnector(), {
    logger: null,
    cache: false,
    consolidate: false
  });
  await mc.exec(loadQuery);
  return mc;
}

async function run(measure) {
  const loadQuery = loadObjects('testData', [
    { dim: 'a', x: 1, y: 9 },
    { dim: 'a', x: 2, y: 8 },
    { dim: 'b', x: 3, y: 7 },
    { dim: 'b', x: 4, y: 6 },
    { dim: 'b', x: null, y: null }
  ]);
  const mc = await setup(loadQuery);
  const sel = Selection.single({ cross: true });
  const q = Query.from('testData').select({ measure });

  return new Promise((resolve) => {
    let iter = 0;
    mc.connect(new TestClient(q, sel, {
      queryResult: data => iter
        ? resolve(Array.from(data)[0].measure)
        : ++iter
    }));
    sel.update({
      source: 'test',
      schema: { type: 'point' },
      predicate: isNotDistinct('dim', literal('b'))
    });
  });
}

describe('DataCubeIndexer', () => {
  it('supports count aggregate', async () => {
    assert.strictEqual(await run(count()), 3);
    assert.strictEqual(await run(count('x')), 2);
  });
  it('supports sum aggregate', async () => {
    assert.strictEqual(await run(sum('x')), 7);
  });
  it('supports avg aggregate', async () => {
    assert.strictEqual(await run(avg('x')), 3.5);
  });
  it('supports min aggregate', async () => {
    assert.strictEqual(await run(min('x')), 3);
  });
  it('supports max aggregate', async () => {
    assert.strictEqual(await run(max('x')), 4);
  });
  it('supports product aggregate', async () => {
    assert.strictEqual(await run(product('x')), 12);
  });
  it('supports argmax aggregate', async () => {
    assert.strictEqual(await run(argmax('dim', 'x')), 'b');
  });
  it('supports argmin aggregate', async () => {
    assert.strictEqual(await run(argmin('dim', 'x')), 'b');
  });
  it('supports variance aggregate', async () => {
    assert.strictEqual(await run(variance('x')), 0.5);
  });
  it('supports varPop aggregate', async () => {
    assert.strictEqual(await run(varPop('x')), 0.25);
  });
  it('supports stddev aggregate', async () => {
    assert.strictEqual(await run(stddev('x')), Math.sqrt(0.5));
  });
  it('supports stddevPop aggregate', async () => {
    assert.strictEqual(await run(stddevPop('x')), Math.sqrt(0.25));
  });
  it('supports covariance aggregate', async () => {
    assert.strictEqual(await run(covariance('x', 'y')), -0.5);
    assert.strictEqual(await run(covariance('y', 'x')), -0.5);
  });
  it('supports covarPop aggregate', async () => {
    assert.strictEqual(await run(covarPop('x', 'y')), -0.25);
    assert.strictEqual(await run(covarPop('y', 'x')), -0.25);
  });
  it('supports corr aggregate', async () => {
    assert.strictEqual(await run(corr('x', 'y')), -1);
    assert.strictEqual(await run(corr('y', 'x')), -1);
  });
});
