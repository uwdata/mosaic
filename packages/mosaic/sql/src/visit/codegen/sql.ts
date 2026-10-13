import type {
  SQLNode,
  ExprNode,
  AggregateNode,
  AllNode,
  BetweenOpNode,
  NotBetweenOpNode,
  BinaryOpNode,
  CaseNode,
  WhenNode,
  CastNode,
  CollateNode,
  ColumnParamNode,
  ColumnRefNode,
  ColumnsNode,
  CreateQuery,
  CreateSchemaQuery,
  FragmentNode,
  FromClauseNode,
  FunctionNode,
  InOpNode,
  IntervalNode,
  JoinNode,
  LambdaNode,
  LambdaVarNode,
  ListNode,
  LiteralNode,
  LogicalOpNode,
  NamedArgNode,
  OrderByNode,
  ParamNode,
  PivotQuery,
  QuantifiedOpNode,
  DescribeQuery,
  SelectQuery,
  SetOperation,
  SampleClauseNode,
  SelectClauseNode,
  ScalarSubqueryNode,
  SliceNode,
  SubscriptNode,
  TableRefNode,
  TupleNode,
  UnaryOpNode,
  UnaryPostfixOpNode,
  UnnestNode,
  ValuesNode,
  VerbatimNode,
  WindowNode,
  WindowClauseNode,
  WindowDefNode,
  WindowFunctionNode,
  WindowFrameNode,
  WindowFrameExprNode,
  WithClauseNode
} from '../../ast/index.js';
import {
  AGGREGATE,
  ALL,
  BETWEEN_OPERATOR,
  BINARY_OPERATOR,
  CASE,
  CAST,
  COLLATE,
  COLUMN_PARAM,
  COLUMN_REF,
  COLUMNS,
  CREATE_QUERY,
  CREATE_SCHEMA_QUERY,
  DESCRIBE_QUERY,
  EXPRESSION,
  FRAGMENT,
  FROM_CLAUSE,
  FUNCTION,
  IN_OPERATOR,
  INTERVAL,
  JOIN_CLAUSE,
  LAMBDA,
  LAMBDA_VAR,
  LIST,
  LITERAL,
  LOGICAL_OPERATOR,
  NAMED_ARG,
  NOT_BETWEEN_OPERATOR,
  ORDER_BY,
  PARAM,
  PIVOT_QUERY,
  QUANTIFIED_OPERATOR,
  SAMPLE_CLAUSE,
  SCALAR_SUBQUERY,
  SELECT_CLAUSE,
  SELECT_QUERY,
  SET_OPERATION,
  SLICE,
  SUBSCRIPT,
  TABLE_REF,
  TUPLE,
  UNARY_OPERATOR,
  UNARY_POSTFIX_OPERATOR,
  UNNEST,
  VALUES,
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
      // custom node types provide their own handling
      // pass the visitor through to apply to child nodes
      return node.toString(this);
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
      case ALL: return this.visitAll;
      case BETWEEN_OPERATOR: return this.visitBetween;
      case BINARY_OPERATOR: return this.visitBinary;
      case CASE: return this.visitCase;
      case CAST: return this.visitCast;
      case COLLATE: return this.visitCollate;
      case COLUMN_PARAM: return this.visitColumnParam;
      case COLUMN_REF: return this.visitColumnRef;
      case COLUMNS: return this.visitColumns;
      case CREATE_QUERY: return this.visitCreateQuery;
      case CREATE_SCHEMA_QUERY: return this.visitCreateSchemaQuery;
      case DESCRIBE_QUERY: return this.visitDescribeQuery;
      case EXPRESSION: return this.visitExpression;
      case FRAGMENT: return this.visitFragment;
      case FROM_CLAUSE: return this.visitFromClause;
      case FUNCTION: return this.visitFunction;
      case IN_OPERATOR: return this.visitIn;
      case INTERVAL: return this.visitInterval;
      case JOIN_CLAUSE: return this.visitJoinClause;
      case LAMBDA: return this.visitLambda;
      case LAMBDA_VAR: return this.visitLambdaVar;
      case LIST: return this.visitList;
      case LITERAL: return this.visitLiteral;
      case LOGICAL_OPERATOR: return this.visitLogicalOperator;
      case NAMED_ARG: return this.visitNamedArg;
      case NOT_BETWEEN_OPERATOR: return this.visitNotBetween;
      case ORDER_BY: return this.visitOrderBy;
      case PARAM: return this.visitParam;
      case PIVOT_QUERY: return this.visitPivotQuery;
      case QUANTIFIED_OPERATOR: return this.visitQuantified;
      case SAMPLE_CLAUSE: return this.visitSampleClause;
      case SCALAR_SUBQUERY: return this.visitScalarSubquery;
      case SELECT_CLAUSE: return this.visitSelectClause;
      case SELECT_QUERY: return this.visitSelectQuery;
      case SET_OPERATION: return this.visitSetOperation;
      case SLICE: return this.visitSlice;
      case SUBSCRIPT: return this.visitSubscript;
      case TABLE_REF: return this.visitTableRef;
      case TUPLE: return this.visitTuple;
      case UNARY_OPERATOR: return this.visitUnary;
      case UNARY_POSTFIX_OPERATOR: return this.visitUnaryPostfix;
      case UNNEST: return this.visitUnnest;
      case VALUES: return this.visitValues;
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
  mapToString(nodes: SQLNode[]): string[] {
    return nodes.map(node => this.toString(node));
  }

  // Abstract methods that must be implemented by concrete visitors
  abstract visitAggregate(node: AggregateNode): string;
  abstract visitAll(node: AllNode): string;
  abstract visitBetween(node: BetweenOpNode): string;
  abstract visitBinary(node: BinaryOpNode): string;
  abstract visitCase(node: CaseNode): string;
  abstract visitCast(node: CastNode): string;
  abstract visitCollate(node: CollateNode): string;
  abstract visitColumnParam(node: ColumnParamNode): string;
  abstract visitColumnRef(node: ColumnRefNode): string;
  abstract visitColumns(node: ColumnsNode): string;
  abstract visitCreateQuery(node: CreateQuery): string;
  abstract visitCreateSchemaQuery(node: CreateSchemaQuery): string;
  abstract visitDescribeQuery(node: DescribeQuery): string;
  abstract visitExpression(node: ExprNode): string;
  abstract visitFragment(node: FragmentNode): string;
  abstract visitFromClause(node: FromClauseNode): string;
  abstract visitFunction(node: FunctionNode): string;
  abstract visitIn(node: InOpNode): string;
  abstract visitInterval(node: IntervalNode): string;
  abstract visitJoinClause(node: JoinNode): string;
  abstract visitLambda(node: LambdaNode): string;
  abstract visitLambdaVar(node: LambdaVarNode): string;
  abstract visitList(node: ListNode): string;
  abstract visitLiteral(node: LiteralNode): string;
  abstract visitLogicalOperator(node: LogicalOpNode<ExprNode>): string;
  abstract visitNamedArg(node: NamedArgNode): string;
  abstract visitNotBetween(node: NotBetweenOpNode): string;
  abstract visitOrderBy(node: OrderByNode): string;
  abstract visitParam(node: ParamNode): string;
  abstract visitPivotQuery(node: PivotQuery): string;
  abstract visitQuantified(node: QuantifiedOpNode): string;
  abstract visitSampleClause(node: SampleClauseNode): string;
  abstract visitScalarSubquery(node: ScalarSubqueryNode): string;
  abstract visitSelectClause(node: SelectClauseNode): string;
  abstract visitSelectQuery(node: SelectQuery): string;
  abstract visitSetOperation(node: SetOperation): string;
  abstract visitSlice(node: SliceNode): string;
  abstract visitSubscript(node: SubscriptNode): string;
  abstract visitTableRef(node: TableRefNode): string;
  abstract visitTuple(node: TupleNode): string;
  abstract visitUnary(node: UnaryOpNode): string;
  abstract visitUnaryPostfix(node: UnaryPostfixOpNode): string;
  abstract visitUnnest(node: UnnestNode): string;
  abstract visitValues(node: ValuesNode): string;
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
