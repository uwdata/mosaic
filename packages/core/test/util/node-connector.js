import { DuckDB } from '@uwdata/mosaic-duckdb';
import { decodeIPC } from '../../src/util/decode-ipc.js';

export function nodeConnector(db = new DuckDB(), ipc) {
  return {
    /**
     * Query an in-process DuckDB instance.
     * @param {object} query
     * @param {string} [query.type] The query type: 'exec', 'arrow', or 'json'.
     * @param {string} query.sql A SQL query string.
     * @returns the query result
     */
    query: async query => {
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
