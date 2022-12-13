import duckdb from 'duckdb';
import { readFile } from 'node:fs/promises';
import { loadJSON } from './load-json.js';
import { mergeBuffers } from './merge-buffers.js';

const CONFIG = [
  `PRAGMA temp_directory='./duckdb.tmp'`,
  `LOAD arrow`
];

export class DuckDB {
  constructor(path = ':memory:') {
    this.db = new duckdb.Database(path);
    this.con = this.db.connect();
    this.exec(CONFIG.join(';\n'));
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  async add(tableName, data, schema) {
    await loadJSON(this, tableName, data, schema);
    return this;
  }

  async csv(tableName, fileName, options = {}) {
    const opt = Object.entries({ sample_size: -1, ...options })
      .map(([key, value]) => {
        const t = typeof value;
        const v = t === 'boolean' ? String(value).toUpperCase()
          : t === 'string' ? `'${value}'`
          : value;
        return `${key.toUpperCase()}=${v}`;
      })
      .join(', ');
    return this.exec(`CREATE TABLE ${tableName} AS SELECT *
      FROM read_csv_auto('${fileName}', ${opt});`);
  }

  async ipc(tableName, buffer) {
    const bufName = `__ipc__${tableName}`;
    const arrowData = ArrayBuffer.isView(buffer) ? buffer : await readFile(buffer);
    this.con.register_buffer(bufName, [arrowData], true, err => {
      if (err) console.error(err);
    });
    await this.exec(`CREATE TABLE ${tableName} AS SELECT * FROM ${bufName}`);
    this.con.unregister_buffer(bufName);
  }

  prepare(sql) {
    return new DuckDBStatement(this.con.prepare(sql));
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.con.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  query(sql) {
    return new Promise((resolve, reject) => {
      this.con.all(sql, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  arrowBuffer(sql) {
    return new Promise((resolve, reject) => {
      this.con.arrowIPCAll(sql, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(mergeBuffers(result));
        }
      });
    });
  }

  arrowStream(sql) {
    return this.con.arrowIPCStream(sql);
  }
}

export class DuckDBStatement {
  constructor(statement) {
    this.statement = statement;
  }

  finalize() {
    this.statement.finalize();
  }

  run(params) {
    this.statement.run(...params);
  }

  exec(params) {
    return new Promise((resolve, reject) => {
      this.statement.run(...params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  query(params) {
    return new Promise((resolve, reject) => {
      this.statement.all(...params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  arrowBuffer(params) {
    return new Promise((resolve, reject) => {
      this.con.arrowIPCAll(...params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(mergeBuffers(result));
        }
      });
    });
  }

  arrowStream(params) {
    return this.statement.arrowIPCStream(...params);
  }
}
