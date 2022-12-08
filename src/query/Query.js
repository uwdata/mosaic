export class Query {
  constructor() {
    this._with = null;
    this._from = {};
    this._select = {};
    this._where = [];
    this._groupby = [];
    this._orderby = [];
    this._limit = null;
    this._on = []; // TODO support joins
  }

  clone() {
    const q = new Query();
    q._with = this._with;
    q._from = this._from;
    q._on = this._on;
    q._select = this._select;
    q._where = this._where;
    q._groupby = this._groupby;
    q._orderby = this._orderby;
    q._limit = this._limit;
    return q;
  }

  with(...queries) {
    this._with = Object.assign({}, ...queries.flat());
    return this;
  }

  select(...fields) {
    this._select = asObject(fields.flat());
    return this;
  }

  from(...tables) {
    this._from = asObject(tables.flat());
    return this;
  }

  where(...clauses) {
    this._where = [...this._where, ...clauses.flat()];
    return this;
  }

  filter(query) {
    return query
      ? this.clone().where(query._where)
      : this;
  }

  groupby(...fields) {
    this._groupby = fields.flat();
    return this;
  }

  orderby(...fields) {
    this._orderby = fields.flat();
    return this;
  }

  limit(max) {
    this._limit = max;
    return this;
  }

  toSQL() {
    const { _with, _select, _from, _where, _groupby, _orderby, _limit } = this;
    return (_with ? 'WITH' + cteList(_with) + '\n' : '') +
      'SELECT\n  ' + toAsList(_select, ',\n  ') +
      '\nFROM ' + toAsList(_from) +
      (_where.length ? '\nWHERE\n  ' + toList(_where, ' AND\n  ') : '') +
      (_groupby.length ? '\nGROUP BY ' + toList(_groupby) : '') +
      (_orderby.length ? '\nORDER BY ' + toList(_orderby) : '') +
      (_limit != null ? '\nLIMIT ' + (+_limit) : '');
  }

  toString() {
    return this.toSQL();
  }
}

function cteList(obj) {
  const list = [];
  for (const key in obj) {
    const val = obj[key];
    list.push(`"${key}" AS (${val})`)
  }
  return list.join(',\n');
}

function toAsList(obj, delim = ', ') {
  const list = [];
  for (const key in obj) {
    const val = obj[key];
    if (val === key) {
      list.push(val);
    } else {
      list.push(`${val} AS "${key}"`);
    }
  }
  return list.join(delim);
}

function toList(array, delim = ', ') {
  return array.join(delim);
}

function asObject(args = []) {
  const obj = {};
  args.forEach(arg => {
    const type = typeof arg;
    switch (type) {
      case 'string':
        obj[arg] = arg;
        return;
      case 'object':
        Object.assign(obj, arg);
        return;
      default:
        throw new Error(`Unsupported argument type: ${type}`);
    }
  });
  return obj;
}

