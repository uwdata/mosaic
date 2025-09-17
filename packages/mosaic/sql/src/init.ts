import { setDefaultVisitor } from './ast/node.js';
import { duckdbVisitor } from './visit/duckdb-visitor.js';

// Initialize the default visitor
setDefaultVisitor(duckdbVisitor);
