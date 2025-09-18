import { setDefaultVisitor } from './ast/node.js';
import { duckDBCodeGenerator } from './visit/codegen/duckdb.js';

// Initialize the default visitor
setDefaultVisitor(duckDBCodeGenerator);
