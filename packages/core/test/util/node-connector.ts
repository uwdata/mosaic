import { DuckDB } from '@uwdata/mosaic-duckdb';
import { decodeIPC } from '../../src/util/decode-ipc.js';
import type { ExtractionOptions } from '@uwdata/flechette';

interface QueryRequest {
  type?: 'exec' | 'arrow' | 'json';
  sql: string;
}

export function nodeConnector(db: DuckDB = new DuckDB(), ipc?: ExtractionOptions) {
  return {
    /**
     * Query an in-process DuckDB instance.
     * @param query Query object with type and SQL
     * @returns the query result
     */
    query: async (query: QueryRequest): Promise<any> => {
      const { type, sql } = query;
      switch (type) {
        case 'exec':
          return db.exec(sql);
        case 'arrow':
          return decodeIPC(await db.arrowBuffer(sql), ipc);
        default:
          return db.query(sql);
      }
    }
  };
}