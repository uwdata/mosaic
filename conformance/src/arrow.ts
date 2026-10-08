import { tableFromIPC } from '@uwdata/flechette';
import type { ArrowExpectation, Violation } from './types.ts';

const fileMagic = 'ARROW1';
const continuation = -1;

export interface DecodedArrow {
  columns: string[];
  rows: unknown[][];
}

export interface ArrowChecks {
  // Wire responses must be IPC stream format with an end-of-stream marker
  // (D8). A `Connector` promises only decodable IPC bytes, so the command
  // layer checks that a table with the expected schema comes out, whatever
  // the framing.
  framing: boolean;
}

export function arrowViolations(body: Uint8Array | undefined, expectation: ArrowExpectation | true, checks: ArrowChecks = { framing: true }): Violation[] {
  if (!body || body.length === 0) {
    return [checks.framing
      ? violation('arrow.empty', 'Arrow body is empty; a zero-row result must still carry the schema and end-of-stream marker')
      : violation('arrow.decode', 'no Arrow bytes; a zero-row result must still decode to a table with its schema')];
  }
  const violations: Violation[] = [];
  if (new TextDecoder().decode(body.subarray(0, fileMagic.length)) === fileMagic) {
    if (checks.framing) violations.push(violation('arrow.file-format', 'Arrow body is in IPC file format (ARROW1 magic); the protocol requires the IPC stream format'));
  } else if (checks.framing) {
    const framing = walkStream(body);
    if (framing.problem) violations.push(violation('arrow.framing', framing.problem));
    else if (!framing.eos) violations.push(violation('arrow.eos', 'Arrow stream ends after its last message without the 0-length end-of-stream marker'));
    else if (framing.trailing) violations.push(violation('arrow.trailing', `${framing.trailing} bytes follow the end-of-stream marker`));
  }

  let decoded: DecodedArrow;
  try {
    decoded = decodeArrow(body);
  } catch (err) {
    violations.push(violation('arrow.decode', `Arrow body failed to decode: ${(err as Error).message}`));
    return violations;
  }
  if (expectation === true) return violations;
  if (expectation.columns && !sameJson(decoded.columns, expectation.columns)) {
    violations.push(violation('arrow.columns', `columns ${JSON.stringify(decoded.columns)} != ${JSON.stringify(expectation.columns)}`));
  }
  if (expectation.rowCount !== undefined && decoded.rows.length !== expectation.rowCount) {
    violations.push(violation('arrow.row-count', `row count ${decoded.rows.length} != ${expectation.rowCount}`));
  }
  if (expectation.rows && !sameJson(decoded.rows, expectation.rows)) {
    violations.push(violation('arrow.rows', `rows ${preview(decoded.rows)} != ${preview(expectation.rows)}`));
  }
  return violations;
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

interface Framing {
  messages: number;
  eos: boolean;
  trailing: number;
  problem?: string;
}

// Walks the IPC stream message by message: [0xFFFFFFFF] int32 metadata length,
// flatbuffer metadata (whose bodyLength field sizes the body), body. A
// metadata length of 0 is the end-of-stream marker. Pre-0.15 streams omit the
// continuation marker and are accepted.
export function walkStream(buf: Uint8Array): Framing {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let offset = 0;
  let messages = 0;
  while (true) {
    if (offset + 4 > buf.length) {
      return { messages, eos: false, trailing: 0 };
    }
    let metadataLength = view.getInt32(offset, true);
    offset += 4;
    if (metadataLength === continuation) {
      if (offset + 4 > buf.length) return { messages, eos: false, trailing: 0 };
      metadataLength = view.getInt32(offset, true);
      offset += 4;
    }
    if (metadataLength === 0) {
      return { messages, eos: true, trailing: buf.length - offset };
    }
    if (metadataLength < 0 || offset + metadataLength > buf.length) {
      return { messages, eos: false, trailing: 0, problem: `message ${messages + 1} declares ${metadataLength} metadata bytes at offset ${offset} but only ${buf.length - offset} remain` };
    }
    const bodyLength = readBodyLength(view, offset, metadataLength);
    if (bodyLength === undefined) {
      return { messages, eos: false, trailing: 0, problem: `message ${messages + 1} metadata at offset ${offset} is not a readable flatbuffer` };
    }
    offset += metadataLength;
    if (bodyLength < 0 || offset + bodyLength > buf.length) {
      return { messages, eos: false, trailing: 0, problem: `message ${messages + 1} declares a ${bodyLength}-byte body at offset ${offset} but only ${buf.length - offset} remain` };
    }
    offset += bodyLength;
    messages++;
  }
}

// Message flatbuffer: root table offset, then a vtable whose fourth field
// (byte offset 10) is bodyLength.
function readBodyLength(view: DataView, start: number, length: number): number | undefined {
  try {
    const table = start + view.getInt32(start, true);
    const vtable = table - view.getInt32(table, true);
    const vtableSize = view.getInt16(vtable, true);
    if (vtable < start || vtable + vtableSize > start + length) return undefined;
    const fieldOffset = vtableSize > 10 ? view.getInt16(vtable + 10, true) : 0;
    if (fieldOffset === 0) return 0;
    const value = view.getBigInt64(table + fieldOffset, true);
    return Number(value);
  } catch {
    return undefined;
  }
}

function violation(id: string, detail: string): Violation {
  return { id, detail };
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
