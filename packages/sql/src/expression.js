import { asColumn } from './ref.js';
import { literalToSQL } from './to-sql.js';

export const isParamLike = e => typeof e?.addEventListener === 'function';

export function isExpression(e) {
  return e instanceof SQLExpression;
}

export class SQLExpression {
  constructor(sql, columns, label) {
    this.expr = sql;
    this.label = label;
    this.columns = columns || [];
  }

  toString() {
    return `${this.expr}`;
  }
}

export class ParameterizedSQLExpression extends SQLExpression {
  constructor(parts, columns, label) {
    const paramSet = new Set;
    for (const part of parts) {
      if (isParamLike(part)) paramSet.add(part);
    }
    paramSet.forEach(param => {
      param.addEventListener('value', () => this.update());
    });
    super(parts, columns, label);
  }

  toString() {
    return this.expr
      .map(p => isParamLike(p) ? literalToSQL(p.value) : p)
      .join('');
  }

  addEventListener(type, callback) {
    const map = this.map || (this.map = new Map());
    const set = map.get(type) || (map.set(type, new Set), map.get(type));
    set.add(callback);
  }

  update() {
    const set = this.map?.get('value');
    if (set?.size) {
      return Promise.allSettled(
        Array.from(set).map(callback => callback(this))
      );
    }
  }
}

export function exprParams(parts, columns, label) {
  return new ParameterizedSQLExpression(parts, columns, label);
}

export function expr(sql, columns, label) {
  return new SQLExpression(sql, columns, label);
}

export function desc(e) {
  return Object.assign(
    expr(`${asColumn(e)} DESC NULLS LAST`, e?.columns, e?.label),
    { desc: true }
  );
}

export function transform(func, label) {
  return value => expr(func(value), asColumn(value).columns, label);
}
