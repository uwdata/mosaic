import { isArray } from '../util.js';
import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { InputName } from '../config/inputs.js';
import { FROM, INPUT } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { Menu, Search, Slider, Table } from '../spec/Input.js';
import { ASTNode } from './ASTNode.js';
import type { OptionsNode } from './OptionsNode.js';
import { parseOptions } from './OptionsNode.js';
import { TableRefNode } from './TableRefNode.js';
import type { ParamRefNode } from './ParamRefNode.js';
import type { LiteralNode } from './LiteralNode.js';

type Input = Menu | Search | Slider | Table;

export class InputNode extends ASTNode<HTMLElement, Input> {
  constructor(
    readonly name: InputName,
    readonly options: OptionsNode,
  ) {
    super(INPUT);
  }

  instantiate(ctx: InstantiateContext): HTMLElement {
    return ctx.api[this.name](this.options.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    const opt = this.options.codegen(ctx);
    return `${ctx.tab()}${ctx.ns()}${this.name}(${opt})`;
  }

  toJSON(): Input {
    const { name, options } = this;
    //@ts-expect-error 'from' is required in 'Table', but isn't checked here
    return { [INPUT]: name, ...options.toJSON() };
  }
}

function ensureInput(spec: object, ctx: ParseContext): asserts spec is Input {
  const name = spec[INPUT];
  if (!(name && ctx.inputs.has(name))) {
    ctx.error(`Unrecognized input type: ${name}`, spec);
  }
}

function parseFrom(
  value: string | string[],
  ctx: ParseContext,
): TableRefNode | ParamRefNode | LiteralNode<string> {
  return isArray(value) ? new TableRefNode(value) : ctx.maybeSelection(value);
}

export function parseInput(spec: object, ctx: ParseContext): InputNode {
  ensureInput(spec, ctx);
  const { [INPUT]: name, ...options } = spec;
  return new InputNode(name, parseOptions(options, ctx, { [FROM]: parseFrom }));
}
