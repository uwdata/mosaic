import { CASE, WHEN } from '../constants.js';
import { asNode } from '../util/ast.js';
import { ExprNode, SQLNode } from './node.js';

export class CaseNode extends ExprNode {
  /**
   * Instantiate a case node.
   * @param {ExprNode} [expr] An optional base expression, that comes
   *  immediately after the CASE keyword. If specified, this case statement
   *  acts like a switch statement, with WHEN expressions as values to
   *  match against the switch value rather than boolean conditions.
   * @param {WhenNode[]} [when] An array of WHEN/THEN expression nodes.
   * @param {ExprNode} [elseExpr] An ELSE expression.
   */
  constructor(expr = undefined, when = [], elseExpr = undefined) {
    super(CASE);
    /**
     * The optional base expression.
     * @type {ExprNode}
     * @readonly
     */
    this.expr = expr;
    /**
     * An array of WHEN/THEN expression nodes.
     * @type {WhenNode[]}
     * @readonly
     */
    this._when = when;
    /**
     * An ELSE expression.
     * @type {ExprNode}
     * @readonly
     */
    this._else = elseExpr;
  }

  /**
   * Return a new case node with the given conditional added as
   * the last WHEN / THEN pair.
   * @param {import('../types.js').ExprValue} cond
   *  The WHEN condition expression.
   * @param {import('../types.js').ExprValue} value
   *  The THEN value expression.
   * @returns {CaseNode}
   */
  when(cond, value) {
    return new CaseNode(
      this.expr,
      this._when.concat(new WhenNode(asNode(cond), asNode(value))),
      this._else
    );
  }

  /**
   * Return a new case node with the given ELSE expression.
   * @param {import('../types.js').ExprValue} expr The ELSE expression.
   * @returns {CaseNode}
   */
  else(expr) {
    return new CaseNode(this.expr, this._when, asNode(expr));
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return 'CASE '
      + (this.expr ? `${this.expr} ` : '')
      + this._when.join(' ')
      + (this._else ? ` ELSE ${this._else}` : '')
      + ' END';
  }
}

export class WhenNode extends SQLNode {
  /**
   * Instantiate a case node.
   * @param {ExprNode} when The WHEN condition expression.
   * @param {ExprNode} then The THEN value expression.
   */
  constructor(when, then) {
    super(WHEN);
    /**
     * The condition expression.
     * @type {ExprNode}
     * @readonly
     */
    this.when = when;
    /**
     * The value expression.
     * @type {ExprNode}
     * @readonly
     */
    this.then = then;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `WHEN ${this.when} THEN ${this.then}`;
  }
}
