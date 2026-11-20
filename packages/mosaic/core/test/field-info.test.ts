import { describe, it, expect } from 'vitest';
import { isDescribeQuery } from '@uwdata/mosaic-sql';
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

  it('requests table info as a describe query node', async () => {
    const queries: unknown[] = [];
    const mc = {
      query: (query: unknown) => {
        queries.push(query);
        return Promise.resolve([
          { column_name: 'tip_amount', column_type: 'DOUBLE', null: 'NO' }
        ]);
      }
    } as unknown as Coordinator;

    expect(await queryFieldInfo(mc, [{ table: 'taxi', column: '*' }]))
      .toEqual([{ ...fallbackInfo, nullable: false }]);
    expect(queries.map(isDescribeQuery)).toEqual([true]);
    expect(`${queries[0]}`).toBe('DESC SELECT * FROM "taxi"');
  });
});
