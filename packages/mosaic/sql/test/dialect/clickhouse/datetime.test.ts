import { expect, describe, it } from 'vitest';
import { clickHouseCodeGenerator, column, dateBin, dateMonth, epoch_ms, literal, timezone } from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse datetime overrides', () => {
  it('recognizes parameterized DateTime types', () => {
    expect(gen.jsType('DateTime')).toBe('date');
    expect(gen.jsType("DateTime('UTC')")).toBe('date');
    expect(gen.jsType('DateTime64(3)')).toBe('date');
    expect(gen.jsType("Nullable(DateTime('UTC'))")).toBe('date');
    expect(gen.jsType("LowCardinality(Nullable(DateTime64(3, 'UTC')))"))
      .toBe('date');
  });

  it('rewrites epoch_ms', () => {
    expect(epoch_ms(column('ts')).toString(gen))
      .toBe('toUnixTimestamp64Milli(toDateTime64("ts", 3))');
  });

  it('rewrites time_bucket', () => {
    expect(dateBin(column('ts'), 'minute', 5).toString(gen))
      .toBe('toDateTime64(toStartOfInterval("ts", INTERVAL 5 minute), 3)');
  });

  it('rewrites timezone', () => {
    expect(timezone('UTC', column('ts')).toString(gen))
      .toBe(`toTimeZone("ts", 'UTC')`);
  });

  it('rewrites make_date', () => {
    expect(dateMonth(column('ts')).toString(gen))
      .toBe('makeDate(2012, month("ts"), 1)');
  });

  it('rewrites Date literals with a time component', () => {
    const d = new Date(Date.UTC(2024, 0, 2, 9, 30));
    expect(literal(d).toString(gen)).toBe(`fromUnixTimestamp64Milli(${+d})`);
  });

  it('delegates whole-day Date literals to the base visitor', () => {
    const d = new Date(Date.UTC(2024, 0, 2));
    expect(literal(d).toString(gen)).toBe(`DATE '2024-1-2'`);
  });
});
