#! /usr/bin/env node
import { DuckDB } from '../src/index.js';
import { createWriteStream } from 'fs';

const db = new DuckDB();

// load CSV into duckdb
await db.exec(`CREATE TABLE data AS SELECT * FROM '${process.argv[2]}'`);

// get output stream of arrow bytes
const buf = await db.arrowBuffer('SELECT * FROM data');

 // determine the output stream
const output = process.argv[3]
  ? createWriteStream(process.argv[3])
  : process.stdout;

// set up error handling
output.on('error', (error) => {
  console.error(`File write error: ${error.message}`);
});

// write arrow bytes to output
output.end(buf);
