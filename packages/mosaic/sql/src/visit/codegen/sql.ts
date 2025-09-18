import type {
  SQLNode,
  ExprNode,
  AggregateNode,
  BetweenOpNode,
  NotBetweenOpNode,
  BinaryOpNode,
  CaseNode,
  WhenNode,
  CastNode,
  CollateNode,
  ColumnParamNode,
  ColumnRefNode,
  FragmentNode,
  FromClauseNode,
  FunctionNode,
  InOpNode,
  IntervalNode,
  JoinNode,
  ListNode,
  LiteralNode,
  LogicalOpNode,
  OrderByNode,
  ParamNode,
  DescribeQuery,
  SelectQuery,
  SetOperation,
  SampleClauseNode,
  SelectClauseNode,
  ScalarSubqueryNode,
  TableRefNode,
  UnaryOpNode,
  UnaryPostfixOpNode,
  UnnestNode,
  VerbatimNode,
  WindowNode,
  WindowClauseNode,
  WindowDefNode,
  WindowFunctionNode,
  WindowFrameNode,
  WindowFrameExprNode,
  WithClauseNode
} from '../../index.js';
import {
  AGGREGATE,
  BETWEEN_OPERATOR,
  BINARY_OPERATOR,
  CASE,
  CAST,
  COLLATE,
  COLUMN_PARAM,
  COLUMN_REF,
  DESCRIBE_QUERY,
  EXPRESSION,
  FRAGMENT,
  FROM_CLAUSE,
  FUNCTION,
  IN_OPERATOR,
  INTERVAL,
  JOIN_CLAUSE,
  LIST,
  LITERAL,
  LOGICAL_OPERATOR,
  NOT_BETWEEN_OPERATOR,
  ORDER_BY,
  PARAM,
  SAMPLE_CLAUSE,
  SCALAR_SUBQUERY,
  SELECT_CLAUSE,
  SELECT_QUERY,
  SET_OPERATION,
  TABLE_REF,
  UNARY_OPERATOR,
  UNARY_POSTFIX_OPERATOR,
  UNNEST,
  VERBATIM,
  WHEN,
  WINDOW,
  WINDOW_CLAUSE,
  WINDOW_DEF,
  WINDOW_EXTENT_EXPR,
  WINDOW_FRAME,
  WINDOW_FUNCTION,
  WITH_CLAUSE
} from '../../constants.js';

/**
 * Abstract base class for SQL code generation visitors.
 */
export abstract class SQLCodeGenerator {
  /**
   * Convert a SQL AST node to a string using this visitor.
   * @param node The SQL AST node to convert.
   * @returns The SQL string representation.
   */
  toString(node: SQLNode): string {
    if (!node) {
      throw new Error('Node is null or undefined');
    }
    if (typeof node.type !== 'string') {
      throw new Error(`Node type is not a string: ${typeof node.type}, value: ${node.type}`);
    }
    if (node.type === 'CUSTOM') {
      // custom node types may bypass visitor
      return node.toString();
    }
    const method = this.getVisitMethod(node.type);
    if (typeof method === 'function') {
      // @ts-expect-error: dispatch based on node type
      return method.call(this, node);
    }
    throw new Error(`No visitor method for node type: '${node.type}'`);
  }

  protected getVisitMethod(nodeType: string) {
    switch (nodeType) {
      case AGGREGATE: return this.visitAggregate;
      case BETWEEN_OPERATOR: return this.visitBetween;
      case BINARY_OPERATOR: return this.visitBinary;
      case CASE: return this.visitCase;
      case CAST: return this.visitCast;
      case COLLATE: return this.visitCollate;
      case COLUMN_PARAM: return this.visitColumnParam;
      case COLUMN_REF: return this.visitColumnRef;
      case DESCRIBE_QUERY: return this.visitDescribeQuery;
      case EXPRESSION: return this.visitExpression;
      case FRAGMENT: return this.visitFragment;
      case FROM_CLAUSE: return this.visitFromClause;
      case FUNCTION: return this.visitFunction;
      case IN_OPERATOR: return this.visitIn;
      case INTERVAL: return this.visitInterval;
      case JOIN_CLAUSE: return this.visitJoinClause;
      case LIST: return this.visitList;
      case LITERAL: return this.visitLiteral;
      case LOGICAL_OPERATOR: return this.visitLogicalOperator;
      case NOT_BETWEEN_OPERATOR: return this.visitNotBetween;
      case ORDER_BY: return this.visitOrderBy;
      case PARAM: return this.visitParam;
      case SAMPLE_CLAUSE: return this.visitSampleClause;
      case SCALAR_SUBQUERY: return this.visitScalarSubquery;
      case SELECT_CLAUSE: return this.visitSelectClause;
      case SELECT_QUERY: return this.visitSelectQuery;
      case SET_OPERATION: return this.visitSetOperation;
      case TABLE_REF: return this.visitTableRef;
      case UNARY_OPERATOR: return this.visitUnary;
      case UNARY_POSTFIX_OPERATOR: return this.visitUnaryPostfix;
      case UNNEST: return this.visitUnnest;
      case VERBATIM: return this.visitVerbatim;
      case WHEN: return this.visitWhen;
      case WINDOW: return this.visitWindow;
      case WINDOW_CLAUSE: return this.visitWindowClause;
      case WINDOW_DEF: return this.visitWindowDef;
      case WINDOW_EXTENT_EXPR: return this.visitWindowExtentExpr;
      case WINDOW_FRAME: return this.visitWindowFrame;
      case WINDOW_FUNCTION: return this.visitWindowFunction;
      case WITH_CLAUSE: return this.visitWithClause;
      default:
        throw new Error(`Unknown node type: '${nodeType}'`);
    }
  }

  /**
   * Helper method to convert child nodes to strings.
   * @param nodes Array of child nodes.
   * @returns Array of SQL strings.
   */
  protected mapToString(nodes: SQLNode[]): string[] {
    return nodes.map(node => this.toString(node));
  }

  // Abstract methods that must be implemented by concrete visitors
  abstract visitAggregate(node: AggregateNode): string;
  abstract visitBetween(node: BetweenOpNode): string;
  abstract visitBinary(node: BinaryOpNode): string;
  abstract visitCase(node: CaseNode): string;
  abstract visitCast(node: CastNode): string;
  abstract visitCollate(node: CollateNode): string;
  abstract visitColumnParam(node: ColumnParamNode): string;
  abstract visitColumnRef(node: ColumnRefNode): string;
  abstract visitDescribeQuery(node: DescribeQuery): string;
  abstract visitExpression(node: ExprNode): string;
  abstract visitFragment(node: FragmentNode): string;
  abstract visitFromClause(node: FromClauseNode): string;
  abstract visitFunction(node: FunctionNode): string;
  abstract visitIn(node: InOpNode): string;
  abstract visitInterval(node: IntervalNode): string;
  abstract visitJoinClause(node: JoinNode): string;
  abstract visitList(node: ListNode): string;
  abstract visitLiteral(node: LiteralNode): string;
  abstract visitLogicalOperator(node: LogicalOpNode<ExprNode>): string;
  abstract visitNotBetween(node: NotBetweenOpNode): string;
  abstract visitOrderBy(node: OrderByNode): string;
  abstract visitParam(node: ParamNode): string;
  abstract visitSampleClause(node: SampleClauseNode): string;
  abstract visitScalarSubquery(node: ScalarSubqueryNode): string;
  abstract visitSelectClause(node: SelectClauseNode): string;
  abstract visitSelectQuery(node: SelectQuery): string;
  abstract visitSetOperation(node: SetOperation): string;
  abstract visitTableRef(node: TableRefNode): string;
  abstract visitUnary(node: UnaryOpNode): string;
  abstract visitUnaryPostfix(node: UnaryPostfixOpNode): string;
  abstract visitUnnest(node: UnnestNode): string;
  abstract visitVerbatim(node: VerbatimNode): string;
  abstract visitWhen(node: WhenNode): string;
  abstract visitWindow(node: WindowNode): string;
  abstract visitWindowClause(node: WindowClauseNode): string;
  abstract visitWindowDef(node: WindowDefNode): string;
  abstract visitWindowExtentExpr(node: WindowFrameExprNode): string;
  abstract visitWindowFrame(node: WindowFrameNode): string;
  abstract visitWindowFunction(node: WindowFunctionNode): string;
  abstract visitWithClause(node: WithClauseNode): string;
}
