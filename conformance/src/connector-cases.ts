export const connectorCaseIds = [
  'connector/rest-arrow',
  'connector/rest-exec',
  'connector/rest-error',
  'connector/socket-arrow',
  'connector/socket-pipeline',
  'connector/socket-error-then-ok'
];

// The status comes from `ConnectorError.status` when the connector exposes
// one (#1224). The base connector on main only has it in its message, and
// that spelling is the single legacy form still parsed here; wording is
// otherwise not contractual.
export function rejectionStatus(err: unknown): number | undefined {
  const structured = (err as { status?: unknown } | null)?.status;
  if (typeof structured === 'number') return structured;
  const legacy = /^Query failed with HTTP status (\d{3})\b/.exec(err instanceof Error ? err.message : String(err));
  return legacy ? Number(legacy[1]) : undefined;
}
