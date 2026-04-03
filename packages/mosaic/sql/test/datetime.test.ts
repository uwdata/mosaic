import { expect, describe, it } from 'vitest';
import { FunctionNode, timezone, verbatim } from '../src/index.js';

describe('Datetime functions', () => {
  it('include timezone', () => {
    const tz1 = timezone('America/Los_Angeles', verbatim(`TIMESTAMP '2001-02-16 20:38:40'`));
    expect(tz1).toBeInstanceOf(FunctionNode);
    expect(tz1.name).toBe('timezone');
    expect(String(tz1)).toBe(`timezone('America/Los_Angeles', TIMESTAMP '2001-02-16 20:38:40')`);

    const d = new Date(2001, 1, 16, 20, 38, 40);
    const tz2 = timezone('America/Los_Angeles', d);
    expect(tz2).toBeInstanceOf(FunctionNode);
    expect(tz2.name).toBe('timezone');
    expect(String(tz2)).toBe(`timezone('America/Los_Angeles', epoch_ms(${+d}))`);
  });

});
