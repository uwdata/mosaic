import { TableRefNode } from '@uwdata/mosaic-sql';
import type { Connector, PreaggResponse } from '../connectors/Connector.js';
import {
  AbortError,
  ConnectorError,
  isAbortError,
  parsePreaggResponse,
  referenceParts
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
  timeoutMs: number;
  cooldownMs: number;
}

const defaultLimits: Readonly<PreAggregateLimits> = Object.freeze({
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

  lookup(sql: string): TableRefNode | null {
    return this.entries.get(sql)?.table ?? null;
  }

  invalidate(sql: string, table: TableRefNode): void {
    // A late failure for an older build must not drop its replacement.
    if (this.lookup(sql) === table) this.entries.delete(sql);
    this.manager.invalidate();
  }

  request(sql: string): Promise<TableRefNode> {
    const failure = this.failures.get(sql);
    if (failure) {
      if (Date.now() < failure.retryAt) {
        this.manager.logger().debug('Preagg throttled', sql);
        return Promise.reject(new ConnectorError(
          `Preaggregation throttled after a recent failure: ${failure.error.message}`,
          { cause: failure.error }
        ));
      }
      this.failures.delete(sql);
    }

    const existing = this.entries.get(sql);
    if (existing) return existing.build ? existing.build.promise : Promise.resolve(existing.table!);

    const entry: Entry = { sql, table: null, build: null };
    this.entries.set(sql, entry);
    const build = entry.build = this.createBuild(entry);
    this.dispatch(build, this.manager.connector()!);
    return build.promise;
  }

  reset(): void {
    for (const entry of this.entries.values()) {
      if (entry.build) this.fail(entry.build, new AbortError('Preaggregates reset'));
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
      this.fail(build, new ConnectorError('Preaggregation deadline exceeded'));
    }, this.limits.timeoutMs);
    (build.timer as { unref?: () => void }).unref?.();
    return build;
  }

  private dispatch(build: Build, db: Connector): void {
    const request = { type: 'preagg' as const, sql: build.entry.sql };
    this.manager.logger().debug('Preagg', request);
    new Promise<unknown>(resolve => resolve(db.query(request)))
      .then(parsePreaggResponse)
      .then(response => this.complete(build, response), err => this.fail(build, err));
  }

  private complete(build: Build, response: PreaggResponse): void {
    if (!this.claim(build)) return;
    const { entry } = build;
    entry.table = new TableRefNode(referenceParts(response.reference));
    build.resolve(entry.table);
  }

  private fail(build: Build, err: unknown): void {
    if (!this.claim(build)) return;
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

  private claim(build: Build): boolean {
    if (build.entry.build !== build) return false;
    clearTimeout(build.timer);
    build.entry.build = null;
    return true;
  }

  private recordFailure(entry: Entry, error: ConnectorError): void {
    this.failures.set(entry.sql, { error, retryAt: Date.now() + this.limits.cooldownMs });
    this.manager.logger().warn('Preagg failure', entry.sql, error);
  }
}
