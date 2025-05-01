import { TableRefNode } from '../ast/table-ref.js';
import { exprList } from '../util/function.js';

/**
 * Returns a named table or view reference.
 * @param {...(string | string[])} ids Table and namespace identifiers.
 *  For example 'name' or ['schema', 'name'].
 * @returns {TableRefNode | undefined} A table reference, or undefined
 *  if the input identifier list is empty.
 */
export function tableRef(...ids) {
  const args = exprList(ids, String);
  return args?.length ? new TableRefNode(args) : undefined;
}
