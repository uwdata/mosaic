import { Query, count, max, min, isNull } from '../sql/index.js';
import { jsType } from './util/js-type.js';

const object = () => Object.create(null);

export class Catalog {
  constructor(mc) {
    this.mc = mc;
    this.clear();
  }

  clear() {
    this.tables = object();
    this.fields = object();
  }

  async tableInfo(table) {
    const cache = this.tables;
    if (cache[table]) {
      return cache[table];
    }

    const q = this.mc.query(
      `PRAGMA table_info('${table}')`,
      { type: 'json' }
    );

    return (cache[table] = q.then(result => {
      const columns = object();
      for (const entry of result) {
        columns[entry.name] = { ...entry, jstype: jsType(entry.type) };
      }
      return columns;
    }));
  }

  async fieldInfo(table, column) {
    const cache = this.fields;
    const key = `${table}::${column}`;
    if (cache[key]) {
      return cache[key];
    }

    const info = await this.tableInfo(table);
    const colInfo = info[column];

    // column does not exist
    if (colInfo == null) return;

    const q = this.mc.query(
      Query.from(table).select({
        rows: count(),
        nulls: count().where(isNull(column)),
        values: count(column).distinct(),
        min: min(column),
        max: max(column)
      })
    );

    return (cache[key] = q.then(result => {
      const stats = result[Symbol.iterator]().next().value;
      return { table, column, type: colInfo.jstype, ...stats };
    }));
  }

  async queryFields(fields) {
    const list = await resolveFields(this, fields);
    const data = await Promise.all(
      list.map(f => this.fieldInfo(f.table, f.column))
    )
    return data.filter(x => x);
  }
}

async function resolveFields(catalog, list) {
  if (list.length === 1 && list[0].column === '*') {
    const table = list[0].table;
    const info = await catalog.tableInfo(table);
    return Object.keys(info).map(column => ({ table, column }));
  } else {
    return list;
  }
}
