import duckdb from 'duckdb';
import { mergeBuffers } from './merge-buffers.js';

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
    this.db = new duckdb.Database(path, config);
    this.con = this.db.connect();
    this.exec(initStatements);
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
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
      this.statement.arrowIPCAll(...params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(mergeBuffers(result));
        }
      });
    });
  }
}
