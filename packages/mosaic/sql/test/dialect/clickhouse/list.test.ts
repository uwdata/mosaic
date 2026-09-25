import { expect, describe, it } from 'vitest';
import {
  clickHouseCodeGenerator, column, listContains, listHasAll, listHasAny, unnest
} from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse list overrides', () => {
  it('rewrites listContains', () => {
    expect(listContains(column('xs'), 'x').toString(gen))
      .toBe(`has("xs", 'x')`);
  });

  it('rewrites listHasAny', () => {
    expect(listHasAny(column('xs'), column('ys')).toString(gen))
      .toBe('hasAny("xs", "ys")');
  });

  it('rewrites listHasAll', () => {
    expect(listHasAll(column('xs'), column('ys')).toString(gen))
      .toBe('hasAll("xs", "ys")');
  });

  it('renders unnest', () => {
    expect(unnest('xs').toString(gen)).toBe('UNNEST("xs")');
  });

  it('rejects recursive unnest', () => {
    expect(() => unnest('xs', true).toString(gen))
      .toThrow(/Recursive UNNEST is not supported/);
    expect(() => unnest('xs', false, 2).toString(gen))
      .toThrow(/Recursive UNNEST is not supported/);
  });
});
