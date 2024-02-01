import { ASTNode } from './ASTNode.js';
import { ATTRIBUTE, FIXED, LITERAL } from '../constants.js';

export function parseAttribute(key, value, ctx) {
  if (!ctx.plot?.attributes?.has(key)) {
    ctx.error(`Unrecognized attribute: ${key}`);
  }
  return new PlotAttributeNode(
    key,
    value === FIXED ? new FixedAttributeNode : ctx.maybeParam(value)
  );
}

export class PlotAttributeNode extends ASTNode {
  constructor(name, value) {
    super(ATTRIBUTE);
    this.name = name;
    this.value = value;
  }

  instantiate(ctx) {
    const { name, value } = this;
    const fn = ctx.api[name];
    return fn(value.instantiate(ctx));
  }

  codegen(ctx) {
    const { name, value } = this;
    return `${ctx.tab()}${ctx.ns()}${name}(${value.codegen(ctx)})`;
  }

  toJSON() {
    const { name, value } = this;
    return { [name]: value.toJSON() };
  }
}

export class FixedAttributeNode extends ASTNode {
  constructor() {
    super(LITERAL);
    this.value = FIXED;
  }

  instantiate(ctx) {
    return ctx.api[FIXED];
  }

  codegen(ctx) {
    return `${ctx.ns()}${FIXED}`;
  }

  toJSON() {
    return { [this.name]: FIXED };
  }
}
