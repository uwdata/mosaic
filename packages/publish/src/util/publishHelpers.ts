import { Coordinator, decodeIPC } from "@uwdata/mosaic-core";
import { DuckDB } from "@uwdata/mosaic-duckdb";
import { InstantiateContext } from "@uwdata/mosaic-spec";
import { createAPIContext } from "../../../vgplot/src/index.js";

export function publishConnector() {
  const db = new DuckDB();
  db.exec('PRAGMA force_compression=Uncompressed');

  type Query = {
    type: 'exec' | 'arrow' | 'json';
    sql: string;
  }

  return {
    query: async (query: Query) => {
      const { type, sql } = query;
      switch (type) {
        case 'exec':
          return db.exec(sql);
        case 'arrow':
          return decodeIPC(await db.arrowBuffer(sql));
        default:
          return db.query(sql);
      }
    }
  };
}

export class PublishContext extends InstantiateContext {
  constructor(connector: any) {
    const coordinator = new Coordinator(connector);
    const api = createAPIContext({ coordinator });
    super({ api });
  }
}