import type { PreaggResponse, TableReference } from './Connector.js';

/** Values of `ConnectorError.code`. */
export const ConnectorErrorCode = Object.freeze({
  // the server error envelope's closed vocabulary (conformance/openapi.yaml, ErrorCode)
  BadRequest: 'bad_request',
  Unauthenticated: 'unauthenticated',
  Forbidden: 'forbidden',
  TableNotFound: 'table_not_found',
  UnsupportedCommand: 'unsupported_command',
  ResourceExhausted: 'resource_exhausted',
  DeadlineExceeded: 'deadline_exceeded',
  InternalError: 'internal_error',
  // raised by the client, never sent by a server
  MalformedResponse: 'malformed_response',
  LaneBusy: 'lane_busy',
  Suppressed: 'suppressed'
} as const);

export type ConnectorErrorCode = typeof ConnectorErrorCode[keyof typeof ConnectorErrorCode];

export class ConnectorError extends Error {
  /** A `ConnectorErrorCode` when known; a server may send a code this client does not recognize. */
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
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PreAggregateModeError';
  }
}

export class AbortError extends Error {
  constructor(message = 'The operation was aborted', options?: ErrorOptions) {
    super(message, options);
    this.name = 'AbortError';
  }
}

/** Also matches the `DOMException` a cancelled fetch rejects with, which is not an `AbortError` instance. */
export function isAbortError(value: unknown): boolean {
  return value instanceof Error && value.name === 'AbortError';
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
  if (code === ConnectorErrorCode.TableNotFound) {
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
    throw new ConnectorError('Malformed preagg response', { code: ConnectorErrorCode.MalformedResponse });
  }
  const response: PreaggResponse = { reference: parsed, createdAt };
  if (typeof rows === 'number') response.rows = rows;
  if (typeof bytes === 'number') response.bytes = bytes;
  return response;
}
