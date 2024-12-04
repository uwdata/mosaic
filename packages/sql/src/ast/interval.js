import { INTERVAL } from '../constants.js';
import { ExprNode } from './node.js';

export class IntervalNode extends ExprNode {
  /**
   * Instantiate an interval node.
   * @param {string} name The interval name.
   * @param {number} [steps=1] The interval steps.
   */
  constructor(name, steps = 1) {
    super(INTERVAL);
    /**
     * The interval name.
     * @type {string}
     * @readonly
     */
    this.name = name;
    /**
     * The interval steps.
     * @type {number}
     * @readonly
     */
    this.steps = steps;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `INTERVAL ${this.steps} ${this.name}`;
  }
}
