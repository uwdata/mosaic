import { SAMPLE_CLAUSE } from '../constants.js';
import { SQLNode } from './node.js';

export type SampleMethod = 'reservoir' | 'bernoulli' | 'system';

export class SampleClauseNode extends SQLNode {
  /** The sample size as either a row count or percentage. */
  readonly size: number;
  /** Flag if the sampling unit is rows (`false`) or percentage (`true`). */
  readonly perc: boolean;
  /** The sampling method. */
  readonly method?: SampleMethod;
  /** The random seed. */
  readonly seed?: number;

  /**
   * Instantiate a sample clause node.
   * @param size The sample size as either a row count or percentage.
   * @param perc Flag indicating if the sampling unit is
   *   rows (`false`) or a percentage (`true`).
   * @param method The sampling method. If unspecified,
   *   a default method is applied based on the sampling unit.
   * @param seed The random seed.
   */
  constructor(
    size: number,
    perc: boolean = false,
    method?: SampleMethod,
    seed?: number
  ) {
    super(SAMPLE_CLAUSE);
    this.size = size;
    this.perc = perc;
    this.method = method;
    this.seed = seed;
  }
}
