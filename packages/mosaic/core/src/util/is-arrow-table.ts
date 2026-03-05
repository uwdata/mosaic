import type { Table } from '@uwdata/flechette';

/**
 * Test if a value is a Flechette Arrow table.
 * We use a "duck typing" approach and check for a getChild function.
 * @param values The value to test
 * @returns true if the value duck types as Arrow data
 */
export function isArrowTable(values: unknown): values is Table {
  // @ts-expect-error check property of unknown value
  return typeof values?.getChild === 'function';
}