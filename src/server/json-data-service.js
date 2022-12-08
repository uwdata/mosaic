import {
  from,
  ref,
  isInRange,
  startsWith,
  endsWith,
  contains,
  regexp
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

  for (const [key, c] of Object.entries(q.select)) {
    const f = ref(key);
    if (Object.hasOwn(c, 'aggregate')) {
      group = true;
      const arg = (c.distinct ? 'DISTINCT ' : '') + (c.field || '');
      const filter = c.filter ? ` FILTER (${c.filter})` : '';
      select[key] = `${c.aggregate}(${arg})${filter}`;
    } else if (Object.hasOwn(c, 'transform')) {
      if (c.transform === 'bin') {
        dims.push(f);
        select[key] = _bin(c.field, c.min, c.max, c.options);
      }
    } else if (Object.hasOwn(c, 'field')) {
      dims.push(f);
      const arg = (c.distinct ? 'DISTINCT ' : '') + (c.field || '');
      select[key] = arg;
    } else if (Object.hasOwn(c, 'value')) {
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

  // TODO: support more than conjunction
  if (q.where) {
    const predicate = and(q.where);
    if (predicate.length) {
      sql.where(predicate);
    }
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

export function _bin(field, min, max, { steps = 20, offset = 0 } = {}) {
  const delta = `(${field} - ${min})`;
  const span = `(${max} - ${min})`;
  steps = `${steps}::DOUBLE`;
  const off = offset ? '1 + ' : '';
  return `${min} + (${span} / ${steps}) * (${off}FLOOR(${steps} * ${delta} / ${span}))`;
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
