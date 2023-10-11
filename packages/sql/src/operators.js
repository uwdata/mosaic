import { sql } from './expression.js';
import { asColumn } from './ref.js';

function visit(callback) {
  callback(this.op, this);
  this.children?.forEach(v => v.visit(callback));
}

function logical(op, clauses) {
  const children = clauses.filter(x => x != null).map(asColumn);
  const strings = children.map((c, i) => i ? ` ${op} ` : '');
  if (children.length === 1) {
    strings.push('')
  } else if (children.length > 1) {
    strings[0] = '(';
    strings.push(')');
  }
  return sql(strings, ...children).annotate({ op, children, visit });
}

export const and = (...clauses) => logical('AND', clauses.flat());
export const or = (...clauses) => logical('OR', clauses.flat());

const unaryOp = op => a => sql`(${op} ${asColumn(a)})`.annotate({ op, a, visit });

export const not = unaryOp('NOT');

const unaryPostOp = op => a => sql`(${asColumn(a)} ${op})`.annotate({ op, a, visit });

export const isNull = unaryPostOp('IS NULL');
export const isNotNull = unaryPostOp('IS NOT NULL');

const binaryOp = op => (a, b) => sql`(${asColumn(a)} ${op} ${asColumn(b)})`.annotate({ op, a, b, visit });

export const eq = binaryOp('=');
export const neq = binaryOp('<>');
export const lt = binaryOp('<');
export const gt = binaryOp('>');
export const lte = binaryOp('<=');
export const gte = binaryOp('>=');
export const isDistinct = binaryOp('IS DISTINCT FROM');
export const isNotDistinct = binaryOp('IS NOT DISTINCT FROM');

function rangeOp(op, a, range, exclusive) {
  a = asColumn(a);
  const prefix = op.startsWith('NOT ') ? 'NOT ' : '';
  const expr = !range ? sql``
    : exclusive ? sql`${prefix}(${range[0]} <= ${a} AND ${a} < ${range[1]})`
    : sql`(${a} ${op} ${range[0]} AND ${range[1]})`;
  return expr.annotate({ op, visit, field: a, range });
}

export const isBetween = (a, range, exclusive) => rangeOp('BETWEEN', a, range, exclusive);
export const isNotBetween = (a, range, exclusive) => rangeOp('NOT BETWEEN', a, range, exclusive);
