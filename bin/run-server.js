#! /usr/bin/env node
import { DuckDB, JSONDataService, launchServer } from '../src/index.js';

const db = new DuckDB();

await Promise.all([
  db.csv('athletes', 'data/athletes.csv'),
  db.csv('penguins', 'data/penguins.csv'),
  db.ipc('flights', 'data/flights-200k.arrow'),
  db.ipc('walk', 'data/random-walk.arrow')
]);

launchServer(new JSONDataService(db));
