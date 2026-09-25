// Wire transports carry the encoded protocol and are checked for framing,
// headers, and ordering; command transports go through a `Connector` and are
// checked for what the coordinator can observe: results, rejections, and
// association of concurrent calls.
export type WireTransport = 'post' | 'get' | 'ws';
export type CommandTransport = 'rest' | 'socket' | 'inproc';
export type Transport = WireTransport | CommandTransport;
export type Layer = 'wire' | 'command';

export const wireTransports: readonly WireTransport[] = ['post', 'get', 'ws'];
export const commandTransports: readonly CommandTransport[] = ['rest', 'socket', 'inproc'];

export function layerOf(transport: Transport): Layer {
  return (wireTransports as readonly string[]).includes(transport) ? 'wire' : 'command';
}

export type Capability = 'exec' | 'preagg' | 'caching' | 'files' | 'policy';

export type ErrorCode =
  | 'bad_request'
  | 'unauthenticated'
  | 'forbidden'
  | 'table_not_found'
  | 'unsupported_command'
  | 'resource_exhausted'
  | 'deadline_exceeded'
  | 'internal_error';

export type ErrorReason =
  | 'malformed_json'
  | 'missing_field'
  | 'invalid_field'
  | 'sql_parse_error'
  | 'multiple_statements'
  | 'not_read_only'
  | 'unsupported_statement'
  | 'method_not_allowed'
  | 'payload_too_large'
  | 'unsupported_media_type'
  | 'precondition_failed'
  | 'authentication_required'
  | 'authentication_failed'
  | 'policy_denied'
  | 'access_denied'
  | 'materialization_missing'
  | 'command_disabled'
  | 'resource_limit_exceeded'
  | 'command_deadline_exceeded'
  | 'execution_failed'
  | 'validation_failed'
  | 'invalid_server_configuration'
  | 'internal_failure';

export const canonicalStatus: Record<ErrorCode, number> = {
  bad_request: 400,
  unauthenticated: 401,
  forbidden: 403,
  table_not_found: 404,
  unsupported_command: 400,
  resource_exhausted: 429,
  deadline_exceeded: 504,
  internal_error: 500
};

export type Matcher =
  | string
  | { pattern: string }
  | { present: true }
  | { absent: true }
  | { anyOf: string[] }
  | { not: string }
  | { tokens: string[] };

export interface Violation {
  id: string;
  detail: string;
}

export interface ArrowExpectation {
  columns?: string[];
  rows?: unknown[][];
  rowCount?: number;
}

export interface ErrorExpectation {
  status?: number;
  code: ErrorCode;
  reason?: ErrorReason;
  field?: string;
}

export interface TableReference {
  catalog: string;
  schema: string[];
  table: string;
}

export interface Expectation {
  arrow?: ArrowExpectation | true;
  exec?: true;
  error?: ErrorExpectation;
  json?: string;
  status?: number | number[];
  empty?: true;
  headers?: Record<string, Matcher>;
  oneOf?: Expectation[];
}

export interface RawRequest {
  method?: string;
  body?: string;
  binary?: true;
  contentType?: string;
  query?: string;
}

export interface Step {
  transport?: WireTransport;
  request?: Record<string, unknown>;
  raw?: RawRequest;
  headers?: Record<string, string>;
  capture?: Record<string, string>;
  expect: Expectation;
}

export interface CaseDefinition {
  id: string;
  title: string;
  decisions: string[];
  transports?: WireTransport[];
  layers?: Layer[];
  smoke?: boolean;
  requires?: Capability[];
  unless?: Capability[];
  request?: Record<string, unknown>;
  raw?: RawRequest;
  headers?: Record<string, string>;
  expect?: Expectation;
  steps?: Step[];
  pipeline?: boolean;
}

export interface ConformanceCase {
  id: string;
  transport: Transport;
  layer: Layer;
  applicable: boolean;
  definition: CaseDefinition;
  steps: Step[];
  pipeline: boolean;
}

export interface HttpResponse {
  kind: 'http';
  status: number;
  headers: Headers;
  body: Uint8Array;
}

export interface WsResponse {
  kind: 'ws';
  frame: 'text' | 'binary' | 'close' | 'timeout';
  text?: string;
  body?: Uint8Array;
  closeCode?: number;
  closeReason?: string;
}

export interface HttpFailure {
  kind: 'http-failed';
  reset: string;
  status?: number;
  error: string;
}

export interface ConnectorResolved {
  kind: 'connector';
  result: unknown;
}

export interface ConnectorRejected {
  kind: 'connector-rejected';
  error: unknown;
}

export interface ConnectorTimeout {
  kind: 'connector-timeout';
  after: number;
}

export type ConnectorResponse = ConnectorResolved | ConnectorRejected | ConnectorTimeout;

export type Response = HttpResponse | WsResponse | HttpFailure | ConnectorResponse;
