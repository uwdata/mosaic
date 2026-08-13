import { describe, it, expect } from 'vitest';
import type { Coordinator, FieldInfoRequest } from '../src/index.js';
import { queryFieldInfo } from '../src/index.js';

/**
 * Stub coordinator that serves describe and summarize queries.
 * Field info lookups use the coordinator query method only.
 * @param describeResult Result for the column describe query.
 * @param summarizeResult Result for the summary statistics query.
 */
function stubCoordinator(
  describeResult: () => unknown,
  summarizeResult: () => unknown = () => [{}]
): Coordinator {
  return {
    query(query: unknown) {
      // describe queries are generated as DESC <query>
      return String(query).startsWith('DESC')
        ? Promise.resolve(describeResult())
        : Promise.resolve(summarizeResult());
    }
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

  it('maps a describe result to field info', async () => {
    const mc = stubCoordinator(() => [
      { column_name: 'tip_amount', column_type: 'VARCHAR', null: 'NO' }
    ]);
    expect(await queryFieldInfo(mc, [request])).toEqual([{
      table: 'taxi',
      column: 'tip_amount',
      sqlType: 'VARCHAR',
      type: 'string',
      nullable: false
    }]);
  });

  it('merges requested summary statistics', async () => {
    const mc = stubCoordinator(
      () => [{ column_name: 'tip_amount', column_type: 'DOUBLE', null: 'NO' }],
      () => [{ count: 10, max: 5 }]
    );
    const stats: FieldInfoRequest = { ...request, stats: ['count', 'max'] };
    expect(await queryFieldInfo(mc, [stats])).toEqual([{
      table: 'taxi',
      column: 'tip_amount',
      sqlType: 'DOUBLE',
      type: 'number',
      nullable: false,
      count: 10,
      max: 5
    }]);
  });
});
