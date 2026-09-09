import { expect, describe, it } from 'vitest';
import { add, cast, clickHouseCodeGenerator, column } from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse cast toString', () => {
  it('emits CAST(expr AS type)', () => {
    expect(cast('foo', 'DOUBLE').toString(gen)).toBe(`CAST("foo" AS DOUBLE)`);
    expect(cast(column('foo'), 'DOUBLE').toString(gen)).toBe(`CAST("foo" AS DOUBLE)`);
  });

  it('preserves compound expressions inside the CAST argument', () => {
    expect(cast(add('bar', 'baz'), 'INTEGER').toString(gen))
      .toBe(`CAST(("bar" + "baz") AS INTEGER)`);
  });
});
