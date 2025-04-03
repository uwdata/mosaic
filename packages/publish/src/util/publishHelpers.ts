import { Coordinator, decodeIPC } from "@uwdata/mosaic-core";
import { DuckDB } from "@uwdata/mosaic-duckdb";
import { InstantiateContext } from "@uwdata/mosaic-spec";
import { createAPIContext } from "../../../vgplot/src/index.js";

const SCAN_OP = 'SEQ_SCAN ';

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
      // run an explain query and extract the result
      const explain = await db.query(`EXPLAIN (FORMAT json) ${query.sql}`);
      const plan = JSON.parse(explain[0].explain_value);

      // Find SEQ_SCAN by recursively looping over the plan
      const findSeqScan = (node: any): void => {
        if (node.name === SCAN_OP) {
          const info = node.extra_info;
          if (info.Table && info.Projections) {
            const table = info.Table.toLowerCase();
            const columns = typeof info.Projections === 'string' ? [info.Projections] : info.Projections
            if (!(table in tables)) tables[table] = new Set();
            columns.forEach((col: string) => tables[table].add(col));
          }
        }
        if (node.children) {
          node.children.some(findSeqScan);
        }
      };
      plan.some(findSeqScan);

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
    coordinator.logger(null) // Disable logging
    const api = createAPIContext({ coordinator });
    super({ api });
  }
}