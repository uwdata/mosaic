import { tableFromIPC } from '@uwdata/flechette';
import type { ArrowExpectation } from './types.ts';

const fileMagic = 'ARROW1';

export interface DecodedArrow {
  columns: string[];
  rows: unknown[][];
}

export function arrowProblems(body: Uint8Array | undefined, expectation: ArrowExpectation | true): string[] {
  const problems: string[] = [];
  if (!body || body.length === 0) return ['Arrow body is empty; a zero-row result must still carry the schema and end-of-stream marker'];
  if (new TextDecoder().decode(body.subarray(0, fileMagic.length)) === fileMagic) {
    problems.push('Arrow body is in IPC file format (ARROW1 magic); the protocol requires the IPC stream format');
  }
  let decoded: DecodedArrow;
  try {
    decoded = decodeArrow(body);
  } catch (err) {
    problems.push(`Arrow body failed to decode: ${(err as Error).message}`);
    return problems;
  }
  if (expectation === true) return problems;
  if (expectation.columns && !sameJson(decoded.columns, expectation.columns)) {
    problems.push(`columns ${JSON.stringify(decoded.columns)} != ${JSON.stringify(expectation.columns)}`);
  }
  if (expectation.rowCount !== undefined && decoded.rows.length !== expectation.rowCount) {
    problems.push(`row count ${decoded.rows.length} != ${expectation.rowCount}`);
  }
  if (expectation.rows && !sameJson(decoded.rows, expectation.rows)) {
    problems.push(`rows ${preview(decoded.rows)} != ${preview(expectation.rows)}`);
  }
  return problems;
}

export function decodeArrow(body: Uint8Array): DecodedArrow {
  const table = tableFromIPC(body, { useBigInt: false, useDate: false });
  const columns = table.schema.fields.map(f => f.name);
  const columnArrays = columns.map((_, i) => table.getChildAt(i)!.toArray());
  const rows: unknown[][] = [];
  for (let r = 0; r < table.numRows; r++) {
    rows.push(columnArrays.map(col => normalize(col[r])));
  }
  return { columns, rows };
}

function normalize(value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  return value;
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function preview(rows: unknown[][]) {
  const text = JSON.stringify(rows);
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}
