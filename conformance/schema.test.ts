import { describe, expect, it } from 'vitest';
import { schemaViolations } from './src/schema.ts';

const ids = (definition: string, value: unknown) => schemaViolations('e', definition, value).map(v => v.id).sort();
const error = (extra: Record<string, unknown>) => ({ error: 'm', ...extra });
const reference = { catalog: 'memory', schema: ['mosaic', 'scope_a7'], table: 'preagg_c92f' };

const reasons: Record<string, string[]> = {
  bad_request: ['malformed_json', 'missing_field', 'invalid_field', 'sql_parse_error', 'multiple_statements', 'not_read_only', 'unsupported_statement', 'method_not_allowed', 'payload_too_large', 'unsupported_media_type', 'precondition_failed'],
  unauthenticated: ['authentication_required', 'authentication_failed'],
  forbidden: ['policy_denied', 'access_denied'],
  table_not_found: ['materialization_missing'],
  unsupported_command: ['command_disabled'],
  resource_exhausted: ['resource_limit_exceeded'],
  deadline_exceeded: ['command_deadline_exceeded'],
  internal_error: ['execution_failed', 'validation_failed', 'invalid_server_configuration', 'internal_failure']
};

function complete(code: string, reason: string) {
  const envelope: Record<string, unknown> = error({ code, reason });
  if (reason === 'missing_field' || reason === 'invalid_field') envelope.field = 'type';
  if (code === 'table_not_found') envelope.reference = reference;
  return envelope;
}

describe('error classification', () => {
  it('accepts every reason with its own code and no other', () => {
    const all = Object.values(reasons).flat();
    expect(new Set(all).size).toBe(all.length);
    for (const [code, own] of Object.entries(reasons)) {
      for (const reason of all) {
        expect(ids('Error', complete(code, reason)), `${code}/${reason}`).toEqual(own.includes(reason) ? [] : ['e.enum.reason']);
      }
    }
  });

  it('requires reason and rejects unknown values', () => {
    expect(ids('Error', error({ code: 'bad_request' }))).toEqual(['e.required.reason']);
    expect(ids('Error', error({ code: 'bad_request', reason: 'syntax' }))).toEqual(['e.enum.reason']);
    expect(ids('Error', error({ code: 'nope', reason: 'internal_failure' }))).toEqual(['e.enum.code']);
  });

  it('ties field to the field reasons', () => {
    expect(ids('Error', error({ code: 'bad_request', reason: 'missing_field' }))).toEqual(['e.required.field']);
    expect(ids('Error', error({ code: 'bad_request', reason: 'invalid_field', field: '' }))).toEqual(['e.minlength.field']);
    expect(ids('Error', error({ code: 'bad_request', reason: 'sql_parse_error', field: 'sql' }))).toEqual(['e.forbidden.field']);
    expect(ids('Error', error({ code: 'internal_error', reason: 'execution_failed', field: 'sql' }))).toEqual(['e.forbidden.field']);
  });

  it('never accepts flat table components on the envelope', () => {
    expect(ids('Error', error({ code: 'table_not_found', reason: 'materialization_missing', catalog: 'a', schema: 'b', table: 'c' })))
      .toEqual(['e.forbidden.catalog', 'e.forbidden.schema', 'e.forbidden.table', 'e.required.reference']);
  });

  it('keeps application-owned extras but requires a non-empty message', () => {
    expect(ids('Error', error({ code: 'internal_error', reason: 'internal_failure', tenant: 'acme' }))).toEqual([]);
    expect(ids('Error', { error: '', code: 'internal_error', reason: 'internal_failure' })).toEqual(['e.minlength.error']);
  });
});

describe('table references', () => {
  it('requires the complete nested reference for table_not_found only', () => {
    expect(ids('Error', error({ code: 'table_not_found', reason: 'materialization_missing' }))).toEqual(['e.required.reference']);
    expect(ids('Error', error({ code: 'internal_error', reason: 'execution_failed', reference }))).toEqual(['e.forbidden.reference']);
    expect(ids('Error', error({ code: 'forbidden', reason: 'policy_denied', reference }))).toEqual(['e.forbidden.reference']);
  });

  it('demands an explicit catalog, a schema path of raw components, and nothing else', () => {
    const tnf = (ref: unknown) => ids('Error', error({ code: 'table_not_found', reason: 'materialization_missing', reference: ref }));
    expect(tnf(reference)).toEqual([]);
    expect(tnf({ catalog: 'memory', schema: ['a.b', 'c"d'], table: 'x.y' })).toEqual([]);
    expect(tnf({ schema: ['main'], table: 't' })).toEqual(['e.required.reference.catalog']);
    expect(tnf({ catalog: 'memory', schema: 'main', table: 't' })).toEqual(['e.type.reference.schema']);
    expect(tnf({ catalog: 'memory', schema: [], table: 't' })).toEqual(['e.minitems.reference.schema']);
    expect(tnf({ catalog: 'memory', schema: ['main'], table: 't', quoted: '"memory"."main"."t"' })).toEqual(['e.additional.reference.quoted']);
  });

  it('uses the same shape in PreaggResponse', () => {
    expect(ids('PreaggResponse', { reference, createdAt: '2026-09-25T10:00:00Z', rows: 10, bytes: 1024 })).toEqual([]);
    expect(ids('PreaggResponse', { catalog: 'memory', schema: 'main', table: 't', createdAt: '2026-09-25T10:00:00Z' }))
      .toEqual(['e.additional.catalog', 'e.additional.schema', 'e.additional.table', 'e.required.reference']);
    expect(ids('PreaggResponse', { reference: { ...reference, schema: [] }, createdAt: '2026-09-25T10:00:00Z' })).toEqual(['e.minitems.reference.schema']);
  });
});

describe('diagnostics', () => {
  const denied = (diagnostics: unknown) => ids('Error', error({ code: 'forbidden', reason: 'policy_denied', diagnostics }));

  it('accepts typed table and function subjects with optional namespaces and locations', () => {
    expect(denied([
      { message: 'not permitted', provider: 'gatekeeper', rule: 'table_not_allowed', subject: { kind: 'table', catalog: 'analytics', schema: ['finance', 'reports'], name: 'q3' }, location: { start: 14, end: 32 } },
      { message: 'remote URI', subject: { kind: 'function', name: 'read_parquet' } },
      { message: 'position only', location: { start: 0 } },
      { message: 'bare' }
    ])).toEqual([]);
    expect(denied([])).toEqual([]);
  });

  it('rejects untyped subjects, flattened namespaces, and binding evidence smuggled in as a diagnostic', () => {
    expect(denied([{ message: 'x', subject: { name: 'q3' } }])).toEqual(['e.required.diagnostics.0.subject.kind']);
    expect(denied([{ message: 'x', subject: { kind: 'view', name: 'q3' } }])).toEqual(['e.enum.diagnostics.0.subject.kind']);
    expect(denied([{ message: 'x', subject: { kind: 'table', schema: 'finance', name: 'q3' } }])).toEqual(['e.type.diagnostics.0.subject.schema']);
    expect(denied([{ message: 'x', location: { end: 4 } }])).toEqual(['e.required.diagnostics.0.location.start']);
    expect(denied([{ rule: 'r' }])).toEqual(['e.required.diagnostics.0.message']);
    expect(denied([{ message: 'x', objects: [] }])).toEqual(['e.additional.diagnostics.0.objects']);
  });

  it('allows diagnostics on any code', () => {
    expect(ids('Error', error({ code: 'bad_request', reason: 'sql_parse_error', diagnostics: [{ message: 'near SELEC', provider: 'duckdb', location: { start: 0, end: 5 } }] }))).toEqual([]);
  });
});

// Bounds the schema itself imposes, one assertion each, so that loosening a
// constraint (dropping `minimum: 0`, say) is caught here even though the
// remaining tests only look at which code permits a field.
describe('value bounds', () => {
  const bounds: Array<[what: string, envelope: Record<string, unknown>, violation: string]> = [
    ['empty catalog', { code: 'table_not_found', reason: 'materialization_missing', reference: { catalog: '', schema: ['s'], table: 't' } }, 'e.minlength.reference.catalog'],
    ['empty schema component', { code: 'table_not_found', reason: 'materialization_missing', reference: { catalog: 'c', schema: ['s', ''], table: 't' } }, 'e.minlength.reference.schema.1'],
    ['empty field', { code: 'bad_request', reason: 'invalid_field', field: '' }, 'e.minlength.field'],
    ['negative offset', { code: 'forbidden', reason: 'policy_denied', diagnostics: [{ message: 'x', location: { start: -1 } }] }, 'e.minimum.diagnostics.0.location.start'],
    ['location extras', { code: 'forbidden', reason: 'policy_denied', diagnostics: [{ message: 'x', location: { start: 0, line: 1 } }] }, 'e.additional.diagnostics.0.location.line'],
    ['subject extras', { code: 'forbidden', reason: 'policy_denied', diagnostics: [{ message: 'x', subject: { kind: 'table', name: 'q', table: 'q' } }] }, 'e.additional.diagnostics.0.subject.table'],
    ['negative retry', { code: 'resource_exhausted', reason: 'resource_limit_exceeded', retryAfterMs: -1 }, 'e.minimum.retryAfterMs'],
    ['fractional retry', { code: 'resource_exhausted', reason: 'resource_limit_exceeded', retryAfterMs: 1.5 }, 'e.type.retryAfterMs'],
    ['empty diagnosticId', { code: 'internal_error', reason: 'internal_failure', diagnosticId: '' }, 'e.minlength.diagnosticId'],
    ['numeric diagnosticId', { code: 'internal_error', reason: 'internal_failure', diagnosticId: 7 }, 'e.type.diagnosticId']
  ];

  it.each(bounds)('rejects %s', (_, envelope, violation) => {
    expect(ids('Error', error(envelope))).toEqual([violation]);
  });
});

describe('operational metadata', () => {
  it('allows diagnosticId on any code and retryAfterMs only on resource_exhausted', () => {
    expect(ids('Error', error({ code: 'internal_error', reason: 'internal_failure', diagnosticId: 'req_01J9' }))).toEqual([]);
    expect(ids('Error', error({ code: 'resource_exhausted', reason: 'resource_limit_exceeded', retryAfterMs: 0 }))).toEqual([]);
    expect(ids('Error', error({ code: 'deadline_exceeded', reason: 'command_deadline_exceeded', retryAfterMs: 1000 }))).toEqual(['e.forbidden.retryAfterMs']);
  });
});
