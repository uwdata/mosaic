export class Cast {
  constructor(expr, type) {
    this.expr = expr;
    this.type = type;
  }

  toString() {
    return `(${this.expr})::${this.type}`;
  }
}

export const cast = (expr, type) => new Cast(expr, type);
