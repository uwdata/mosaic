/**
 * @import { ExprVarArgs, OrderByExpr, WindowFunctionName } from '../types.js'
 * @import { AggregateNode } from './aggregate.js'
 * @import { WindowFrameNode } from './window-frame.js'
 */
import { WINDOW, WINDOW_CLAUSE, WINDOW_DEF, WINDOW_FUNCTION } from '../constants.js';
import { exprList } from '../util/function.js';
import { quoteIdentifier } from '../util/string.js';
import { ExprNode, SQLNode } from './node.js';

export class WindowClauseNode extends SQLNode {
  /**
   * Instantiate a window clause node.
   * @param {string} name The window name.
   * @param {WindowDefNode} def The window definition.
   */
  constructor(name, def) {
    super(WINDOW_CLAUSE);
    /**
     * The window name.
     * @type {string}
     * @readonly
     */
    this.name = name;
    /**
     * The window definition.
     * @type {WindowDefNode}
     * @readonly
     */
    this.def = def;
  }

  toString() {
    return `${quoteIdentifier(this.name)} AS ${this.def}`;
  }
}

export class WindowNode extends ExprNode {
  /**
   * Instantiate a window node.
   * @param {WindowFunctionNode | AggregateNode} func The window function call.
   * @param {WindowDefNode} [over] The window definition or name.
   */
  constructor(func, over = new WindowDefNode()) {
    super(WINDOW);
    /**
     * @type {WindowFunctionNode | AggregateNode}
     * @readonly
     */
    this.func = func;
    /**
     * @type {WindowDefNode}
     * @readonly
     */
    this.def = over;
  }

  /**
   * Return an updated window over a named window definition.
   * @param {string} name The window definition name.
   * @returns {WindowNode} A new window node.
   */
  over(name) {
    return new WindowNode(this.func, this.def.over(name));
  }

  /**
   * Return an updated window with the given partitions.
   * @param {...ExprVarArgs} expr The partition by criteria.
   * @returns {WindowNode} A new window node.
   */
  partitionby(...expr) {
    return new WindowNode(this.func, this.def.partitionby(...expr));
  }

  /**
   * Return an updated window with the given ordering.
   * @param {...ExprVarArgs} expr The order by criteria.
   * @returns {WindowNode} A new window node.
   */
  orderby(...expr) {
    return new WindowNode(this.func, this.def.orderby(...expr));
  }

  /**
   * Return an updated window with the given frame definition.
   * @param {WindowFrameNode} framedef The frame definition.
   * @returns {WindowNode} A new window node.
   */
  frame(framedef) {
    return new WindowNode(this.func, this.def.frame(framedef));
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `${this.func} OVER ${this.def}`;
  }
}

export class WindowFunctionNode extends ExprNode {
  /**
   * Instantiate a window function call node.
   * @param {WindowFunctionName} name The window function name.
   * @param {ExprNode[]} [args=[]] The window function arguments.
   * @param {boolean} [ignoreNulls=false] Flag to ignore null values.
   * @param {OrderByExpr} [argOrder] Order expressions for window arguments.
   *  Note that this argument ordering is distinct from the window ordering.
   */
  constructor(name, args = [], ignoreNulls = false, argOrder = []) {
    super(WINDOW_FUNCTION);
    /**
     * The window function name.
     * @type {string}
     * @readonly
     */
    this.name = name;
    /**
     * The window function arguments.
     * @type {ExprNode[]}
     * @readonly
     */
    this.args = args;
    /**
     * Flag to ignore null values.
     * @type {boolean}
     * @readonly
     */
    this.ignoreNulls = ignoreNulls;
    /**
     * Order by expression for window arguments.
     * @type {ExprNode[]}
     * @readonly
     */
    this.order = exprList([argOrder]);
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { name, args, ignoreNulls, order } = this;
    const arg = [
      args.join(', '),
      order.length ? `ORDER BY ${order.join(', ')}` : '',
      ignoreNulls ? 'IGNORE NULLS' : ''
    ].filter(x => x).join(' ');
    return `${name}(${arg})`;
  }
}

export class WindowDefNode extends SQLNode {
  /**
   * Instantiate a window definition node.
   * @param {string} [name] The base window definition name.
   * @param {ExprNode[]} [partition] The partition by criteria.
   * @param {ExprNode[]} [order] The order by criteria.
   * @param {WindowFrameNode} [framedef] The window frame definition.
   */
  constructor(name, partition, order, framedef) {
    super(WINDOW_DEF);
    /**
     * The base window definition name.
     * @type {string}
     * @readonly
     */
    this.name = name;
    /**
     * The partition by criteria.
     * @type {ExprNode[]}
     * @readonly
     */
    this.partition = partition;
    /**
     * The order by criteria.
     * @type {ExprNode[]}
     * @readonly
     */
    this.order = order;
    /**
     * The window frame definition.
     * @type {WindowFrameNode}
     * @readonly
     */
    this.framedef = framedef;
  }

  /**
   * Return an updated window definition with the given base name.
   * @param {string} name The base window definition name.
   * @returns {WindowDefNode} A new window definition node.
   */
  over(name) {
    return deriveDef(this, { name });
  }

  /**
   * Return an updated window definition with the given partitions.
   * @param {...ExprVarArgs} expr The partition by criteria.
   * @returns {WindowDefNode} A new window definition node.
   */
  partitionby(...expr) {
    return deriveDef(this, { partition: exprList(expr) });
  }

  /**
   * Return an updated window definition with the given ordering.
   * @param {...ExprVarArgs} expr The order by criteria.
   * @returns {WindowDefNode} A new window definition node.
   */
  orderby(...expr) {
    return deriveDef(this, { order: exprList(expr) });
  }

  /**
   * Return an updated window definition with the given frame definition.
   * @param {WindowFrameNode} framedef The frame definition.
   * @returns {WindowDefNode} A new window definition node.
   */
  frame(framedef) {
    return deriveDef(this, { framedef });
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { name, partition, order, framedef } = this;
    const base = name && quoteIdentifier(name);
    const def = [
      base,
      partition?.length && `PARTITION BY ${partition.join(', ')}`,
      order?.length && `ORDER BY ${order.join(', ')}`,
      framedef
    ].filter(x => x);
    return base && def.length < 2 ? base : `(${def.join(' ')})`;
  }
}

/**
 * Derive a new window definition node from an existing one.
 * @param {WindowDefNode} def The existing window definition.
 * @param {object} options An options object with new definition properties.
 * @param {string} [options.name] The base window definition name.
 * @param {ExprNode[]} [options.partition] The partition by criteria.
 * @param {ExprNode[]} [options.order] The order by criteria.
 * @param {WindowFrameNode} [options.framedef] The window frame definition.
 */
function deriveDef(def, options) {
  return new WindowDefNode(
    options.name ?? def.name,
    options.partition ?? def.partition,
    options.order ?? def.order,
    options.framedef ?? def.framedef
  );
}
