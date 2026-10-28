// oxlint-disable no-use-before-define
import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { OPTIONS } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { JSONValue } from './ASTNode.js';
import { ASTNode } from './ASTNode.js';
import type { LiteralNode } from './LiteralNode.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { IncludeNode } from './SelectionNode.js';

// oxlint-disable-next-line typescript/no-explicit-any
type Spec = Record<string, any>;
type Node = ParamRefNode | LiteralNode<JSONValue> | IncludeNode;
type Instantiate = ReturnType<Node['instantiate']>;

export function parseOptions(spec: Spec, ctx: ParseContext): OptionsNode {
  const options: Record<string, Node> = {};
  // oxlint-disable-next-line guard-for-in
  for (const key in spec) {
    options[key] = ctx.maybeSelection(spec[key]);
  }
  return new OptionsNode(options);
}

/* TODO: @dangotbanned: `OptionsNode` is a pretty large soundness hole
 * but is depended on by too many (currently untyped) things to fix right now.
 * - Some cases can work with (very complex) type manipulation
 * - Others seem too dynamic to model https://github.com/uwdata/mosaic/blob/09e0607b16d8bfd5ae3583a154877c18a0871e97/packages/vgplot/spec/src/ast/SelectionNode.js#L6-L15
 */
export class OptionsNode extends ASTNode<Record<string, Instantiate>, string, Spec> {
  readonly options: Record<string, Node>;
  constructor(options: Record<string, Node>) {
    super(OPTIONS);
    this.options = options;
  }

  filter(predicate: (key: string, value: Node) => boolean): OptionsNode {
    const opt = Object.fromEntries(
      Object.entries(this.options).filter(([key, value]) => predicate(key, value)),
    );
    return new OptionsNode(opt);
  }

  instantiate(ctx: InstantiateContext): Record<string, Instantiate> {
    const { options } = this;
    const opt: Record<string, Instantiate> = {};
    // oxlint-disable-next-line guard-for-in
    for (const key in options) {
      opt[key] = options[key].instantiate(ctx);
    }
    return opt;
  }

  codegen(ctx: CodegenContext): string {
    const { options } = this;
    const opt: string[] = [];
    // oxlint-disable-next-line guard-for-in
    for (const key in options) {
      opt.push(`${key}: ${options[key].codegen(ctx)}`);
    }
    return opt.length ? `{${ctx.maybeLineWrap(opt)}}` : '';
  }

  toJSON(): Spec {
    const { options } = this;
    const opt: Spec = {};
    // oxlint-disable-next-line guard-for-in
    for (const key in options) {
      opt[key] = options[key].toJSON();
    }
    return opt;
  }
}
