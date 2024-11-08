import { WINDOW, WINDOW_CLAUSE, WINDOW_DEF, WINDOW_FRAME } from '../constants.js';
import { exprList } from '../util/function.js';
import { quoteIdentifier } from '../util/string.js';
import { isParamLike } from '../util/type-check.js';
import { AggregateNode } from './aggregate.js';
import { FunctionNode } from './function.js';
import { ExprNode, isNode, SQLNode } from './node.js';
import { ParamNode } from './param.js';

/**
 * @typedef {[any, any] | import('../types.js').ParamLike} FrameExtent
 */

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
   * @param {...import('../types.js').ExprVarArgs} expr The partition by criteria.
   * @returns {WindowNode} A new window node.
   */
  partitionby(...expr) {
    return new WindowNode(this.func, this.def.partitionby(...expr));
  }

  /**
   * Return an updated window with the given ordering.
   * @param {...import('../types.js').ExprVarArgs} expr The order by criteria.
   * @returns {WindowNode} A new window node.
   */
  orderby(...expr) {
    return new WindowNode(this.func, this.def.orderby(...expr));
  }

  /**
   * Return an updated window with the given rows frame.
   * @param {FrameExtent} extent The row-based window frame extent.
   * @returns {WindowNode} A new window node.
   */
  rows(extent) {
    return new WindowNode(this.func, this.def.rows(extent));
  }

  /**
   * Return an updated window with the given range frame.
   * @param {FrameExtent} extent The range-based window frame extent.
   * @returns {WindowNode} A new window node.
   */
  range(extent) {
    return new WindowNode(this.func, this.def.range(extent));
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    return `${this.func} OVER ${this.def}`;
  }
}

export class WindowFunctionNode extends FunctionNode {
  /**
   * Instantiate a window function call node.
   * @param {import('../types.js').WindowFunctionName} name The function name.
   * @param {ExprNode[]} [args=[]] The function arguments.
   */
  constructor(name, args) {
    super(name, args);
  }
}

export class WindowDefNode extends SQLNode {
  /**
   * Instantiate a window definition node.
   * @param {string} [name] The base window definition name.
   * @param {ExprNode[]} [partition] The partition by criteria.
   * @param {ExprNode[]} [order] The order by criteria.
   * @param {WindowFrameNode} [frame] The window frame definition.
   */
  constructor(name, partition, order, frame) {
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
    this.frame = frame;
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
   * @param {...import('../types.js').ExprVarArgs} expr The partition by criteria.
   * @returns {WindowDefNode} A new window definition node.
   */
  partitionby(...expr) {
    return deriveDef(this, { partition: exprList(expr) });
  }

  /**
   * Return an updated window definition with the given ordering.
   * @param {...import('../types.js').ExprVarArgs} expr The order by criteria.
   * @returns {WindowDefNode} A new window definition node.
   */
  orderby(...expr) {
    return deriveDef(this, { order: exprList(expr) });
  }

  /**
   * Return an updated window definition with the given rows frame.
   * @param {FrameExtent} extent The row-based window frame extent.
   * @returns {WindowDefNode} A new window definition node.
   */
  rows(extent) {
    return deriveDef(this, { frame: new WindowFrameNode(extent) });
  }

  /**
   * Return an updated window definition with the given range frame.
   * @param {FrameExtent} extent The range-based window frame extent.
   * @returns {WindowDefNode} A new window definition node.
   */
  range(extent) {
    return deriveDef(this, { frame: new WindowFrameNode(extent, true) });
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { name, partition, order, frame } = this;
    const base = name && quoteIdentifier(name);
    const def = [
      base,
      partition?.length && `PARTITION BY ${partition.join(', ')}`,
      order?.length && `ORDER BY ${order.join(', ')}`,
      frame
    ].filter(x => x);
    return base && def.length < 2 ? base : `(${def.join(' ')})`;
  }
}

export class WindowFrameNode extends SQLNode {
  /**
   * Instantiate a window frame definition node.
   * @param {FrameExtent} extent The frame extent as [preceding, following]
   *  row or interval offsets.
   * @param {boolean} [range] The frame type: `true` for range, otherwise rows.
   * @param {ExprNode} [exclude] The window exclusion criteria.
   */
  constructor(extent, range = false, exclude = undefined) {
    super(WINDOW_FRAME);
    /**
     * The frame extent as [preceding, following] row or interval offsets.
     * @type {ParamNode | [any, any]}
     * @readonly
     */
    this.extent = isParamLike(extent) ? new ParamNode(extent) : extent;
    /**
     * The frame type: `true` for range, otherwise rows.
     * @type {boolean}
     * @readonly
     */
    this.range = range;
    /**
     * The window exclusion criteria.
     * @type {ExprNode}
     * @readonly
     */
    this.exclude = exclude;
  }

  /**
   * Generate a SQL query string for this node.
   * @returns {string}
   */
  toString() {
    const { range, exclude, extent  } = this;
    const type = range ? 'RANGE' : 'ROWS';
    const [prev, next] = isNode(extent) ? extent.value : extent;
    const a = frameValue(prev, 'PRECEDING');
    const b = frameValue(next, 'FOLLOWING');
    return `${type} BETWEEN ${a} AND ${b}${exclude ? ` ${exclude}` : ''}`;
  }
}

/**
 * Derive a new window definition node from an existing one.
 * @param {WindowDefNode} def The existing window definition.
 * @param {object} options An options object with new definition properties.
 * @param {string} [options.name] The base window definition name.
 * @param {ExprNode[]} [options.partition] The partition by criteria.
 * @param {ExprNode[]} [options.order] The order by criteria.
 * @param {WindowFrameNode} [options.frame] The window frame definition.
 */
function deriveDef(def, options) {
  return new WindowDefNode(
    options.name ?? def.name,
    options.partition ?? def.partition,
    options.order ?? def.order,
    options.frame ?? def.frame
  );
}

function frameValue(value, order) {
  return value === 0 ? 'CURRENT ROW'
    : Number.isFinite(value) ? `${Math.abs(value)} ${order}`
    : `UNBOUNDED ${order}`;
}
