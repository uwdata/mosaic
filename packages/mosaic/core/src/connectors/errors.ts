import type { PreaggResponse } from './Connector.js';

/** Values of `ConnectorError.code` the coordinator acts on. */
export const ConnectorErrorCode = Object.freeze({
  /**
   * A server-managed pre-aggregated table no longer exists. The error's
   * `reference` property names it so the coordinator can rebuild it.
   */
  TableNotFound: 'table_not_found'
} as const);

export type ConnectorErrorCode = typeof ConnectorErrorCode[keyof typeof ConnectorErrorCode];

export class ConnectorError extends Error {
  /** The server error envelope's code. Servers report codes beyond those the coordinator acts on; errors the client raises itself carry none. */
  code?: string;
  /** The HTTP status code, for requests made over HTTP. */
  status?: number;
  /** Name parts of the managed table to rebuild; present only for `table_not_found`. */
  reference?: string[];

  constructor(
    message: string,
    fields: {
      code?: string;
      status?: number;
      reference?: string[];
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

/**
 * Raised when the client abandons a request it issued, such as a pending
 * materialization dropped by `PreAggregator.reset()`. Shares its `name` with
 * the `DOMException` a cancelled `fetch` rejects with, so `isAbortError`
 * recognizes both.
 */
export class AbortError extends Error {
  constructor(message = 'The operation was aborted', options?: ErrorOptions) {
    super(message, options);
    this.name = 'AbortError';
  }
}

/** Matches by `name`, since the `DOMException` a cancelled `fetch` rejects with is not an `AbortError` instance. */
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
  if (code === ConnectorErrorCode.TableNotFound && isReference(reference)) {
    fields.reference = reference;
  }
  return new ConnectorError(error, fields);
}

function isReference(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0
    && value.every(part => typeof part === 'string' && part);
}

export function parsePreaggResponse(value: unknown): PreaggResponse {
  const { reference, createdAt, rows, bytes } = (value ?? {}) as Record<string, unknown>;
  if (!isReference(reference) || typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))) {
    throw new ConnectorError('Malformed preagg response');
  }
  const response: PreaggResponse = { reference, createdAt };
  if (typeof rows === 'number') response.rows = rows;
  if (typeof bytes === 'number') response.bytes = bytes;
  return response;
}
