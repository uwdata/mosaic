import type { PreaggResponse, TableReference } from './Connector.js';

export class ConnectorError extends Error {
  code?: string;
  status?: number;
  /** The managed table to rebuild; present only for `table_not_found`. */
  reference?: TableReference;

  constructor(
    message: string,
    fields: {
      code?: string;
      status?: number;
      reference?: TableReference;
      cause?: unknown;
    } = {}
  ) {
    const { cause, ...rest } = fields;
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ConnectorError';
    Object.assign(this, rest);
  }
}

/** Client-side configuration error, distinct from a server `unsupported_command`. */
export class PreAggregateModeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreAggregateModeError';
  }
}

/**
 * Parse a server error response `{ error, code?, reference? }` into a
 * ConnectorError, or null if the value is not one.
 */
export function parseErrorResponse(value: unknown, status?: number): ConnectorError | null {
  if (value == null || typeof value !== 'object') return null;
  const { error, code, reference } = value as Record<string, unknown>;
  if (typeof error !== 'string' || !error) return null;
  if (code !== undefined && (typeof code !== 'string' || !code)) return null;
  const fields: ConstructorParameters<typeof ConnectorError>[1] = { status };
  if (code) fields.code = code;
  if (code === 'table_not_found') {
    const parsed = parseTableReference(reference);
    if (parsed) fields.reference = parsed;
  }
  return new ConnectorError(error, fields);
}

function parseTableReference(value: unknown): TableReference | null {
  const { catalog, schema, table } = (value ?? {}) as Record<string, unknown>;
  if (
    typeof catalog !== 'string' || !catalog ||
    typeof table !== 'string' || !table ||
    !Array.isArray(schema) || !schema.length || !schema.every(s => typeof s === 'string' && s)
  ) {
    return null;
  }
  return { catalog, schema: schema as string[], table };
}

/** Quote a reference as `TableRefNode([catalog, ...schema, table])` input. */
export function referenceParts(reference: TableReference): string[] {
  return [reference.catalog, ...reference.schema, reference.table];
}

export function parsePreaggResponse(value: unknown): PreaggResponse {
  const { reference, createdAt, rows, bytes } = (value ?? {}) as Record<string, unknown>;
  const parsed = parseTableReference(reference);
  if (!parsed || typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))) {
    throw new ConnectorError('Malformed preagg response', { code: 'malformed_response' });
  }
  const response: PreaggResponse = { reference: parsed, createdAt };
  if (typeof rows === 'number') response.rows = rows;
  if (typeof bytes === 'number') response.bytes = bytes;
  return response;
}

export function abortError(message = 'The operation was aborted'): Error {
  const err = new Error(message);
  err.name = 'AbortError';
  return err;
}

export function isAbortError(value: unknown): boolean {
  return value instanceof Error && value.name === 'AbortError';
}
