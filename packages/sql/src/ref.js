export class Ref {
  constructor(table, column) {
    if (table) this.table = String(table);
    if (column) this.column = column;
  }

  get columns() {
    return this.column ? [this.column] : [];
  }

  toString() {
    const { table, column } = this;
    if (column) {
      const col = column === '*' ? column : `"${column}"`;
      return (table ? `"${table}".` : '') + col;
    } else {
      return `"${table}"`;
    }
  }
}

export function isColumnRefFor(ref, name) {
  return ref instanceof Ref && ref.column === name;
}

export function asColumn(value) {
  return typeof value === 'string' ? column(value) : value;
}

export function asRelation(value) {
  return typeof value === 'string' ? relation(value) : value;
}

export function relation(name) {
  return new Ref(name);
}

export function column(table, column) {
  return arguments.length === 1
    ? new Ref(null, table)
    : new Ref(table, column);
}

export function all(table) {
  return new Ref(table, '*');
}

export function desc(expr) {
  expr = asColumn(expr);
  return {
    expr,
    desc: true,
    toString: () => `${expr} DESC NULLS LAST`,
    get columns() { return expr.columns?.() || []; }
  };
}

export function expr(sql, columns, label) {
  return {
    expr: sql,
    label,
    toString: () => `${sql}`,
    get columns() { return columns || []; }
  };
}

export function transform(func, label) {
  return value => expr(
    func(value),
    asColumn(value).columns,
    label
  )
}
