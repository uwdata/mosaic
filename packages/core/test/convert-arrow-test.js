import assert from 'node:assert';
import { tableFromIPC } from 'apache-arrow';
import { convertArrowValue, convertArrowColumn } from '../src/index.js';
import { readFile } from 'node:fs/promises';

const arrow = tableFromIPC(await readFile('test/convert.arrow'));

const ints = Float64Array.of(1e12, 0, -3.4e12);
const decs = Float64Array.of(3.1415, -1.6180, 2718.2818);
const ts = [
  new Date('1992-03-22T01:02:03.000Z'),
  new Date('1993-03-22T01:02:03.000Z'),
  new Date('1992-03-21T20:02:03.000Z')
];

describe('convertArrowValue', () => {
  it('converts bigint values', () => {
    const child = arrow.getChild('int');
    const fn = convertArrowValue(child.type);
    for (let i = 0; i < ints.length; ++i) {
      assert.strictEqual(fn(child.get(i)), ints[i]);
    }
  });
  it('converts decimal values', () => {
    const child = arrow.getChild('dec');
    const fn = convertArrowValue(child.type);
    for (let i = 0; i < decs.length; ++i) {
      assert.strictEqual(fn(child.get(i)), decs[i]);
    }
  });
  it('converts timestamp values', () => {
    const child = arrow.getChild('ts');
    const fn = convertArrowValue(child.type);
    for (let i = 0; i < ts.length; ++i) {
      const v = child.get(i);
      assert.strictEqual(v, +ts[i]);
      assert.strictEqual(+fn(v), +ts[i]);
    }
  });
});


describe('convertArrowColumn', () => {
  it('converts bigint values', () => {
    const child = arrow.getChild('int');
    const array = convertArrowColumn(child);
    assert.deepStrictEqual(array, ints);
  });
  it('converts decimal values', () => {
    const child = arrow.getChild('dec');
    const array = convertArrowColumn(child);
    assert.deepStrictEqual(array, decs);
  });
  it('converts timestamp values', () => {
    const child = arrow.getChild('ts');
    const array = convertArrowColumn(child);
    assert.deepStrictEqual(array, ts);
  });
});
