import duckdb from 'duckdb';
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

  // TODO: options
  async csv(tableName, fileName, options) {
    return this.exec(`CREATE TABLE ${tableName} AS SELECT *
      FROM read_csv_auto('${fileName}', SAMPLE_SIZE=-1);`);
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
          result.pop(); // the last buffer in the result is 0x0
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
          result.pop(); // the last buffer in the result is 0x0
          resolve(mergeBuffers(result));
        }
      });
    });
  }

  arrowStream(params) {
    return this.statement.arrowIPCStream(...params);
  }
}
