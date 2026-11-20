import { expect, describe, it } from 'vitest';
import { clickHouseCodeGenerator, collate } from '../../../src/index.js';

describe('ClickHouse collation overrides', () => {
  it('rejects collations', () => {
    expect(() => collate('text', 'en').toString(clickHouseCodeGenerator))
      .toThrow(/COLLATE is not supported/);
  });
});
