import type { ExprValue } from '../types.js';
import { LambdaNode, LambdaVarNode } from '../ast/lambda.js';
import { ExprNode } from '../ast/node.js';
import { asNode } from '../util/ast.js';

/**
 * Create a lambda function, as in `lambda x, y: body`.
 * @param params The lambda parameter name or names.
 * @param body Either a callback that is invoked with a parameter
 *  reference for each parameter name and returns the body expression,
 *  or a body expression that uses LambdaVarNode parameter references.
 */
export function lambda(
  params: string | string[],
  body: ExprNode | ((...vars: LambdaVarNode[]) => ExprValue)
) {
  const names = Array.isArray(params) ? params : [params];
  const expr = body instanceof ExprNode ? body
    : asNode(body(...names.map(name => new LambdaVarNode(name))));
  return new LambdaNode(names, expr);
}
