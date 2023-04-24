import { asColumn } from './ref.js';

export class Cast {
  constructor(expr, type) {
    this.expr = asColumn(expr);
    this.type = type;
  }

  get label() {
    return this.expr.label;
  }

  get column() {
    return this.expr.column;
  }

  get columns() {
    return this.expr.columns || [];
  }

  get aggregate() {
    return this.expr.aggregate;
  }

  toString() {
    return `CAST(${this.expr} AS ${this.type})`;
  }
}

export function cast(expr, type) {
  return new Cast(expr, type);
}
