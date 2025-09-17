import type { ParamLike } from '../types.js';
import { PARAM } from '../constants.js';
import { ExprNode } from './node.js';

export class ParamNode extends ExprNode {
  /** The dynamic parameter. */
  readonly param: ParamLike;

  /**
   * Instantiate a param node with a dynamic parameter.
   * @param param The dynamic parameter.
   */
  constructor(param: ParamLike) {
    super(PARAM);
    this.param = param;
  }

  /**
   * Returns the current parameter value.
   */
  get value() {
    return this.param.value;
  }


}
