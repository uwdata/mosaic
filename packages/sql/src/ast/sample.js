import { SAMPLE_CLAUSE } from '../constants.js';
import { SQLNode } from './node.js';

/**
 * @typedef {'reservoir' | 'bernoulli' | 'system'} SampleMethod
 */

export class SampleClauseNode extends SQLNode {
  /**
   * Instantiate a sample clause node.
   * @param {number} size The sample size as either a row count or percentage.
   * @param {boolean} [perc=false] Flag indicating if the sampling unit is
   *   rows (`false`) or a percentage (`true`).
   * @param {SampleMethod} [method] The sampling method. If unspecified,
   *   a default method is applied based on the sampling unit.
   * @param {number} [seed] The random seed.
   */
  constructor(size, perc = false, method = undefined, seed = undefined) {
    super(SAMPLE_CLAUSE);
    /**
     * The sample size as either a row count or percentage.
     * @type {number}
     * @readonly
     */
    this.size = size;
    /**
     * Flag indicating if the sampling unit is rows (`false`) or a
     * percentage (`true`).
     * @type {boolean}
     * @readonly
     */
    this.perc = perc;
    /**
     * The sampling method.
     * @type {SampleMethod}
     * @readonly
     */
    this.method = method;
    /**
     * The random seed.
     * @type {number}
     * @readonly
     */
    this.seed = seed;
  }

  toString() {
    const { size, perc, method, seed } = this;
    const unit = perc ? '%' : ' ROWS';
    const s = seed != null ? `, ${seed}` : '';
    return `${size}${unit}${method ? ` (${method}${s})` : ''}`;
  }
}
