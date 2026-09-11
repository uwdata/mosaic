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

export class PreaggBusyError extends ConnectorError {
  constructor(message = 'Preaggregation lane is busy') {
    super(message, { code: 'lane_busy' });
    this.name = 'PreaggBusyError';
  }
}

export class PreaggSuppressedError extends ConnectorError {
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
    this.name = 'PreaggSuppressedError';
    this.retryAt = retryAt;
  }
}

/** Client-side configuration error, distinct from a server `unsupported_command`. */
export class PreaggModeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreaggModeError';
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Build a ConnectorError from a server error envelope `{ error, code?,
 * catalog?, schema?, table? }`, or null if the value is not one.
 */
export function errorFromEnvelope(value: unknown, status?: number): ConnectorError | null {
  if (value == null || typeof value !== 'object') return null;
  const { error, code, catalog, schema, table } = value as Record<string, unknown>;
  if (!isNonEmptyString(error)) return null;
  if (code !== undefined && !isNonEmptyString(code)) return null;
  const fields: ConstructorParameters<typeof ConnectorError>[1] = { status };
  if (code) fields.code = code;
  if (code === 'table_not_found') {
    if (isNonEmptyString(catalog) && isNonEmptyString(schema) && isNonEmptyString(table)) {
      Object.assign(fields, { catalog, schema, table });
    }
  }
  return new ConnectorError(error, fields);
}

export function abortError(message = 'The operation was aborted'): Error {
  const err = new Error(message);
  err.name = 'AbortError';
  return err;
}

export function isAbortError(value: unknown): boolean {
  return value instanceof Error && value.name === 'AbortError';
}
