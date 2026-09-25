export type Transport = 'post' | 'get' | 'ws';

export type Capability = 'exec' | 'preagg' | 'caching' | 'files';

export type ErrorCode =
  | 'bad_request'
  | 'unauthenticated'
  | 'forbidden'
  | 'table_not_found'
  | 'unsupported_command'
  | 'resource_exhausted'
  | 'deadline_exceeded'
  | 'internal_error';

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

export type Matcher = string | { pattern: string } | { present: true } | { absent: true };

export interface ArrowExpectation {
  columns?: string[];
  rows?: unknown[][];
  rowCount?: number;
}

export interface ErrorExpectation {
  status?: number;
  code: ErrorCode;
  message?: string | { pattern: string };
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
  transport?: Transport;
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
  transports?: Transport[];
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

export type Response = HttpResponse | WsResponse;
