import { expect } from 'vitest';
import { validateExpr, validateQuery } from './validate.js';

interface ValidatingMatchers<R = unknown> {
  /**
   * Assert the SQL expression serializes to `expected` and binds against
   * DuckDB's parser + binder.
   */
  toBeValidExpr(expected: string): Promise<R>;
  /**
   * Assert the SQL query serializes to `expected` and binds against DuckDB's
   * parser + binder.
   */
  toBeValidQuery(expected: string): Promise<R>;
}

declare module 'vitest' {
  // T = any matches Vitest's own Assertion declaration so the interfaces merge.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends ValidatingMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends ValidatingMatchers {}
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
