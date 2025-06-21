#! /usr/bin/env node
import path from 'node:path';
import { DuckDB } from '../src/index.js';

const db = new DuckDB();
const input = process.argv[2];
const output = process.argv[3] ||
  (path.basename(input, path.extname(input)) + '.csv');

await db.exec(`COPY (SELECT * FROM '${input}') TO '${output}' (FORMAT CSV, HEADER)`);
