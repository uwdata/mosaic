import type { Query } from './query.js';
import { WITH_CLAUSE } from '../constants.js';
import { SQLNode } from './node.js';

export class WithClauseNode extends SQLNode {
  /** The common table expression (CTE) name. */
  readonly name: string;
  /** The common table expression (CTE) query. */
  readonly query: Query;
  /** The common table expression (CTE) materialization flag. */
  readonly materialized: boolean | null;

  /**
   * Instantiate a with clause node for a common table expression (CTE).
   * @param name The common table expression (CTE) name.
   * @param query The common table expression (CTE) query.
   * @param materialized The common table expression (CTE)
   *  materialization flag. If `true`, forces materialization of the CTE.
   *  If `false`, materialization is not performed. Otherwise (for example, if
   *  `undefined` or `null`), materialization is decided by the database.
   */
  constructor(
    name: string,
    query: Query,
    materialized: boolean | null = null
  ) {
    super(WITH_CLAUSE);
    this.name = name;
    this.query = query;
    this.materialized = materialized;
  }
}
