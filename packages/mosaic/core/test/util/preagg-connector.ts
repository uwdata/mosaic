import { count, Query } from '@uwdata/mosaic-sql';
import type { Connector, ConnectorRequest, PreaggResponse } from '../../src/connectors/Connector.js';
import { ConnectorError } from '../../src/connectors/errors.js';
import { Coordinator, Selection } from '../../src/index.js';
import type { PreAggregateLimits } from '../../src/preagg/PreAggregateRegistry.js';
import { fnv_hash } from '../../src/util/hash.js';
import { TestClient } from './test-client.js';

export interface PendingRequest {
  request: ConnectorRequest;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export function preaggResponse(sql: string, suffix = ''): PreaggResponse {
  return {
    catalog: 'memory',
    schema: 'mosaic_scope_test',
    table: `preagg_${fnv_hash(sql).toString(16)}${suffix}`,
    createdAt: new Date().toISOString()
  };
}

/**
 * A connector whose preagg requests stay pending until the test settles
 * them. Other request types are answered by `handler`.
 */
export class MockPreaggConnector implements Connector {
  readonly requests: ConnectorRequest[] = [];
  readonly open: PendingRequest[] = [];
  handler: (request: ConnectorRequest) => unknown;
  supportsPreagg: boolean;

  constructor({
    handler = () => [],
    supportsPreagg = true
  }: {
    handler?: (request: ConnectorRequest) => unknown;
    supportsPreagg?: boolean;
  } = {}) {
    this.handler = handler;
    this.supportsPreagg = supportsPreagg;
  }

  get preaggRequests() {
    return this.requests.filter(r => r.type === 'preagg');
  }

  sql(type = 'arrow'): string[] {
    return this.requests.filter(r => r.type === type).map(r => r.sql);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query(request: any): Promise<any> {
    this.requests.push(request);
    if (request.type !== 'preagg') {
      return Promise.resolve(this.handler(request));
    }
    if (!this.supportsPreagg) {
      return Promise.reject(new ConnectorError('Unsupported command: preagg', { code: 'unsupported_command' }));
    }
    return new Promise((resolve, reject) => {
      const item: PendingRequest = { request, resolve, reject };
      const settle = (fn: (v: unknown) => void) => (v: unknown) => {
        const i = this.open.indexOf(item);
        if (i >= 0) this.open.splice(i, 1);
        fn(v);
      };
      item.resolve = settle(resolve);
      item.reject = settle(reject);
      this.open.push(item);
    });
  }

  /** Resolve the oldest pending preagg request with a generated reference. */
  complete(suffix = ''): PreaggResponse {
    const item = this.open[0];
    if (!item) throw new Error('No pending preagg request');
    const response = preaggResponse((item.request as { sql: string }).sql, suffix);
    item.resolve(response);
    return response;
  }

  fail(error: unknown): void {
    const item = this.open[0];
    if (!item) throw new Error('No pending preagg request');
    item.reject(error);
  }
}

export function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function preaggCoordinator(connector: Connector, limits: Partial<PreAggregateLimits> = {}) {
  const mc = new Coordinator(connector, {
    logger: null,
    cache: false,
    consolidate: false,
    preagg: { mode: 'preagg' }
  });
  const registry = mc.preaggregator.registry!;
  registry.limits = { ...registry.limits, ...limits };
  return mc;
}

export async function aggregateClient(mc: Coordinator, sel = Selection.single({ cross: true })) {
  const results: unknown[] = [];
  const client = new TestClient(
    Query.from('testData').select({ measure: count() }),
    sel,
    { queryResult(data: unknown) { results.push(data); return this; } }
  );
  mc.connect(client);
  await client.pending;
  return { client, sel, results };
}
