#! /usr/bin/env node
import { DuckDB, dataServer } from '@uwdata/mosaic-duckdb';

const db = new DuckDB();

await Promise.all([
  db.csv('athletes', 'data/athletes.csv'),
  db.csv('penguins', 'data/penguins.csv'),
  db.csv('weather', 'data/seattle-weather.csv'),
  db.ipc('flights', 'data/flights-200k.arrow'),
  db.ipc('walk', 'data/random-walk.arrow')
]);

dataServer(db, { rest: true, socket: true });
