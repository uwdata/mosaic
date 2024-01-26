import { sql } from "./expression";
import { Ref, asColumn } from "./ref";

function visit(
  this: {
    op: string;
    children?: Ref[];
    visit: (callback: (op: string, expr: any) => void) => void;
    a?: string | Ref;
    b?: string | Ref;
    field?: Ref;
    range?: string[];
  },
  callback: (op: string, expr: any) => void
) {
  callback(this.op, this);
  this.children?.forEach((v: any) => v.visit(callback));
}

function logical(op: string, clauses: any[]) {
  const children = clauses.filter((x) => x != null).map(asColumn);
  const strings = children.map((c, i) => (i ? ` ${op} ` : ""));
  if (children.length === 1) {
    strings.push("");
  } else if (children.length > 1) {
    strings[0] = "(";
    strings.push(")");
  }
  return sql(strings, ...children).annotate({ op, children, visit });
}

export const and = (...clauses: any[]) => logical("AND", clauses.flat());
export const or = (...clauses: any[]) => logical("OR", clauses.flat());

const unaryOp = (op: string) => (a: string | Ref) =>
  sql`(${op} ${asColumn(a)})`.annotate({ op, a, visit });

export const not = unaryOp("NOT");

const unaryPostOp = (op: string) => (a: string | Ref) =>
  sql`(${asColumn(a)} ${op})`.annotate({ op, a, visit });

export const isNull = unaryPostOp("IS NULL");
export const isNotNull = unaryPostOp("IS NOT NULL");

const binaryOp = (op: string) => (a: any, b: any) =>
  sql`(${asColumn(a)} ${op} ${asColumn(b)})`.annotate({ op, a, b, visit });

export const eq = binaryOp("=");
export const neq = binaryOp("<>");
export const lt = binaryOp("<");
export const gt = binaryOp(">");
export const lte = binaryOp("<=");
export const gte = binaryOp(">=");
export const isDistinct = binaryOp("IS DISTINCT FROM");
export const isNotDistinct = binaryOp("IS NOT DISTINCT FROM");

function rangeOp(
  op: string,
  a: string | Ref,
  range?: [any, any] | null,
  exclusive?: boolean
) {
  a = asColumn(a);
  const prefix = op.startsWith("NOT ") ? "NOT " : "";
  const expr = !range
    ? sql``
    : exclusive
    ? sql`${prefix}(${range[0]} <= ${a} AND ${a} < ${range[1]})`
    : sql`(${a} ${op} ${range[0]} AND ${range[1]})`;
  return expr.annotate({ op, visit, field: a, range });
}

export const isBetween = (
  a: string | Ref,
  range?: [any, any] | null,
  exclusive?: boolean
) => rangeOp("BETWEEN", a, range, exclusive);
export const isNotBetween = (
  a: string | Ref,
  range?: [any, any] | null,
  exclusive?: boolean
) => rangeOp("NOT BETWEEN", a, range, exclusive);
