import { WITH_CLAUSE } from '../constants.js';
import { SQLNode } from './node.js';
import { Query } from './query.js';

export class WithClauseNode extends SQLNode {
  /**
   * Instantiate a with clause node for a common table expression (CTE).
   * @param {string} name The common table expression (CTE) name.
   * @param {Query} query The common table expression (CTE) query.
   */
  constructor(name, query) {
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
  }

  toString() {
    return `"${this.name}" AS (${this.query})`;
  }
}
