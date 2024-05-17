import assert from 'node:assert';
import {
  Query, argmax, argmin, avg, count, isNotDistinct,
  literal, loadObjects, max, min, product, stddev, sum,
  variance
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
    { dim: 'a', val: 1 },
    { dim: 'a', val: 2 },
    { dim: 'b', val: 3 },
    { dim: 'b', val: 4 }
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
    assert.strictEqual(await run(count()), 2);
  });
  it('supports sum aggregate', async () => {
    assert.strictEqual(await run(sum('val')), 7);
  });
  it('supports avg aggregate', async () => {
    assert.strictEqual(await run(avg('val')), 3.5);
  });
  it('supports min aggregate', async () => {
    assert.strictEqual(await run(min('val')), 3);
  });
  it('supports max aggregate', async () => {
    assert.strictEqual(await run(max('val')), 4);
  });
  it('supports product aggregate', async () => {
    assert.strictEqual(await run(product('val')), 12);
  });
  it('supports argmax aggregate', async () => {
    assert.strictEqual(await run(argmax('dim', 'val')), 'b');
  });
  it('supports argmin aggregate', async () => {
    assert.strictEqual(await run(argmin('dim', 'val')), 'b');
  });
  it('supports variance aggregate', async () => {
    assert.strictEqual(await run(variance('val')), 0.5);
  });
  it('supports stddev aggregate', async () => {
    assert.strictEqual(await run(stddev('val')), Math.sqrt(0.5));
  });
});
