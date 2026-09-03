import type { SQLNode } from '@uwdata/mosaic-sql';
import {
  FromClauseNode, VerbatimNode,
  isColumnRef, isCreateQuery, isDescribeQuery, isQuery, isTableRef, walk
} from '@uwdata/mosaic-sql';
import type { QueryRequest } from '../types.js';

/** Table names, or null when they can not be determined (any table). */
export type Tables = Set<string> | null;

/** The tables a request reads and the tables it writes. */
export interface QueryTables {
  reads: Tables;
  writes: Tables;
}

const tableKeyword = /\b(from|join|table)\b/i;

function collectTables(root: SQLNode): Tables {
  const tables = new Set<string>();
  let unknown = false;
  walk(root, (node, parent) => {
    if (isTableRef(node)) {
      if (!isColumnRef(parent)) tables.add(node.name.toLowerCase());
    } else if (node instanceof FromClauseNode) {
      if (!(isTableRef(node.expr) || isQuery(node.expr))) {
        unknown = true;
        return -1;
      }
    } else if (node instanceof VerbatimNode && tableKeyword.test(node.value)) {
      unknown = true;
      return -1;
    }
  });
  return unknown ? null : tables;
}

/** Add the tables of b to a in place, where null means every table. */
export function union(a: Tables, b: Tables): Tables {
  if (!a || !b) return null;
  for (const t of b) a.add(t);
  return a;
}

/** Test if two table sets share a table, treating null as every table. */
export function intersects(a: Tables, b: Tables): boolean {
  if (!a) return !b || b.size > 0;
  if (!b) return a.size > 0;
  for (const t of a) {
    if (b.has(t)) return true;
  }
  return false;
}

/**
 * Determine the tables a request reads and writes from its query ASTs.
 * Raw SQL strings and unrecognized queries have unknown reads, and unknown
 * writes if the request is an exec.
 */
export function queryTables({ query, type }: QueryRequest): QueryTables {
  let reads: Tables = new Set();
  let writes: Tables = new Set();
  for (const q of Array.isArray(query) ? query : [query]) {
    if (!q) continue;
    if (isCreateQuery(q)) {
      writes?.add(q.name.name.toLowerCase());
      reads = union(reads, isQuery(q.query) ? collectTables(q.query) : null);
    } else if (isDescribeQuery(q)) {
      reads = union(reads, collectTables(q.query));
    } else if (isQuery(q)) {
      reads = union(reads, collectTables(q));
    } else {
      reads = null;
      if (type === 'exec') writes = null;
    }
  }
  return { reads, writes };
}
