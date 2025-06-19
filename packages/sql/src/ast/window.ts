import type { ExprVarArgs, OrderByExpr, WindowFunctionName } from '../types.js';
import type { AggregateNode } from './aggregate.js';
import type { WindowFrameNode } from './window-frame.js';
import { WINDOW, WINDOW_CLAUSE, WINDOW_DEF, WINDOW_FUNCTION } from '../constants.js';
import { nodeList } from '../util/function.js';
import { quoteIdentifier } from '../util/string.js';
import { ExprNode, SQLNode } from './node.js';
import { asNode } from '../util/ast.js';

export class WindowClauseNode extends SQLNode {
   /** The window name. */
   readonly name: string;
   /** The window definition. */
   readonly def: WindowDefNode;

  /**
   * Instantiate a window clause node.
   * @param name The window name.
   * @param def The window definition.
   */
  constructor(name: string, def: WindowDefNode) {
    super(WINDOW_CLAUSE);
    this.name = name;
    this.def = def;
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    return `${quoteIdentifier(this.name)} AS ${this.def}`;
  }
}

export class WindowNode extends ExprNode {
  readonly func: WindowFunctionNode | AggregateNode;
  readonly def: WindowDefNode

  /**
   * Instantiate a window node.
   * @param func The window function call.
   * @param over The window definition or name.
   */
  constructor(
    func: WindowFunctionNode | AggregateNode,
    over: WindowDefNode = new WindowDefNode()
  ) {
    super(WINDOW);
    this.func = func;
    this.def = over;
  }

  /**
   * Return an updated window over a named window definition.
   * @param name The window definition name.
   * @returns A new window node.
   */
  over(name: string) {
    return new WindowNode(this.func, this.def.over(name));
  }

  /**
   * Return an updated window with the given partitions.
   * @param expr The partition by criteria.
   * @returns A new window node.
   */
  partitionby(...expr: ExprVarArgs[]) {
    return new WindowNode(this.func, this.def.partitionby(...expr));
  }

  /**
   * Return an updated window with the given ordering.
   * @param expr The order by criteria.
   * @returns A new window node.
   */
  orderby(...expr: ExprVarArgs[]) {
    return new WindowNode(this.func, this.def.orderby(...expr));
  }

  /**
   * Return an updated window with the given frame definition.
   * @param framedef The frame definition.
   * @returns A new window node.
   */
  frame(framedef: WindowFrameNode) {
    return new WindowNode(this.func, this.def.frame(framedef));
  }

  /**
   * Generate a SQL query string for this node.
   */
  toString() {
    return `${this.func} OVER ${this.def}`;
  }
}

export class WindowFunctionNode extends ExprNode {
  /** The window function name. */
  readonly name: string;
  /** The window function arguments. */
  readonly args: ExprNode[];
  /** Flag to ignore null values. */
  readonly ignoreNulls: boolean;
  /** Order by expression for window arguments. */
  readonly order: ExprNode[];

  /**
   * Instantiate a window function call node.
   * @param name The window function name.
   * @param args The window function arguments.
   * @param ignoreNulls Flag to ignore null values.
   * @param argOrder Order expressions for window arguments.
   *  Note that this argument ordering is distinct from the window ordering.
   */
  constructor(
    name: WindowFunctionName,
    args: ExprNode[] = [],
    ignoreNulls: boolean = false,
    argOrder: OrderByExpr = []
  ) {
    super(WINDOW_FUNCTION);
    this.name = name;
    this.args = args;
    this.ignoreNulls = ignoreNulls;
    this.order = nodeList([argOrder]);
  }

  /**
   * Generate a SQL query string for this node.
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
  /** The base window definition name. */
  readonly name?: string;
  /** The partition by criteria. */
  readonly partition?: ExprNode[];
  /** The order by criteria. */
  readonly order?: ExprNode[];
  /** The window frame definition. */
  readonly framedef?: WindowFrameNode;

  /**
   * Instantiate a window definition node.
   * @param name The base window definition name.
   * @param partition The partition by criteria.
   * @param order The order by criteria.
   * @param framedef The window frame definition.
   */
  constructor(
    name?: string,
    partition?: ExprNode[],
    order?: ExprNode[],
    framedef?: WindowFrameNode
  ) {
    super(WINDOW_DEF);
    this.name = name;
    this.partition = partition;
    this.order = order;
    this.framedef = framedef;
  }

  /**
   * Return an updated window definition with the given base name.
   * @param name The base window definition name.
   * @returns A new window definition node.
   */
  over(name: string) {
    return deriveDef(this, { name });
  }

  /**
   * Return an updated window definition with the given partitions.
   * @param expr The partition by criteria.
   * @returns A new window definition node.
   */
  partitionby(...expr: ExprVarArgs[]) {
    return deriveDef(this, { partition: nodeList(expr) });
  }

  /**
   * Return an updated window definition with the given ordering.
   * @param expr The order by criteria.
   * @returns A new window definition node.
   */
  orderby(...expr: ExprVarArgs[]) {
    return deriveDef(this, { order: nodeList(expr) });
  }

  /**
   * Return an updated window definition with the given frame definition.
   * @param framedef The frame definition.
   * @return A new window definition node.
   */
  frame(framedef: WindowFrameNode) {
    return deriveDef(this, { framedef });
  }

  /**
   * Generate a SQL query string for this node.
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

interface DeriveDefOptions {
  /** The base window definition name. */
  name?: string;
  /** The partition by criteria. */
  partition?: ExprNode[];
  /** The order by criteria. */
  order?: ExprNode[];
  /** The window frame definition. */
  framedef?: WindowFrameNode;
}

/**
 * Derive a new window definition node from an existing one.
 * @param def The existing window definition.
 * @param options An options object with new definition properties.
 */
function deriveDef(def: WindowDefNode, options: DeriveDefOptions) {
  return new WindowDefNode(
    options.name ?? def.name,
    options.partition ?? def.partition,
    options.order ?? def.order,
    options.framedef ?? def.framedef
  );
}
