import { Coordinator, decodeIPC } from "@uwdata/mosaic-core";
// @ts-ignore -- no types
import { DuckDB } from "@uwdata/mosaic-duckdb";
import { InstantiateContext } from "@uwdata/mosaic-spec";
// @ts-ignore -- no types
import { createAPIContext } from "@uwdata/vgplot";

const SCAN_OP = 'SEQ_SCAN ';
const NO_EXPLAIN = ['CREATE', 'INSTALL', 'LOAD']

export function publishConnector() {
  const db = new DuckDB();
  db.exec('PRAGMA force_compression=Uncompressed');

  type Query = {
    type: 'exec' | 'arrow' | 'json';
    sql: string;
  }

  const tables: Record<string, Set<string>> = {};

  return {
    query: async (query: Query) => {
      // Find SEQ_SCAN by recursively looping over the plan
      const toCheck: Record<string, Set<string>> = {};
      const findSeqScan = (node: any): void => {
        if (node.name === SCAN_OP) {
          const info = node.extra_info;
          if (info.Table && info.Projections) {
            const table = info.Table.toLowerCase();
            const columns = typeof info.Projections === 'string' ? [info.Projections] : info.Projections
            if (!(table in tables)) tables[table] = new Set();
            columns.forEach((col: string) => tables[table].add(col));
          }
          if (info.Table && info.Filters) {
            const table = info.Table.toLowerCase();
            const filters = typeof info.Filters === 'string' ? [info.Filters] : info.Filters
            if (!(table in toCheck)) toCheck[table] = new Set();
            filters.forEach((filter: string) => toCheck[table].add(filter));
          }
        }
        if (node.children) {
          node.children.some(findSeqScan);
        }
      };
      // run an explain query and extract the result
      if (!NO_EXPLAIN.some(cmd => query.sql.startsWith(cmd))) {
        const explain = await db.query(`EXPLAIN (FORMAT json) ${query.sql}`);
        if (explain.length !== 0 && explain[0].explain_value) {
          const plan = JSON.parse(explain[0].explain_value);
          plan.some(findSeqScan);

          for (const table in toCheck) {
            const desc = await db.query(`DESCRIBE ${table}`);
            const columns = desc.map((col: any) => col.column_name);
            const filters = Array.from(toCheck[table]).join(' ');
            for (const col of columns) {
              if (filters.includes(col)) {
                if (!(table in tables)) tables[table] = new Set();
                tables[table].add(col);
              }
            }
          }
        }
      }

      const { type, sql } = query;
      switch (type) {
        case 'exec':
          return db.exec(sql);
        case 'arrow':
          return decodeIPC(await db.arrowBuffer(sql));
        default:
          return db.query(sql);
      }
    },
    tables: () => tables,
  };
}

export class PublishContext extends InstantiateContext {
  constructor(connector: any) {
    const coordinator = new Coordinator(connector);
    coordinator.logger(undefined) // Disable logging
    const api = createAPIContext({ coordinator });
    super({ api });
  }
}