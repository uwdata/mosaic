#! /usr/bin/env node
import { DuckDB, dataServer } from '@uwdata/mosaic-duckdb';

dataServer(new DuckDB(), { rest: true, socket: true });
