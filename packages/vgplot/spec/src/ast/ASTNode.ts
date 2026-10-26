// oxlint-disable typescript/no-explicit-any typescript/no-invalid-void-type
import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';

export type JSONValue =
  | null
  | boolean
  | number
  | string
  | JSONValue[]
  | {
      [key: string]: JSONValue;
    };

/** Abstract base class for Mosaic spec AST nodes. */
// oxlint-disable-next-line typescript/no-explicit-any
export abstract class ASTNode<I = any, C extends string | void = string | void, J = JSONValue> {
  readonly type: string;
  readonly children: ASTNode[] | null;

  // oxlint-disable-next-line unicorn/no-null
  constructor(type: string, children: ASTNode<any, any, any>[] | null = null) {
    this.type = type;
    this.children = children;
  }

  /** Instantiate this AST node to use in a live web application. */
  abstract instantiate(ctx: InstantiateContext): I;

  /** Generate ESM code for this AST node. */
  abstract codegen(ctx: CodegenContext): C;

  /** Convert this AST node into JSON specification format. */
  abstract toJSON(): J;
}
