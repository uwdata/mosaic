import duckdb from 'duckdb';

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
}
