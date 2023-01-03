#! /usr/bin/env node
import { DuckDB, dataServer } from '../src/duckdb/index.js';

const db = new DuckDB();

await Promise.all([
  db.csv('athletes', 'data/athletes.csv'),
  db.csv('penguins', 'data/penguins.csv'),
  db.csv('seattle', 'data/seattle-weather.csv'),
  db.ipc('flights', 'data/flights-200k.arrow'),
  db.ipc('walk', 'data/random-walk.arrow')
]);

// TODO: accomplish via transforms
db.exec(`
  CREATE TABLE weather AS
  SELECT *, make_date(2012, month(date), day(date)) AS doy FROM seattle
`);

dataServer(db, { rest: true, socket: true });
