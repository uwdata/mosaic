#! /usr/bin/env node
import { DuckDB, dataServer } from '../src/index.js';
dataServer(new DuckDB(), { rest: true, socket: true });
