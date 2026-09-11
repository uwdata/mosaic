import { randomUUID } from 'node:crypto';
import type { ExtractionOptions, Table } from '@uwdata/flechette';
import { DuckDB } from '@uwdata/mosaic-duckdb';
import { literal, TableRefNode } from '@uwdata/mosaic-sql';
import { decodeIPC } from '../util/decode-ipc.js';
import type {
  ArrowQueryRequest,
  Connector,
  ConnectorRequest,
  ExecQueryRequest,
  PreaggRequest,
  PreaggResponse
} from './Connector.js';
import { ConnectorError } from './errors.js';

/**
 * A Mosaic Connector backed by an in-process Node.js DuckDB instance.
 * Requires the optional peer dependency `@uwdata/mosaic-duckdb`.
 */
export class NodeConnector implements Connector {
  protected _db: DuckDB;
  protected _ipc?: ExtractionOptions;
  protected _tables = new Map<string, { response: PreaggResponse; name: string }>();
  protected _builds = new Map<string, Promise<PreaggResponse>>();

  static async make(db?: DuckDB, ipc?: ExtractionOptions) {
    const connector = new NodeConnector(db, ipc);
    // make sure initialization is complete
    await connector._db._init;
    return connector;
  }

  constructor(
    db: DuckDB = new DuckDB(),
    ipc?: ExtractionOptions
  ) {
    this._db = db;
    this._ipc = ipc;
  }

  /**
   * Query an in-process DuckDB instance.
   * @param query Query object with type and SQL
   * @returns the query result
   */
  async query(query: ArrowQueryRequest): Promise<Table>;
  async query(query: ExecQueryRequest): Promise<void>;
  async query(query: PreaggRequest): Promise<PreaggResponse>;
  async query(query: ConnectorRequest): Promise<unknown> {
    const { type, sql } = query;
    if (type === 'exec') return this._db.exec(sql);
    if (type === 'preagg') return this.preagg(sql);
    try {
      return decodeIPC(await this._db.arrowBuffer(sql), this._ipc);
    } catch (error) {
      const missing = await this.missingTable(sql).catch(() => null);
      if (missing) {
        const { catalog, schema, table } = missing;
        throw new ConnectorError('Materialized table is unavailable', {
          code: 'table_not_found', catalog, schema, table, cause: error
        });
      }
      throw error;
    }
  }

  protected preagg(sql: string): Promise<PreaggResponse> {
    let build = this._builds.get(sql);
    if (!build) {
      build = this.materialize(sql).finally(() => this._builds.delete(sql));
      this._builds.set(sql, build);
    }
    return build;
  }

  protected async materialize(sql: string): Promise<PreaggResponse> {
    const previous = this._tables.get(sql)?.response;
    if (previous && await this.tableExists(previous)) return previous;

    const [row] = await this._db.query(`SELECT system.main.json_serialize_sql(${literal(sql)}) AS ast`);
    const ast = JSON.parse(row.ast as string);
    if (ast.error || ast.statements?.length !== 1) {
      throw new ConnectorError('Preaggregation requires one SELECT statement', { code: 'bad_request' });
    }

    const table = `mosaic_preagg_${randomUUID().replaceAll('-', '')}`;
    const ref = new TableRefNode(['temp', 'main', table]);
    await this._db.exec(`CREATE TEMP TABLE ${ref} AS ${sql}`);
    const response = { catalog: 'temp', schema: 'main', table, createdAt: new Date().toISOString() };
    const [name] = this._db.con!.getTableNames(`SELECT * FROM ${ref}`, true);
    this._tables.set(sql, { response, name });
    return response;
  }

  protected async tableExists({ table }: PreaggResponse): Promise<boolean> {
    const rows = await this._db.query(`SELECT 1 FROM system.main.duckdb_tables() WHERE database_name = 'temp' AND schema_name = 'main' AND table_name = ${literal(table)}`);
    return rows.length > 0;
  }

  protected async missingTable(sql: string): Promise<PreaggResponse | null> {
    const connection = this._db.con;
    if (!connection) return null;
    const names = new Set(connection.getTableNames(sql, true));
    for (const { response, name } of this._tables.values()) {
      if (names.has(name) && !await this.tableExists(response)) {
        return response;
      }
    }
    return null;
  }
}
