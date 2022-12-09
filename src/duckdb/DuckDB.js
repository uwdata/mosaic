import duckdb from 'duckdb';
import { loadJSON } from './load-json.js';

export class DuckDB {
  constructor(path = ':memory:') {
    this.db = new duckdb.Database(path);
    this.con = this.db.connect();
    this.exec(`PRAGMA temp_directory='./duckdb.tmp'`);
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
}

export class DuckDBStatement {
  constructor(statement) {
    this.statement = statement;
  }

  finalize() {
    this.statement.finalize();
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

  run(params) {
    this.statement.run(...params);
  }
}
