import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import { OPTIONS } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { JSONValue } from '../spec/Data.js';
import { ASTNode } from './ASTNode.js';

export class OptionsNode extends ASTNode<Record<string, unknown>, Record<string, JSONValue>> {
  constructor(readonly options: Record<string, ASTNode>) {
    super(OPTIONS);
  }

  filter(predicate: (key: unknown, value: unknown) => boolean): OptionsNode {
    const opt = Object.fromEntries(
      Object.entries(this.options).filter(([key, value]) => predicate(key, value)),
    );
    return new OptionsNode(opt);
  }

  instantiate(ctx: InstantiateContext): Record<string, unknown> {
    const { options } = this;
    const opt: Record<string, unknown> = {};
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

  toJSON(): Record<string, JSONValue> {
    const { options } = this;
    const opt: Record<string, JSONValue> = {};
    // oxlint-disable-next-line guard-for-in
    for (const key in options) {
      opt[key] = options[key].toJSON();
    }
    return opt;
  }
}

export function parseOptions(spec: Record<string, JSONValue>, ctx: ParseContext): OptionsNode {
  const options: Record<string, ASTNode> = {};
  // oxlint-disable-next-line guard-for-in
  for (const key in spec) {
    options[key] = ctx.maybeSelection(spec[key]);
  }
  return new OptionsNode(options);
}
