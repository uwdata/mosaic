import type { InstantiateContext } from '../ast-to-dom.js';
import type { CodegenContext } from '../ast-to-esm.js';
import type { PlotInteractorName } from '../config/plots.js';
import { INTERACTOR, SELECT } from '../constants.js';
import type { ParseContext } from '../parse-spec.js';
import type { PlotInteractor } from '../spec/PlotInteractor.js';
import { ASTNode } from './ASTNode.js';
import type { OptionsNode } from './OptionsNode.js';
import { parseOptions } from './OptionsNode.js';

// oxlint-disable-next-line typescript/no-explicit-any
type Interactor = (plot: any) => void;

export class PlotInteractorNode extends ASTNode<Interactor, PlotInteractor> {
  constructor(
    readonly name: PlotInteractorName,
    readonly options: OptionsNode,
  ) {
    super(INTERACTOR);
  }

  instantiate(ctx: InstantiateContext): Interactor {
    //@ts-expect-error different required arguments
    return ctx.api[this.name](this.options.instantiate(ctx));
  }

  codegen(ctx: CodegenContext): string {
    const opt = this.options.codegen(ctx);
    return `${ctx.tab()}${ctx.ns()}${this.name}(${opt})`;
  }

  toJSON(): PlotInteractor {
    const { name, options } = this;
    //@ts-expect-error overloaded discriminator
    return { [SELECT]: name, ...options.toJSON() };
  }
}

function ensureInteractor(spec: object, ctx: ParseContext): asserts spec is PlotInteractor {
  const name = spec[SELECT];
  if (!(name && ctx.plot.interactors.has(name))) {
    ctx.error(`Unrecognized interactor type: ${name}`, spec);
  }
}

export function parseInteractor(spec: object, ctx: ParseContext): PlotInteractorNode {
  ensureInteractor(spec, ctx);
  const { [SELECT]: name, ...options } = spec;
  //@ts-expect-error Type 'BrushStyles' is not assignable to type '{ [key: string]: JSONValue; }'.
  return new PlotInteractorNode(name, parseOptions(options, ctx));
}
