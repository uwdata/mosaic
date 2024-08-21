#! /usr/bin/env node
import { DuckDB, dataServer } from '../src/index.js';

// the database to connect to, default is main memory
const dbPath = process.argv[2] || './test.db';

dataServer(new DuckDB(dbPath), { rest: true, socket: true });
