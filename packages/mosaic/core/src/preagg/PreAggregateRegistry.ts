import { TableRefNode } from '@uwdata/mosaic-sql';
import type { PreaggResponse } from '../connectors/Connector.js';
import {
  abortError,
  ConnectorError,
  isAbortError,
  parsePreaggResponse,
  PreAggregateModeError
} from '../connectors/errors.js';
import type { QueryManager } from '../QueryManager.js';

interface Build {
  entry: Entry;
  timer: ReturnType<typeof setTimeout>;
  settled: boolean;
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

function toConnectorError(err: unknown): ConnectorError {
  if (err instanceof ConnectorError) return err;
  return new ConnectorError(err instanceof Error ? err.message : String(err), { cause: err });
}

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

  isCurrent(sql: string, table: TableRefNode | null): boolean {
    const entry = this.entries.get(sql);
    return !!entry && !!table && !entry.build && entry.table === table;
  }

  invalidate(sql: string, table: TableRefNode): void {
    // A late failure for an older build must not evict its replacement.
    if (this.entries.get(sql)?.table === table) this.entries.delete(sql);
    this.manager.invalidate();
  }

  request(sql: string): Promise<TableRefNode> {
    if (!this.manager.connector()) {
      return Promise.reject(new PreAggregateModeError('No database connector is available for preaggregation'));
    }
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
      if (entry.build) return entry.build.promise;
      if (entry.table) return Promise.resolve(entry.table);
    }
    if (this.pending >= this.limits.maxPendingBuilds) {
      return Promise.reject(new ConnectorError('Preaggregation lane is busy', { code: 'lane_busy' }));
    }

    entry ??= { sql, table: null, build: null };
    this.entries.set(sql, entry);
    const build = entry.build = this.createBuild(entry);
    this.dispatch(build);
    return build.promise;
  }

  reset(): void {
    for (const entry of Array.from(this.entries.values())) {
      this.entries.delete(entry.sql);
      if (entry.build) this.fail(entry.build, abortError('Preaggregates reset'));
    }
    this.failures.clear();
    this.manager.invalidate();
  }

  private createBuild(entry: Entry): Build {
    let resolve!: (table: TableRefNode) => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<TableRefNode>((res, rej) => { resolve = res; reject = rej; });
    promise.catch(() => {});
    const build: Build = { entry, settled: false, timer: null!, promise, resolve, reject };
    build.timer = setTimeout(() => {
      this.fail(build, new ConnectorError('Preaggregation deadline exceeded', { code: 'deadline_exceeded' }));
    }, this.limits.timeoutMs);
    (build.timer as { unref?: () => void }).unref?.();
    return build;
  }

  private dispatch(build: Build): void {
    const db = this.manager.connector()!;
    const request = { type: 'preagg' as const, sql: build.entry.sql };
    this.manager.logger().debug('Preagg', request);
    new Promise<PreaggResponse>(resolve => resolve(db.query(request))).then(
      response => this.complete(build, response),
      err => this.fail(build, err)
    );
  }

  private isCurrentEntry(build: Build): boolean {
    return this.entries.get(build.entry.sql) === build.entry;
  }

  private complete(build: Build, response: PreaggResponse): void {
    if (build.settled) return;
    let validated: PreaggResponse;
    try {
      validated = parsePreaggResponse(response);
    } catch (err) {
      this.fail(build, err);
      return;
    }
    const { entry } = build;
    const current = this.isCurrentEntry(build);
    this.settle(build);
    if (!current) {
      build.reject(abortError('Preaggregate retired'));
      return;
    }

    const { catalog, schema, table } = validated;
    entry.table = new TableRefNode([catalog, schema, table]);
    this.failures.delete(entry.sql);
    // a table evicted from this cache may be rebuilt by the server under the
    // same name with different rows, so any completion can stale cached results
    this.manager.invalidate();
    build.resolve(entry.table);
    this.pruneEntries(entry);
  }

  private fail(build: Build, err: unknown): void {
    if (build.settled) return;
    const { entry } = build;
    const current = this.isCurrentEntry(build);
    this.settle(build);
    const reason = isAbortError(err) ? err : toConnectorError(err);
    if (current && !isAbortError(reason)) this.recordFailure(entry, reason as ConnectorError);
    build.reject(reason);
    if (current) this.pruneEntries(entry);
  }

  private settle(build: Build): void {
    build.settled = true;
    clearTimeout(build.timer);
    if (build.entry.build === build) build.entry.build = null;
  }

  private pruneEntries(entry: Entry): void {
    if (!entry.table) {
      this.entries.delete(entry.sql);
      return;
    }
    let cached = 0;
    for (const e of this.entries.values()) if (e.table && !e.build) cached++;
    for (const e of this.entries.values()) {
      if (cached <= this.limits.maxCachedTables) return;
      if (e.table && !e.build) {
        this.entries.delete(e.sql);
        cached--;
      }
    }
  }

  private recordFailure(entry: Entry, error: ConnectorError): void {
    this.failures.delete(entry.sql);
    this.failures.set(entry.sql, { error, retryAt: Date.now() + this.limits.cooldownMs });
    while (this.failures.size > this.limits.maxFailures) {
      this.failures.delete(this.failures.keys().next().value!);
    }
    this.manager.logger().debug('Preagg failure', error.code ?? 'transport', entry.sql);
  }
}
