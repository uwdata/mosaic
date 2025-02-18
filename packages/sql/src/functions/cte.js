import { Query } from '../ast/query.js';
import { WithClauseNode } from '../ast/with.js';

/**
 * Create a common table expression (CTE) to include within a WITH clause.
 * @param {string} name The common table expression (CTE) name.
 * @param {Query} query The common table expression (CTE) query.
 * @param {boolean | null} [materialized] The common table expression (CTE)
 *  materialization flag. If `true`, forces materialization of the CTE.
 *  If `false`, materialization is not performed. Otherwise (for example, if
 *  `undefined` or `null`), materialization is decided by the database.
 * @returns {WithClauseNode}
 */
export function cte(name, query, materialized) {
  return new WithClauseNode(name, query, materialized);
}
