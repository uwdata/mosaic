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

export class DataService {
  constructor(db) {
    this.db = db;
    this.running = false;
    this.queue = [];
  }

  lock() {
    if (this.running) {
      return new Promise((resolve) => this.queue.push(resolve));
    } else {
      this.running = true;
    }
  }

  unlock() {
    this.running = this.queue.length > 0;
    if (this.running) {
      this.queue.shift()();
    }
  }

  pragma(command) {
    return this.db.query(`PRAGMA ${command}`);
  }

  query(jsonQuery) {
    return this.db.query(sqlQuery(jsonQuery));
  }

  arrowBuffer(jsonQuery) {
    return this.db.arrowBuffer(sqlQuery(jsonQuery));
  }

  arrowStream(jsonQuery) {
    return this.db.arrowStream(sqlQuery(jsonQuery));
  }
}

function sqlQuery(jsonQuery) {
  console.log('JSON', JSON.stringify(jsonQuery, 0, 2));
  const sql = jsonToSQL(jsonQuery);
  console.log('SQL', sql);
  return sql;
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
      if (aggregate === 'count') {
        select[key] += '::DOUBLE';
      }
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

  if (q.limit) {
    sql.limit(q.limit);
  }

  if (q.offset) {
    sql.offset(q.offset);
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
  const c = clauses.map(c => clause(c)).filter(x => x);
  return c.length > 1 ? `(${c.join(' AND ')})` : c[0] || '';
}

function or(clauses) {
  const c = clauses.map(c => clause(c)).filter(x => x);
  return c.length > 1 ? `(${c.join(' OR ')})` : c[0] || '';
}

function clause(c) {
  if (c.value == null) return null;
  switch (c.type) {
    case 'and':
      return and(c.value); // TODO: parens?
    case 'or':
      return or(c.value);
    case 'equals':
      return `${ref(c.field)} = ${format(c.value)}`;
    case 'notnull':
      return isNotNull(ref(c.field));
    case 'range':
      return isInRange(ref(c.field), formatRange(c.value));
    case 'prefix':
      return startsWith(ref(c.field), format(c.value));
    case 'suffix':
      return endsWith(ref(c.field), format(c.value));
    case 'contains':
      return contains(ref(c.field), format(c.value));
    case 'regexp':
      return regexp(ref(c.field), format(c.value));
    default:
      throw new Error(`Unsupported clause: ${JSON.stringify(c).slice(0, 50)}`);
  }
}

function format(value) {
  let d;
  switch (typeof value) {
    case 'string':
      if (value.endsWith('Z') && !Number.isNaN(+(d = new Date(value)))) {
        // TODO: date vs. timestamp
        return `MAKE_DATE(${d.getFullYear()}, ${d.getMonth()+1}, ${d.getDate()})`;
      } else {
        return `'${value}'`;
      }
    case 'boolean':
      return value ? 'TRUE' : 'FALSE';
    case 'object':
      throw new Error('Unsupported value type'); // TODO
    default:
      return value;
  }
}

function formatRange(range) {
  return range.map(format);
}
