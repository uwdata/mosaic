import type { Query } from '../ast/query.js';
import { WithClauseNode } from '../ast/with.js';

/**
 * Create a common table expression (CTE) to include within a WITH clause.
 * @param name The common table expression (CTE) name.
 * @param query The common table expression (CTE) query.
 * @param materialized The common table expression (CTE)
 *  materialization flag. If `true`, forces materialization of the CTE.
 *  If `false`, materialization is not performed. Otherwise (for example, if
 *  `undefined` or `null`), materialization is decided by the database.
 */
export function cte(
  name: string,
  query: Query,
  materialized: boolean | null = null
) {
  return new WithClauseNode(name, query, materialized);
}
