import type { PreaggResponse } from './Connector.js';

export class ConnectorError extends Error {
  code?: string;
  status?: number;
  catalog?: string;
  schema?: string;
  table?: string;

  constructor(
    message: string,
    fields: {
      code?: string;
      status?: number;
      catalog?: string;
      schema?: string;
      table?: string;
      cause?: unknown;
    } = {}
  ) {
    const { cause, ...rest } = fields;
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ConnectorError';
    Object.assign(this, rest);
  }
}

export class PreAggregateBusyError extends ConnectorError {
  constructor(message = 'Preaggregation lane is busy') {
    super(message, { code: 'lane_busy' });
    this.name = 'PreAggregateBusyError';
  }
}

export class PreAggregateSuppressedError extends ConnectorError {
  /** Unix milliseconds; local to the coordinator, unrelated to HTTP Retry-After. */
  retryAt: number;

  constructor(cause: ConnectorError, retryAt: number) {
    super(`Preaggregation suppressed: ${cause.message}`, {
      code: cause.code,
      status: cause.status,
      catalog: cause.catalog,
      schema: cause.schema,
      table: cause.table,
      cause
    });
    this.name = 'PreAggregateSuppressedError';
    this.retryAt = retryAt;
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
 * Parse a server error response `{ error, code?, catalog?, schema?, table? }`
 * into a ConnectorError, or null if the value is not one.
 */
export function parseErrorResponse(value: unknown, status?: number): ConnectorError | null {
  if (value == null || typeof value !== 'object') return null;
  const { error, code, catalog, schema, table } = value as Record<string, unknown>;
  if (typeof error !== 'string' || !error) return null;
  if (code !== undefined && (typeof code !== 'string' || !code)) return null;
  const fields: ConstructorParameters<typeof ConnectorError>[1] = { status };
  if (code) fields.code = code;
  if (
    code === 'table_not_found' &&
    typeof catalog === 'string' && catalog &&
    typeof schema === 'string' && schema &&
    typeof table === 'string' && table
  ) {
    Object.assign(fields, { catalog, schema, table });
  }
  return new ConnectorError(error, fields);
}

export function parsePreaggResponse(value: unknown): PreaggResponse {
  const { catalog, schema, table, createdAt } = (value ?? {}) as Record<string, unknown>;
  if (
    typeof catalog !== 'string' || !catalog ||
    typeof schema !== 'string' || !schema ||
    typeof table !== 'string' || !table ||
    typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))
  ) {
    throw new ConnectorError('Malformed preagg response', { code: 'malformed_response' });
  }
  return { catalog, schema, table, createdAt };
}

export function abortError(message = 'The operation was aborted'): Error {
  const err = new Error(message);
  err.name = 'AbortError';
  return err;
}

export function isAbortError(value: unknown): boolean {
  return value instanceof Error && value.name === 'AbortError';
}
