import { LAMBDA, LAMBDA_VAR } from '../constants.js';
import { ExprNode } from './node.js';

export class LambdaVarNode extends ExprNode {
  /** The lambda parameter name. */
  readonly name: string;

  /**
   * Instantiate a reference to a lambda parameter. Lambda parameter
   * references are distinct from column references, so that column
   * collection and lineage analysis do not treat them as table columns.
   * @param name The lambda parameter name.
   */
  constructor(name: string) {
    super(LAMBDA_VAR);
    this.name = name;
  }
}

export class LambdaNode extends ExprNode {
  /** The lambda parameter names. */
  readonly params: string[];
  /** The lambda body expression. */
  readonly body: ExprNode;

  /**
   * Instantiate a lambda function node.
   * @param params The lambda parameter names.
   * @param body The lambda body expression. References to lambda
   *  parameters within the body should be LambdaVarNode instances.
   */
  constructor(params: string[], body: ExprNode) {
    super(LAMBDA);
    this.params = params;
    this.body = body;
  }
}
