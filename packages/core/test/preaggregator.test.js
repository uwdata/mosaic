import { describe, it, expect } from 'vitest';
import {
  Query, argmax, argmin, avg, corr, count, covarPop, covariance,
  isNotDistinct, literal, loadObjects, max, min, product, regrAvgX,
  regrAvgY, regrCount, regrIntercept, regrR2, regrSXX, regrSXY,
  regrSYY, regrSlope, stddev, stddevPop, sum, varPop, variance
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

describe('PreAggregator', () => {
  it('supports count aggregate', async () => {
    expect(await run(count())).toBe(3);
    expect(await run(count('x'))).toBe(2);
  });
  it('supports sum aggregate', async () => {
    expect(await run(sum('x'))).toBe(7);
  });
  it('supports avg aggregate', async () => {
    expect(await run(avg('x'))).toBe(3.5);
  });
  it('supports min aggregate', async () => {
    expect(await run(min('x'))).toBe(3);
  });
  it('supports max aggregate', async () => {
    expect(await run(max('x'))).toBe(4);
  });
  it('supports product aggregate', async () => {
    expect(await run(product('x'))).toBe(12);
  });
  it('supports argmax aggregate', async () => {
    expect(await run(argmax('dim', 'x'))).toBe('b');
  });
  it('supports argmin aggregate', async () => {
    expect(await run(argmin('dim', 'x'))).toBe('b');
  });
  it('supports variance aggregate', async () => {
    expect(await run(variance('x'))).toBe(0.5);
  });
  it('supports varPop aggregate', async () => {
    expect(await run(varPop('x'))).toBe(0.25);
  });
  it('supports stddev aggregate', async () => {
    expect(await run(stddev('x'))).toBe(Math.sqrt(0.5));
  });
  it('supports stddevPop aggregate', async () => {
    expect(await run(stddevPop('x'))).toBe(Math.sqrt(0.25));
  });
  it('supports covariance aggregate', async () => {
    expect(await run(covariance('x', 'y'))).toBe(-0.5);
    expect(await run(covariance('y', 'x'))).toBe(-0.5);
  });
  it('supports covarPop aggregate', async () => {
    expect(await run(covarPop('x', 'y'))).toBe(-0.25);
    expect(await run(covarPop('y', 'x'))).toBe(-0.25);
  });
  it('supports corr aggregate', async () => {
    expect(await run(corr('x', 'y'))).toBe(-1);
    expect(await run(corr('y', 'x'))).toBe(-1);
  });
  it('supports regression aggregates', async () => {
    expect(await run(regrCount('y', 'x'))).toBe(2);
    expect(await run(regrAvgX('y', 'x'))).toBe(3.5);
    expect(await run(regrAvgY('y', 'x'))).toBe(6.5);
    expect(await run(regrSXX('y', 'x'))).toBe(0.5);
    expect(await run(regrSYY('y', 'x'))).toBe(0.5);
    expect(await run(regrSXY('y', 'x'))).toBe(-0.5);
    expect(await run(regrSlope('y', 'x'))).toBe(-1);
    expect(await run(regrIntercept('y', 'x'))).toBe(10);
    expect(await run(regrR2('y', 'x'))).toBe(1);
  });
});
