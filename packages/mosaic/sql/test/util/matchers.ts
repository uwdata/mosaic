import { expect } from 'vitest';
import { validateExpr, validateQuery } from './validate.js';
import type {
  ExprNode, Query, CreateQuery, CreateSchemaQuery, DescribeQuery
} from '../../src/index.js';

type SqlStatement = Query | CreateQuery | CreateSchemaQuery | DescribeQuery;

interface ValidatingMatchers<T> {
  /**
   * Assert the SQL expression serializes to `expected` and binds against
   * DuckDB's parser + binder.
   */
  // Query extends ExprNode, so SqlStatement is checked first to keep queries
  // out of toBeValidExpr.
  toBeValidExpr: [T] extends [SqlStatement]
    ? never
    : [T] extends [ExprNode]
      ? (expected: string) => Promise<void>
      : never;
  /**
   * Assert the SQL query serializes to `expected` and binds against DuckDB's
   * parser + binder.
   */
  toBeValidQuery: [T] extends [SqlStatement]
    ? (expected: string) => Promise<void>
    : never;
}

declare module 'vitest' {
  // T = any matches Vitest's own Assertion declaration so the interfaces merge.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends ValidatingMatchers<T> {}
}

expect.extend({
  async toBeValidExpr(received, expected: string) {
    const text = String(received);
    if (text !== expected) {
      return {
        pass: false,
        message: () =>
          `expected expression to serialize to\n  ${expected}\nbut got\n  ${text}`,
        actual: text,
        expected
      };
    }
    try {
      await validateExpr(received);
    } catch (err) {
      return {
        pass: false,
        message: () => `expression ${text} is not valid SQL: ${(err as Error).message}`
      };
    }
    return { pass: true, message: () => `expected expression not to be ${expected}` };
  },

  async toBeValidQuery(received, expected: string) {
    const text = String(received);
    if (text !== expected) {
      return {
        pass: false,
        message: () =>
          `expected query to serialize to\n  ${expected}\nbut got\n  ${text}`,
        actual: text,
        expected
      };
    }
    try {
      await validateQuery(received);
    } catch (err) {
      return {
        pass: false,
        message: () => `query ${text} is not valid SQL: ${(err as Error).message}`
      };
    }
    return { pass: true, message: () => `expected query not to be ${expected}` };
  }
});
