import { expect, describe, it } from 'vitest';
import { clickHouseCodeGenerator, values } from '../../../src/index.js';

describe('ClickHouse values overrides', () => {
  it('rejects values clauses', () => {
    expect(() => values([[1], [2]]).toString(clickHouseCodeGenerator))
      .toThrow(/VALUES is not supported/);
  });
});
