import { TableRefNode } from '../ast/table-ref.js';
import { MaybeArray } from '../types.js';
import { exprList } from '../util/function.js';

/**
 * Returns a named table or view reference.
 * @param ids Table and namespace identifiers.
 *  For example 'name' or ['schema', 'name'].
 * @returns A table reference or undefined if the input list is empty.
 */
export function tableRef(...ids: MaybeArray<string>[]) {
  const args = exprList(ids, String);
  return args?.length ? new TableRefNode(args) : undefined;
}
