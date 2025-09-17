import { INTERVAL } from '../constants.js';
import { ExprNode } from './node.js';

export class IntervalNode extends ExprNode {
  /** The interval name. */
  readonly name: string;
  /** The interval steps. */
  readonly steps: number;

  /**
   * Instantiate an interval node.
   * @param name The interval name.
   * @param steps The interval steps.
   */
  constructor(name: string, steps: number = 1) {
    super(INTERVAL);
    this.name = name;
    this.steps = steps;
  }


}
