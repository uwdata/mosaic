import { collectColumns, collectParams, SQLNode } from '../../src/index.js';

export function columns(node: SQLNode) {
  return collectColumns(node).map(c => c.column);
}

export function params(node: SQLNode) {
  return collectParams(node);
}
