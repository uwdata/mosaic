import { ExprValue } from '../types.js';
import { CASE, WHEN } from '../constants.js';
import { asNode } from '../util/ast.js';
import { ExprNode, SQLNode } from './node.js';

export class CaseNode extends ExprNode {
  /** The optional base expression. */
  readonly expr?: ExprNode;
  /** An array of WHEN/THEN expression nodes. */
  readonly _when: WhenNode[];
  /** An ELSE expression. */
  readonly _else?: ExprNode;

  /**
   * Instantiate a case node.
   * @param expr An optional base expression, that comes
   *  immediately after the CASE keyword. If specified, this case statement
   *  acts like a switch statement, with WHEN expressions as values to
   *  match against the switch value rather than boolean conditions.
   * @param when An array of WHEN/THEN expression nodes.
   * @param elseExpr An ELSE expression.
   */
  constructor(
    expr: ExprNode | undefined = undefined,
    when: WhenNode[] = [],
    elseExpr: ExprNode | undefined = undefined
  ) {
    super(CASE);
    this.expr = expr;
    this._when = when;
    this._else = elseExpr;
  }

  /**
   * Return a new case node with the given conditional added as
   * the last WHEN / THEN pair.
   * @param cond The WHEN condition expression.
   * @param value The THEN value expression.
   */
  when(cond: ExprValue, value: ExprValue) {
    return new CaseNode(
      this.expr,
      this._when.concat(new WhenNode(asNode(cond), asNode(value))),
      this._else
    );
  }

  /**
   * Return a new case node with the given ELSE expression.
   * @param expr The ELSE expression.
   */
  else(expr: ExprValue) {
    return new CaseNode(this.expr, this._when, asNode(expr));
  }
}

export class WhenNode extends SQLNode {
  /** The condition expression. */
  readonly when: ExprNode;
  /** The value expression. */
  readonly then: ExprNode;

  /**
   * Instantiate a case node.
   * @param when The WHEN condition expression.
   * @param then The THEN value expression.
   */
  constructor(when: ExprNode, then: ExprNode) {
    super(WHEN);
    this.when = when;
    this.then = then;
  }
}
