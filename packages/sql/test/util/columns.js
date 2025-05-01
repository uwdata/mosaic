import { collectColumns, collectParams } from '../../src/index.js';

export function columns(node) {
  return collectColumns(node).map(c => c.column);
}

export function params(node) {
  return collectParams(node);
}
