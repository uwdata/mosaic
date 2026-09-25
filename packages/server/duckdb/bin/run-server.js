#! /usr/bin/env node
import { DuckDB, dataServer, parseServerArgs } from '../src/index.js';

const { dbPath, port } = parseServerArgs(process.argv.slice(2));

dataServer(new DuckDB(dbPath), { rest: true, socket: true, port });
