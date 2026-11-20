import { expect, describe, it } from 'vitest';
import { clickHouseCodeGenerator, column, mul, star } from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse star overrides', () => {
  it('renders unmodified stars', () => {
    expect(star().toString(gen)).toBe('*');
    expect(star('t').toString(gen)).toBe('"t".*');
  });

  it('renders REPLACE', () => {
    expect(star(null, { replace: { a: mul(column('a'), 2) } }).toString(gen))
      .toBe('* REPLACE (("a" * 2) AS "a")');
  });

  it('rejects EXCLUDE and RENAME', () => {
    expect(() => star(null, { exclude: ['a'] }).toString(gen))
      .toThrow(/Star EXCLUDE and RENAME are not supported/);
    expect(() => star(null, { rename: { a: 'z' } }).toString(gen))
      .toThrow(/Star EXCLUDE and RENAME are not supported/);
  });
});
