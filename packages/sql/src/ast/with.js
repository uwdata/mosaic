/** @import { Query } from './query.js' */
import { WITH_CLAUSE } from '../constants.js';
import { SQLNode } from './node.js';

export class WithClauseNode extends SQLNode {
  /**
   * Instantiate a with clause node for a common table expression (CTE).
   * @param {string} name The common table expression (CTE) name.
   * @param {Query} query The common table expression (CTE) query.
   * @param {boolean | null} [materialized] The common table expression (CTE)
   *  materialization flag. If `true`, forces materialization of the CTE.
   *  If `false`, materialization is not performed. Otherwise (for example, if
   *  `undefined` or `null`), materialization is decided by the database.
   */
  constructor(name, query, materialized = undefined) {
    super(WITH_CLAUSE);
    /**
     * The common table expression (CTE) name.
     * @type {string}
     * @readonly
     */
    this.name = name;
    /**
     * The common table expression (CTE) query.
     * @type {Query}
     * @readonly
     */
    this.query = query;
    /**
     * The common table expression (CTE) materialization flag.
     * @type {boolean | null}
     * @readonly
     */
    this.materialized = materialized;
  }

  toString() {
    const flag = this.materialized;
    const mat = flag === true ? ' MATERIALIZED'
      : flag === false ? ' NOT MATERIALIZED'
      : '';
    return `"${this.name}" AS${mat} (${this.query})`;
  }
}
