import { literalToSQL } from './to-sql.js';

export class Literal {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return literalToSQL(this.value);
  }
}

export const literal = value => new Literal(value);
