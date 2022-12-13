#! /usr/bin/env node
import { DuckDB } from '../src/index.js';
import { createWriteStream } from 'fs';

const db = new DuckDB();

// load CSV into duckdb
await db.csv('data', process.argv[2]);

// get output stream of arrow bytes
const stream = await db.arrowStream('SELECT * FROM data');

 // determine the output stream
const output = process.argv[3]
  ? createWriteStream(process.argv[3])
  : process.stdout;

// set up error handling
output.on('error', (error) => {
  console.error(`File write error: ${error.message}`);
});

// write arrow bytes to output
for await (const chunk of stream) {
  output.write(chunk);
}

// finish
output.end(new Uint8Array(4));
