import { expect, describe, it } from 'vitest';
import {
  clickHouseCodeGenerator, column, contains, prefix, regexp_matches, suffix
} from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse string overrides', () => {
  it('rewrites contains', () => {
    expect(contains(column('s'), 'foo').toString(gen))
      .toBe(`(position("s", 'foo') > 0)`);
  });

  it('rewrites prefix (starts_with)', () => {
    expect(prefix(column('s'), 'foo').toString(gen))
      .toBe(`startsWith("s", 'foo')`);
  });

  it('rewrites suffix (ends_with)', () => {
    expect(suffix(column('s'), 'foo').toString(gen))
      .toBe(`endsWith("s", 'foo')`);
  });

  it('rewrites regexp_matches', () => {
    expect(regexp_matches(column('s'), 'foo').toString(gen))
      .toBe(`match("s", 'foo')`);
  });

  it('rejects regexp_matches options', () => {
    expect(() => regexp_matches(column('s'), 'foo', 'i').toString(gen))
      .toThrow(/Regular expression options are not supported/);
  });
});
