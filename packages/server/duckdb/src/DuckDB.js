import { DuckDBInstance } from '@duckdb/node-api';
import { tableFromArrays, tableToIPC } from '@uwdata/flechette';

const TEMP_DIR = '.duckdb';

const DEFAULT_INIT_STATEMENTS = [
  `PRAGMA temp_directory='${TEMP_DIR}'`,
  `INSTALL httpfs`,
  `LOAD httpfs`
].join(';\n');

export class DuckDB {
  constructor(
    path = ':memory:',
    config = {},
    initStatements = DEFAULT_INIT_STATEMENTS
  ) {
    this._init = this._initialize(path, config, initStatements);
  }

  async _initialize(path, config, initStatements) {
    this.db = await DuckDBInstance.create(path, config);
    this.con = await this.db.connect();
    const stmts = initStatements.split(';').map(s => s.trim()).filter(Boolean);
    for (const sql of stmts) {
      await this.con.run(sql);
    }
  }

  close() {
    this.con.closeSync();
    this.db.closeSync();
  }

  async prepare(sql) {
    await this._init;
    const stmt = await this.con.prepare(sql);
    return new DuckDBStatement(stmt);
  }

  async exec(sql) {
    await this._init;
    await this.con.run(sql);
    return this;
  }

  async query(sql) {
    await this._init;
    const reader = await this.con.runAndReadAll(sql);
    return reader.getRowObjectsJson();
  }

  async arrowBuffer(sql) {
    await this._init;
    const reader = await this.con.runAndReadAll(sql);
    const columns = reader.getColumnsObjectJS();
    return tableToIPC(tableFromArrays(columns), {});
  }
}

export class DuckDBStatement {
  constructor(statement) {
    this.statement = statement;
  }

  finalize() {
    this.statement.destroySync();
  }

  async run(params) {
    if (params?.length) await this.statement.bind(params);
    await this.statement.run();
  }

  async exec(params) {
    if (params?.length) await this.statement.bind(params);
    await this.statement.run();
    return this;
  }

  async query(params) {
    if (params?.length) await this.statement.bind(params);
    const reader = await this.statement.runAndReadAll();
    return reader.getRowObjectsJson();
  }
}
