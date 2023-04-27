#! /usr/bin/env node
import { DuckDB, dataServer, loadArrow, loadCSV } from '@uwdata/mosaic-duckdb';

const db = new DuckDB();

await Promise.all([
  loadCSV(db, 'athletes', 'data/athletes.csv'),
  loadCSV(db, 'penguins', 'data/penguins.csv'),
  loadCSV(db, 'weather', 'data/seattle-weather.csv'),
  loadArrow(db, 'flights', 'data/flights-200k.arrow'),
  loadArrow(db, 'walk', 'data/random-walk.arrow')
]);

dataServer(db, { rest: true, socket: true });
