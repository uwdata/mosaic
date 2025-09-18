import { FromClauseNode } from "../ast/from.js";
import { SampleClauseNode } from "../ast/sample.js";
import { TableRefNode } from "../ast/table-ref.js";
import { asTableRef } from "../util/ast.js";

/**
 * Create a new table FROM reference, applicable in a query or join .
 * @param table The table.
 * @param alias An optional table alias.
 * @param sample An optional table sample to apply.
 */
export function from(
  table: string | string[] | TableRefNode,
  alias?: string,
  sample?: SampleClauseNode
) {
  return new FromClauseNode(asTableRef(table)!, alias, sample);
}
