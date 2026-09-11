import { TableRefNode } from '@uwdata/mosaic-sql';
import type { Connector, PreaggResponse } from '../connectors/Connector.js';
import {
  abortError,
  ConnectorError,
  isAbortError,
  parsePreaggResponse
} from '../connectors/errors.js';
import type { QueryManager } from '../QueryManager.js';

interface Build {
  entry: Entry;
  timer: ReturnType<typeof setTimeout>;
  promise: Promise<TableRefNode>;
  resolve: (table: TableRefNode) => void;
  reject: (err: unknown) => void;
}

interface Entry {
  sql: string;
  table: TableRefNode | null;
  build: Build | null;
}

interface Failure {
  error: ConnectorError;
  retryAt: number;
}

export interface PreAggregateLimits {
  maxCachedTables: number;
  maxPendingBuilds: number;
  maxFailures: number;
  timeoutMs: number;
  cooldownMs: number;
}

const defaultLimits: Readonly<PreAggregateLimits> = Object.freeze({
  maxCachedTables: 512,
  maxPendingBuilds: 32,
  maxFailures: 256,
  timeoutMs: 120 * 1000,
  cooldownMs: 60 * 1000
});

/**
 * Materializations keyed by exact SELECT text, each holding its
 * server-assigned table reference. Requests go straight to the connector
 * rather than through QueryManager so they never enter the SQL result cache,
 * consolidation, or exec ordering.
 */
export class PreAggregateRegistry {
  private manager: Pick<QueryManager, 'connector' | 'logger' | 'invalidate'>;
  private entries = new Map<string, Entry>();
  private failures = new Map<string, Failure>();
  limits: Readonly<PreAggregateLimits> = defaultLimits;

  constructor(manager: Pick<QueryManager, 'connector' | 'logger' | 'invalidate'>) {
    this.manager = manager;
  }

  get pending(): number {
    let n = 0;
    for (const e of this.entries.values()) if (e.build) n++;
    return n;
  }

  lookup(sql: string): TableRefNode | null {
    return this.entries.get(sql)?.table ?? null;
  }

  invalidate(sql: string, table: TableRefNode): void {
    // A late failure for an older build must not evict its replacement.
    if (this.lookup(sql) === table) this.entries.delete(sql);
    this.manager.invalidate();
  }

  request(sql: string): Promise<TableRefNode> {
    const failure = this.failures.get(sql);
    if (failure) {
      if (Date.now() < failure.retryAt) {
        return Promise.reject(new ConnectorError(
          `Preaggregation suppressed: ${failure.error.message}`, { code: 'suppressed', cause: failure.error }
        ));
      }
      this.failures.delete(sql);
    }

    let entry = this.entries.get(sql);
    if (entry) {
      this.entries.delete(sql);
      this.entries.set(sql, entry);
      return entry.build ? entry.build.promise : Promise.resolve(entry.table!);
    }
    if (this.pending >= this.limits.maxPendingBuilds) {
      return Promise.reject(new ConnectorError('Preaggregation lane is busy', { code: 'lane_busy' }));
    }

    entry = { sql, table: null, build: null };
    this.entries.set(sql, entry);
    const build = entry.build = this.createBuild(entry);
    this.dispatch(build, this.manager.connector()!);
    return build.promise;
  }

  reset(): void {
    for (const entry of this.entries.values()) {
      if (entry.build) this.fail(entry.build, abortError('Preaggregates reset'));
    }
    this.entries.clear();
    this.failures.clear();
    this.manager.invalidate();
  }

  private createBuild(entry: Entry): Build {
    let resolve!: (table: TableRefNode) => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<TableRefNode>((res, rej) => { resolve = res; reject = rej; });
    promise.catch(() => {});
    const build: Build = { entry, timer: null!, promise, resolve, reject };
    build.timer = setTimeout(() => {
      this.fail(build, new ConnectorError('Preaggregation deadline exceeded', { code: 'deadline_exceeded' }));
    }, this.limits.timeoutMs);
    (build.timer as { unref?: () => void }).unref?.();
    return build;
  }

  private dispatch(build: Build, db: Connector): void {
    const request = { type: 'preagg' as const, sql: build.entry.sql };
    this.manager.logger().debug('Preagg', request);
    new Promise<PreaggResponse>(resolve => resolve(db.query(request))).then(
      response => this.complete(build, response),
      err => this.fail(build, err)
    );
  }

  private complete(build: Build, response: PreaggResponse): void {
    if (build.entry.build !== build) return;
    let validated: PreaggResponse;
    try {
      validated = parsePreaggResponse(response);
    } catch (err) {
      this.fail(build, err);
      return;
    }
    this.settle(build);
    const { entry } = build;
    const { catalog, schema, table } = validated;
    entry.table = new TableRefNode([catalog, schema, table]);
    // a table evicted from this cache may be rebuilt by the server under the
    // same name with different rows, so any completion can stale cached results
    this.manager.invalidate();
    build.resolve(entry.table);
    this.evict();
  }

  private fail(build: Build, err: unknown): void {
    if (build.entry.build !== build) return;
    this.settle(build);
    const { entry } = build;
    this.entries.delete(entry.sql);
    if (isAbortError(err)) {
      build.reject(err);
      return;
    }
    const error = err instanceof ConnectorError ? err
      : new ConnectorError(err instanceof Error ? err.message : String(err), { cause: err });
    this.recordFailure(entry, error);
    build.reject(error);
  }

  private settle(build: Build): void {
    clearTimeout(build.timer);
    build.entry.build = null;
  }

  private evict(): void {
    let cached = 0;
    for (const e of this.entries.values()) if (e.table) cached++;
    for (const e of this.entries.values()) {
      if (cached <= this.limits.maxCachedTables) return;
      if (e.table) {
        this.entries.delete(e.sql);
        cached--;
      }
    }
  }

  private recordFailure(entry: Entry, error: ConnectorError): void {
    this.failures.set(entry.sql, { error, retryAt: Date.now() + this.limits.cooldownMs });
    while (this.failures.size > this.limits.maxFailures) {
      this.failures.delete(this.failures.keys().next().value!);
    }
    this.manager.logger().debug('Preagg failure', error.code ?? 'transport', entry.sql);
  }
}
