import { FRAGMENT } from '../constants.js';
import { ExprNode } from './node.js';

/**
 * A SQL AST node made up of disjoint fragments that are combined to form
 * a coherent expression. Along with verbatim content, this class serves
 * as an "escape hatch" for handling more unstructured SQL content.
 */
export class FragmentNode extends ExprNode {
  /** The consecutive parts making up the fragment. */
  readonly spans: ExprNode[];

  /**
   * Instantiate a fragment node with arbitrary content.
   * @param spans The consecutive parts making up the fragment.
   */
  constructor(spans: ExprNode[]) {
    super(FRAGMENT);
    this.spans = spans;
  }


}
