import { asColumn } from './ref.js';

export class Cast {
  constructor(expr, type, parens, columns) {
    this.expr = expr;
    this.type = type;
    this.parens = parens;
    this.columns = columns || [];
  }

  get label() {
    return `cast(${this.expr.label} as ${this.type})`;
  }

  get aggregate() {
    return this.expr.aggregate;
  }

  toString() {
    return this.parens
      ? `(${this.expr})::${this.type}`
      : `${this.expr}::${this.type}`;
  }
}

export function cast(expr, type, parens = true) {
  return new Cast(expr, type, parens, asColumn(expr).columns);
}
