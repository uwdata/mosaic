import {
  AggregateNode,
  CastNode,
  FunctionNode,
  JoinNode,
  SampleClauseNode,
  UnnestNode,
} from "../../index.js";
import { DuckDBCodeGenerator } from "./duckdb.js";

/**
 * BigQuery SQL dialect visitor for converting AST nodes to BigQuery-compatible SQL.
 */
export class BigQueryCodeGenerator extends DuckDBCodeGenerator {
  visitAggregate(node: AggregateNode): string {
    const { filter } = node;
    // TODO: it might be possible to emulate filters using an IF statement
    if (filter) {
      throw new Error(`BigQuery does not support aggregate filters. Node: ${JSON.stringify(node)}`);
    }
    return super.visitAggregate(node);
  }

  visitCast(node: CastNode): string {
    const { expr, cast } = node;
    return `CAST(${this.toString(expr)} AS ${cast})`;
  }

  visitFunction(node: FunctionNode): string {
    const { name, args } = node;
    switch (name) {
      case "epoch_ms":
        return `UNIX_MILLIS(${this.mapToString(args).join(', ')})`;

      case "list_contains":
        return `${this.toString(args[1])} IN UNNEST(${this.toString(args[0])})`;

      case "list_has_all":
        return `(SELECT COUNT(l2) = ARRAY_LENGTH(${this.toString(args[1])}) FROM UNNEST(${this.toString(args[0])}) AS l1 JOIN UNNEST(${this.toString(args[1])}) AS l2 ON l1 = l2)"`;

      case "list_has_any":
        return `EXISTS(SELECT * FROM UNNEST(${this.toString(args[0])}) AS l1 WHERE l1 IN UNNEST(${this.toString(args[1])}))`;

      case "make_date":
        return `$DATE(${this.mapToString(args).join(', ')})`;

      case "time_bucket":
        return `TIMESTAMP_BUCKET(${this.toString(args[0])}, ${this.toString(args[1])})`;

      default:
        return super.visitFunction(node);
    }
  }

  visitJoinClause(node: JoinNode): string {
    const { joinVariant, joinType, sample } = node;

    if (joinVariant !== "REGULAR") {
      throw new Error(`BigQuery does not support (${joinVariant}) joins (variant). Node: ${JSON.stringify(node)}`);
    }

    if (joinType === "SEMI" || joinType === "ANTI") {
      throw new Error(`BigQuery does not support (${joinType}) joins (type). Node: ${JSON.stringify(node)}`);
    }

    if (sample) {
      throw new Error(`BigQuery does not support join sampling (${sample}). Node: ${JSON.stringify(node)}`);
    }

    return super.visitJoinClause(node);
  }

  visitSampleClause(node: SampleClauseNode): string {
    const { size, perc, method, seed } = node;

    if (!perc) {
      throw new Error(`BigQuery does not support row based sampling. Node: ${JSON.stringify(node)}`);
    }

    if (method !== "system") {
      throw new Error(`BigQuery does not support (${method}) sampling. Node: ${JSON.stringify(node)}`);
    }

    if (seed !== null) {
      throw new Error(`BigQuery does not support setting a seed (${seed}) for sampling. Node: ${JSON.stringify(node)}`);
    }

    return `TABLESAMPLE SYSTEM (${size} PERCENT)`;
  }

  visitUnnest(node: UnnestNode): string {
    const { expr, recursive, maxDepth } = node;

    if (recursive) {
      throw new Error(`BigQuery does not support recursive unnesting. Node: ${JSON.stringify(node)}`);
    }

    if (maxDepth != null && maxDepth > 0) {
      throw new Error(`BigQuery does not support max depth when unnesting. Node: ${JSON.stringify(node)}`);
    }

    const args = [this.toString(expr)];

    return `UNNEST(${args.join(", ")})`;
  }
}
