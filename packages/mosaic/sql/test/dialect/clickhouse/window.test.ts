import { expect, describe, it } from 'vitest';
import {
  clickHouseCodeGenerator,
  column,
  first_value,
  frameGroups,
  frameRange,
  frameRows,
  lag,
  lead,
  literal,
  nth_value,
  row_number,
  sum,
  WindowFunctionNode,
  WindowNode
} from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse window overrides', () => {
  it('renders window functions', () => {
    expect(row_number().toString(gen)).toBe('row_number() OVER ()');
    expect(first_value('value').toString(gen))
      .toBe('first_value("value") OVER ()');
    const ignoreNulls = new WindowFunctionNode(
      'first_value',
      [column('value')],
      true
    );
    expect(new WindowNode(ignoreNulls).toString(gen))
      .toBe('first_value("value") IGNORE NULLS OVER ()');
  });

  it('renders ordered windows', () => {
    expect(row_number().partitionby('group').orderby('value').toString(gen))
      .toBe('row_number() OVER (PARTITION BY "group" ORDER BY "value")');
  });

  it('preserves null defaults for offset and value functions', () => {
    expect(lag('value').toString(gen))
      .toBe('lag(toNullable("value")) OVER ()');
    expect(lead('value', 2).toString(gen))
      .toBe('lead(toNullable("value"), 2) OVER ()');
    expect(lag('value', 1, null).toString(gen))
      .toBe('lag(toNullable("value"), 1, NULL) OVER ()');
    expect(lead('value', 1, literal(-1)).toString(gen))
      .toBe('lead("value", 1, -1) OVER ()');
    expect(nth_value('value', 2).toString(gen))
      .toBe('nth_value(toNullable("value"), 2) OVER ()');
  });

  it('renders rows and range frames', () => {
    expect(sum('value').frame(frameRows([null, 0])).toString(gen))
      .toBe('sum("value") OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)');
    expect(sum('value').orderby('value').frame(frameRange([1, 0])).toString(gen))
      .toBe('sum("value") OVER (ORDER BY "value" RANGE BETWEEN 1 PRECEDING AND CURRENT ROW)');
  });

  it('rejects groups frames', () => {
    expect(() => sum('value').frame(frameGroups([null, 0])).toString(gen))
      .toThrow(/GROUPS window frames are not supported/);
  });

  it('rejects frame exclusions', () => {
    expect(() => sum('value').frame(frameRows([null, 0], 'CURRENT ROW')).toString(gen))
      .toThrow(/Window frame EXCLUDE is not supported/);
  });

  it('rejects function argument ordering', () => {
    const fn = new WindowFunctionNode(
      'first_value',
      [column('value')],
      false,
      column('value')
    );
    expect(() => fn.toString(gen))
      .toThrow(/Window function argument ordering is not supported/);
  });
});
