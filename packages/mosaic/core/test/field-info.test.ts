import { describe, it, expect } from 'vitest';
import type { Coordinator, FieldInfoRequest } from '../src/index.js';
import { queryFieldInfo } from '../src/index.js';

/**
 * Stub coordinator whose describe query yields the given result.
 * @param describe Result for the column describe query.
 */
function stubCoordinator(describe: () => unknown): Coordinator {
  return {
    query: () => Promise.resolve(describe())
  } as unknown as Coordinator;
}

const request: FieldInfoRequest = { table: 'taxi', column: 'tip_amount' };

const fallbackInfo = {
  table: 'taxi',
  column: 'tip_amount',
  sqlType: 'DOUBLE',
  type: 'number',
  nullable: true
};

describe('queryFieldInfo', () => {
  it('falls back to a dummy description for an empty describe result', async () => {
    const mc = stubCoordinator(() => []);
    expect(await queryFieldInfo(mc, [request])).toEqual([fallbackInfo]);
  });

  it('falls back to a dummy description for a failed describe query', async () => {
    const mc = stubCoordinator(() => { throw new Error('describe failed'); });
    expect(await queryFieldInfo(mc, [request])).toEqual([fallbackInfo]);
  });
});
