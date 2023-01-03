import { asColumn } from './ref.js';
import { toSQL } from './to-sql.js';

function extractColumns(...args) {
  return args.flat().flatMap(arg => arg?.columns || []);
}

export class Compare1 {
  constructor(op, a) {
    this.op = op;
    this.a = asColumn(a);
  }

  get columns() {
    return extractColumns(this.a);
  }

  toString() {
    const { op, a } = this;
    return `(${toSQL(a)} ${op})`;
  }
}

function compare1(op) {
  return a => new Compare1(op, a);
}
export const not = compare1('NOT');
export const isNull = compare1('IS NULL');
export const isNotNull = compare1('IS NOT NULL');

export class Compare2 {
  constructor(op, a, b) {
    this.op = op;
    this.a = asColumn(a);
    this.b = asColumn(b);
  }

  get columns() {
    return extractColumns(this.a, this.b);
  }

  toString() {
    const { op, a, b } = this;
    return `(${toSQL(a)} ${op} ${toSQL(b)})`;
  }
}

function compare2(op) {
  return (a, b) => new Compare2(op, a, b);
}
export const eq = compare2('=');
export const neq = compare2('<>');
export const lt = compare2('<');
export const gt = compare2('>');
export const lte = compare2('<=');
export const gte = compare2('>=');
export const isDistinct = compare2('IS DISTINCT FROM');
export const isNotDistinct = compare2('IS NOT DISTINCT FROM');

export class Range {
  constructor(op, expr, value) {
    this.op = op;
    this.expr = asColumn(expr);
    this.value = value?.map(asColumn);
  }

  get columns() {
    return extractColumns(this.expr, this.value);
  }

  toString() {
    const { op, expr, value } = this;
    if (!value) return '';
    const [a, b] = value;
    return `(${toSQL(expr)} ${op} ${toSQL(a)} AND ${toSQL(b)})`;
  }
}

function range(op) {
  return (a, range) => new Range(op, a, range);
}
export const isBetween = range('BETWEEN'); // XXX TODO rename?
export const isNotBetween = range('NOT BETWEEN');

export class CompareN {
  constructor(op, value) {
    this.op = op;
    this.value = value.map(asColumn);
  }

  get columns() {
    return extractColumns(this.value);
  }

  toString() {
    const { op, value } = this;
    return !value || value.length === 0 ? ''
      : value.length === 1 ? toSQL(value[0])
      : `(${value.map(toSQL).filter(x => x).join(` ${op} `)})`;
  }
}

export function and(...clauses) {
  return new CompareN('AND', clauses.flat());
}

export function or(...clauses) {
  return new CompareN('OR', clauses.flat());
}
