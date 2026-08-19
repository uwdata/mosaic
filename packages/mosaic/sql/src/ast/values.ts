import { VALUES } from '../constants.js';
import { SQLNode } from './node.js';
import { TupleNode } from './tuple.js';

export class ValuesNode extends SQLNode {
  /** The array of value tuples. */
  readonly values: TupleNode[];

  /**
   * Instantiate a tuple node.
   * @param values
   */
  constructor(values: TupleNode[]) {
    super(VALUES);
    this.values = values;
  }
}
