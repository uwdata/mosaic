import { expect, describe, it } from 'vitest';
import { add, cast, clickHouseCodeGenerator, column, tryCast } from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse cast toString', () => {
  it('emits CAST(expr AS type)', () => {
    expect(cast('foo', 'DOUBLE').toString(gen)).toBe('CAST("foo" AS DOUBLE)');
    expect(cast(column('foo'), 'DOUBLE').toString(gen)).toBe('CAST("foo" AS DOUBLE)');
  });

  it('preserves compound expressions inside the CAST argument', () => {
    expect(cast(add('bar', 'baz'), 'INTEGER').toString(gen))
      .toBe('CAST(("bar" + "baz") AS INTEGER)');
  });

  it('rewrites TRY_CAST as accurateCastOrNull', () => {
    expect(tryCast('foo', 'INTEGER').toString(gen))
      .toBe('accurateCastOrNull("foo", \'INTEGER\')');
    expect(tryCast(add('bar', 'baz'), 'Nullable(Float64)').toString(gen))
      .toBe('accurateCastOrNull(("bar" + "baz"), \'Nullable(Float64)\')');
    expect(tryCast('foo', "Enum8('a' = 1)").toString(gen))
      .toBe('accurateCastOrNull("foo", \'Enum8(\'\'a\'\' = 1)\')');
  });
});
