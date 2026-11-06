import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { JSONValue } from '../spec/Data.js';

/** Abstract base class for Mosaic spec AST nodes. */
// oxlint-disable-next-line typescript/no-explicit-any
export abstract class ASTNode<I = any, J = JSONValue> {
  constructor(readonly type: string) {}

  /** Instantiate this AST node to use in a live web application. */
  abstract instantiate(ctx: InstantiateContext): I;

  /** Generate ESM code for this AST node. */
  abstract codegen(ctx: CodegenContext): string;

  /** Convert this AST node into JSON specification format. */
  abstract toJSON(): J;
}
// oxlint-disable-next-line typescript/no-explicit-any
export abstract class ParentNode<I = any, J = JSONValue> extends ASTNode<I, J> {
  constructor(
    readonly type: string,
    // oxlint-disable-next-line typescript/no-explicit-any
    readonly children: ASTNode<any, any>[],
  ) {
    super(type);
  }
}
