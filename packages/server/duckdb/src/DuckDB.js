import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { DuckDBInstance } from '@duckdb/node-api';

const TEMP_DIR = '.duckdb';

const DEFAULT_INIT_STATEMENTS = [
  `PRAGMA temp_directory='${TEMP_DIR}'`,
  `INSTALL nanoarrow FROM community`,
  `INSTALL httpfs`,
  `LOAD nanoarrow`,
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
    await this.con.run(initStatements);
  }

  close() {
    this.con?.closeSync();
    this.db?.closeSync();
  }

  async prepare(sql) {
    await this._init;
    const stmt = await this.con.prepare(sql);
    return new DuckDBStatement(stmt);
  }

  async exec(sql) {
    await this._init;
    await this.con.run(String(sql));
    return this;
  }

  async query(sql) {
    await this._init;
    const reader = await this.con.runAndReadAll(sql);
    return reader.getRowObjectsJson();
  }

  async arrowBuffer(sql) {
    await this._init;
    const reader = await this.con.runAndReadAll(
      `SELECT * FROM to_arrow_ipc((${sql}))`
    );
    const chunks = /** @type {Uint8Array[]} */ (reader.getColumnsJS()[0]);
    if (!chunks?.length) {
      // Empty result: to_arrow_ipc omits the schema for empty queries,
      // so fall back to COPY which produces valid Arrow IPC with schema.
      return this._arrowCopy(sql);
    }
    return chunks;
  }

  async _arrowCopy(sql) {
    const file = join(tmpdir(), `mosaic_${randomBytes(8).toString('hex')}.arrow`);
    try {
      await this.con.run(`COPY (${sql}) TO '${file}' (FORMAT 'arrow')`);
      return new Uint8Array(await readFile(file));
    } finally {
      await unlink(file).catch(() => {});
    }
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
