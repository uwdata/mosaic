import { DuckDBInstance } from '@duckdb/node-api';

/** @import { DuckDBConnection, DuckDBPreparedStatement, DuckDBValue, Json } from '@duckdb/node-api' */

const TEMP_DIR = '.duckdb';

const DEFAULT_INIT_STATEMENTS = [
  `PRAGMA temp_directory='${TEMP_DIR}'`,
  `INSTALL nanoarrow FROM community`,
  `INSTALL httpfs`,
  `LOAD nanoarrow`,
  `LOAD httpfs`
].join(';\n');

export class DuckDB {
  /** @type {Promise<void>} */
  _init;
  /** @type {DuckDBInstance | undefined} */
  db;
  /** @type {DuckDBConnection | undefined} */
  con;

  /**
   * @param {string} path
   * @param {Record<string, string>} config
   * @param {string} initStatements
   */
  constructor(
    path = ':memory:',
    config = {},
    initStatements = DEFAULT_INIT_STATEMENTS
  ) {
    this._init = this._initialize(path, config, initStatements);
  }

  /**
   * @param {string} path
   * @param {Record<string, string>} config
   * @param {string} initStatements
   */
  async _initialize(path, config, initStatements) {
    this.db = await DuckDBInstance.create(path, config);
    this.con = await this.db.connect();
    await this.con.run(initStatements);
  }

  close() {
    this.con?.closeSync();
    this.db?.closeSync();
  }

  /**
   * @param {string} sql
   * @returns {Promise<DuckDBStatement>}
   */
  async prepare(sql) {
    await this._init;
    const stmt = await this.con.prepare(sql);
    return new DuckDBStatement(stmt);
  }

  /**
   * @param {string | { toString(): string }} sql
   * @returns {Promise<this>}
   */
  async exec(sql) {
    await this._init;
    await this.con.run(String(sql));
    return this;
  }

  /**
   * @param {string} sql
   * @returns {Promise<Record<string, Json>[]>}
   */
  async query(sql) {
    await this._init;
    const reader = await this.con.runAndReadAll(sql);
    return reader.getRowObjectsJson();
  }

  /**
   * @param {string} sql
   * @returns {Promise<Uint8Array[]>}
   */
  async arrowBuffer(sql) {
    await this._init;
    const reader = await this.con.runAndReadAll(
      `SELECT * FROM to_arrow_ipc((${sql}))`
    );
    return /** @type {Uint8Array[]} */ (reader.getColumnsJS()[0]) ?? [];
  }

}

export class DuckDBStatement {
  /** @type {DuckDBPreparedStatement} */
  statement;

  /** @param {DuckDBPreparedStatement} statement */
  constructor(statement) {
    this.statement = statement;
  }

  finalize() {
    this.statement.destroySync();
  }

  /** @param {DuckDBValue[]} [params] */
  async run(params) {
    if (params?.length) this.statement.bind(params);
    await this.statement.run();
  }

  /**
   * @param {DuckDBValue[]} [params]
   * @returns {Promise<this>}
   */
  async exec(params) {
    if (params?.length) this.statement.bind(params);
    await this.statement.run();
    return this;
  }

  /**
   * @param {DuckDBValue[]} [params]
   * @returns {Promise<Record<string, Json>[]>}
   */
  async query(params) {
    if (params?.length) this.statement.bind(params);
    const reader = await this.statement.runAndReadAll();
    return reader.getRowObjectsJson();
  }
}
