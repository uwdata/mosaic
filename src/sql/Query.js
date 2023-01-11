import { asColumn, asRelation, isColumnRefFor, Ref } from './ref.js';

export class Query {

  static select(...expr) {
    return new Query().select(...expr);
  }

  static from(...expr) {
    return new Query().from(...expr);
  }

  static with(...expr) {
    return new Query().with(...expr);
  }

  static union(...queries) {
    return new SetOperation('UNION', queries.flat());
  }

  static unionAll(...queries) {
    return new SetOperation('UNION ALL', queries.flat());
  }

  static intersect(...queries) {
    return new SetOperation('INTERSECT', queries.flat());
  }

  static except(...queries) {
    return new SetOperation('EXCEPT', queries.flat());
  }

  constructor() {
    this.query = {
      with: [],
      select: [],
      from: [],
      where: [],
      groupby: [],
      having: [],
      orderby: []
    };
  }

  clone() {
    const q = new Query();
    q.query = { ...this.query };
    return q;
  }

  with(...expr) {
    const { query } = this;
    if (expr.length === 0) {
      return query.with;
    } else {
      const list = [];
      expr.flat().forEach(e => {
        if (e == null) {
          // do nothing
        } else if (e.as && e.query) {
          list.push(e);
        } else {
          for (const as in e) {
            list.push({ as, query: e[as] });
          }
        }
      });
      query.with = query.with.concat(list);
      return this;
    }
  }

  select(...expr) {
    const { query } = this;
    if (expr.length === 0) {
      return query.select;
    } else {
      const list = [];
      expr.flat().forEach(e => {
        if (e == null) {
          // do nothing
        } else if (typeof e === 'string') {
          list.push({ as: e, expr: asColumn(e) });
        } else if (e instanceof Ref) {
          list.push({ as: e.column, expr: e });
        } else if (Array.isArray(e)) {
          list.push({ as: e[0], expr: e[1] });
        } else {
          for (const as in e) {
            list.push({ as: unquote(as), expr: asColumn(e[as]) });
          }
        }
      });
      query.select = query.select.concat(list);
      return this;
    }
  }

  $select(...expr) {
    this.query.select = [];
    return this.select(...expr);
  }

  distinct(value = true) {
    this.query.distinct = !!value;
    return this;
  }

  from(...expr) {
    const { query } = this;
    if (expr.length === 0) {
      return query.from;
    } else {
      const list = [];
      expr.flat().forEach(e => {
        if (e == null) {
          // do nothing
        } else if (typeof e === 'string') {
          list.push({ as: e, from: asRelation(e) });
        } else if (e instanceof Ref) {
          list.push({ as: e.table, from: e });
        } else if (isQuery(e) || Object.hasOwn(e, 'toString')) {
          list.push({ from: e });
        } else if (Array.isArray(e)) {
          list.push({ as: e[0], from: e[1] });
        } else {
          for (const as in e) {
            list.push({ as: unquote(as), from: asRelation(e[as]) });
          }
        }
      });
      query.from = query.from.concat(list);
      return this;
    }
  }

  $from(...expr) {
    this.query.from = [];
    return this.from(...expr);
  }

  sample(value) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.sample;
    } else {
      let spec = value;
      if (typeof value === 'number') {
        spec = value > 0 && value < 1
            ? { perc: 100 * value }
            : { rows: Math.round(value) };
      }
      query.sample = spec;
      return this;
    }
  }

  where(...expr) {
    const { query } = this;
    if (expr.length === 0) {
      return query.where;
    } else {
      query.where = query.where.concat(
        expr.flat().filter(x => x)
      );
      return this;
    }
  }

  $where(...expr) {
    this.query.where = [];
    return this.where(...expr);
  }

  groupby(...expr) {
    const { query } = this;
    if (expr.length === 0) {
      return query.groupby;
    } else {
      query.groupby = query.groupby.concat(
        expr.flat().filter(x => x).map(asColumn)
      );
      return this;
    }
  }

  having(...expr) {
    const { query } = this;
    if (expr.length === 0) {
      return query.having;
    } else {
      query.having = query.having.concat(
        expr.flat().filter(x => x)
      );
      return this;
    }
  }

  orderby(...expr) {
    const { query } = this;
    if (expr.length === 0) {
      return query.orderby;
    } else {
      query.orderby = query.orderby.concat(
        expr.flat().filter(x => x).map(asColumn)
      );
      return this;
    }
  }

  limit(value) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.limit;
    } else {
      query.limit = Number.isFinite(value) ? value : undefined;
      return this;
    }
  }

  offset(value) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.offset;
    } else {
      query.offset = Number.isFinite(value) ? value : undefined;
      return this;
    }
  }

  get subqueries() {
    return this.query.from.map(({ from }) => from).filter(f => isQuery(f));
  }

  toString() {
    const {
      select, distinct, from, sample, where, groupby,
      having, orderby, limit, offset, with: cte
    } = this.query;

    const sql = [];

    // WITH
    if (cte.length) {
      const list = cte.map(({ as, query })=> `"${as}" AS (${query})`);
      sql.push(`WITH ${list.join(', ')}`);
    }

    // SELECT
    const sels = select.map(
      ({ as, expr }) => isColumnRefFor(expr, as) && !expr.table
        ? `${expr}`
        : `${expr} AS "${as}"`
    );
    sql.push(`SELECT${distinct ? ' DISTINCT' : ''} ${sels.join(', ')}`);

    // FROM
    const rels = from.map(({ as, from }) => {
      const rel = isQuery(from) ? `(${from})` : `${from}`;
      return !as || as === from.table ? rel : `${rel} AS "${as}"`;
    });
    sql.push(`FROM ${rels.join(', ')}`);

    // SAMPLE
    if (sample) {
      const { rows, perc, method, seed } = sample;
      const size = rows ? `${rows} ROWS` : `${perc} PERCENT`;
      const how = method ? ` (${method}${seed != null ? `, ${seed}` : ''})` : '';
      sql.push(`USING SAMPLE ${size}${how}`);
    }

    // WHERE
    if (where.length) {
      const clauses = where.map(String).filter(x => x).join(' AND ');
      if (clauses) sql.push(`WHERE ${clauses}`);
    }

    // GROUP BY
    if (groupby.length) {
      sql.push(`GROUP BY ${groupby.join(', ')}`);
    }

    // HAVING
    if (having.length) {
      const clauses = having.map(String).filter(x => x).join(' AND ');
      if (clauses) sql.push(`HAVING ${clauses}`);
    }

    // ORDER BY
    if (orderby.length) {
      sql.push(`ORDER BY ${orderby.join(', ')}`);
    }

    // LIMIT
    if (Number.isFinite(limit)) {
      sql.push(`LIMIT ${limit}`);
    }

    // OFFSET
    if (Number.isFinite(offset)) {
      sql.push(`OFFSET ${offset}`);
    }

    return sql.join(' ');
  }
}

export class SetOperation {
  constructor(op, queries) {
    this.op = op;
    this.subqueries = queries;
    this.query = { orderby: [] };
  }

  orderby(...expr) {
    const { query } = this;
    if (expr.length === 0) {
      return query.orderby;
    } else {
      query.orderby = query.orderby.concat(
        expr.flat().filter(x => x).map(asColumn)
      );
      return this;
    }
  }

  limit(value) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.limit;
    } else {
      query.limit = Number.isFinite(value) ? value : undefined;
      return this;
    }
  }

  offset(value) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.offset;
    } else {
      query.offset = Number.isFinite(value) ? value : undefined;
      return this;
    }
  }

  toString() {
    const { op, subqueries, query: { orderby, limit, offset } } = this;

    const sql = [ subqueries.join(` ${op} `) ];

    // ORDER BY
    if (orderby.length) {
      sql.push(`ORDER BY ${orderby.join(', ')}`);
    }

    // LIMIT
    if (Number.isFinite(limit)) {
      sql.push(`LIMIT ${limit}`);
    }

    // OFFSET
    if (Number.isFinite(offset)) {
      sql.push(`OFFSET ${offset}`);
    }

    return sql.join(' ');
  }
}

export function isQuery(value) {
  return value instanceof Query || value instanceof SetOperation;
}

function unquote(s) {
  return isDoubleQuoted(s) ? s.slice(1, -1) : s;
}

function isDoubleQuoted(s) {
  return s[0] === '"' && s[s.length-1] === '"';
}
