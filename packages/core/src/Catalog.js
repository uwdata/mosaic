import { jsType } from './util/js-type.js';
import { summarize } from './util/summarize.js';

const object = () => Object.create(null);

export class Catalog {
  constructor(coordinator) {
    this.mc = coordinator;
    this.clear();
  }

  clear() {
    this.tables = object();
  }

  tableInfo(table) {
    const cache = this.tables;
    if (cache[table]) {
      return cache[table];
    }

    const infoPromise = getTableInfo(this.mc, table)
      .catch(err => { cache[table] = null; throw err; });

    return (cache[table] = infoPromise);
  }

  async fieldInfo({ table, column, stats }) {
    const tableInfo = await this.tableInfo(table);
    const colInfo = tableInfo[column];

    // column does not exist
    if (colInfo == null) return;

    // no need for summary statistics
    if (!stats?.length) return colInfo;

    const result = await this.mc.query(
      summarize(colInfo, stats),
      { persist: true }
    );
    const info = { ...colInfo, ...(Array.from(result)[0]) };

    // coerce bigint to number
    for (const key in info) {
      const value = info[key];
      if (typeof value === 'bigint') {
        info[key] = Number(value);
      }
    }

    return info;
  }

  async queryFields(fields) {
    const list = await resolveFields(this, fields);
    const data = await Promise.all(list.map(f => this.fieldInfo(f)));
    return data.filter(x => x);
  }
}

async function getTableInfo(mc, table) {
  const result = await mc.query(
    `DESCRIBE "${table}"`,
    { type: 'json', cache: false }
  );

  const columns = object();
  for (const entry of result) {
    columns[entry.column_name] = {
      table,
      column: entry.column_name,
      sqlType: entry.column_type,
      type: jsType(entry.column_type),
      nullable: entry.null === 'YES'
    };
  }

  return columns;
}

async function resolveFields(catalog, list) {
  return list.length === 1 && list[0].column === '*'
    ? Object.values(await catalog.tableInfo(list[0].table))
    : list;
}
