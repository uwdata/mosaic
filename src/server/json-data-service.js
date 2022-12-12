import {
  from,
  ref,
  isInRange,
  startsWith,
  endsWith,
  contains,
  regexp,
  isNotNull
} from '../query/index.js';
import * as transforms from './transforms/index.js';

export class JSONDataService {
  constructor(sqlDatabase) {
    this.sqlDatabase = sqlDatabase;
  }

  async query(jsonQuery) {
    const sql = jsonToSQL(jsonQuery);
    console.log('JSON', JSON.stringify(jsonQuery, 0, 2));
    console.log('SQL', sql);
    return this.sqlDatabase.query(sql);
  }
}

function jsonToSQL(q) {
  const sql = from(q.from);
  const select = {};
  const dims = [];
  let group = false;

  // TODO: support more than conjunction
  if (q.where) {
    const predicate = and(q.where);
    if (predicate.length) {
      sql.where(predicate);
    }
  }

  for (const [key, c] of Object.entries(q.select)) {
    const { aggregate, transform, field, value } = c;
    const f = ref(key);
    if (aggregate) {
      group = true;
      const arg = (c.distinct ? 'DISTINCT ' : '') + (field || '');
      const filter = c.filter ? ` FILTER (${c.filter})` : '';
      select[key] = `${aggregate}(${arg})${filter}`;
    } else if (transform) {
      dims.push(f);
      transforms[transform](q, sql, select, key, c);
    } else if (field) {
      dims.push(f);
      const arg = (c.distinct ? 'DISTINCT ' : '') + (field || '');
      select[key] = arg;
    } else if (value !== undefined) {
      // skip, nothing to do
    } else {
      throw new Error(`Unrecognized channel entry: ${JSON.stringify(c)}`);
    }
  }
  sql.select(select);

  if (group) {
    sql.groupby(dims);
  }

  if (q.order) {
    sql.orderby(q.order.map(o => ref(o.field) + (o.desc ? ' DESC' : '')));
  }

  let query = sql.toString();
  (q.transform || []).forEach(spec => {
    const tx = transforms[spec.type];
    if (tx) {
      query = tx(spec, query, q);
    } else {
      console.error(`Unrecognized transform: ${spec.type}`);
    }
  });

  return query;
}

function and(clauses) {
  return clauses
    .map(c => clause(c)).filter(x => x)
    .join(' AND ');
}

function clause(c) {
  if (c.value == null) return null;
  switch (c.type) {
    case 'and':
      return and(c.value); // TODO: parens?
    case 'notnull':
      return isNotNull(ref(c.field));
    case 'range':
      return isInRange(ref(c.field), c.value);
    case 'prefix':
      return startsWith(ref(c.field), c.value);
    case 'suffix':
      return endsWith(ref(c.field), c.value);
    case 'contains':
      return contains(ref(c.field), c.value);
    case 'regexp':
      return regexp(ref(c.field), c.value);
    default:
      throw new Error(`Unsupported clause: ${JSON.stringify(clause).slice(0, 50)}`);
  }
}
