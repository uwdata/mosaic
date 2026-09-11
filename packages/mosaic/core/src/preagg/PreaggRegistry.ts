import { TableRefNode } from '@uwdata/mosaic-sql';
import type { Connector, PreaggResponse } from '../connectors/Connector.js';
import {
  abortError,
  ConnectorError,
  isAbortError,
  PreaggBusyError,
  PreaggModeError,
  PreaggSuppressedError
} from '../connectors/errors.js';
import type { Logger } from '../types.js';

export interface PreaggRegistryHost {
  connector(): Connector | null;
  logger(): Logger;
  invalidate(): void;
}

interface Job {
  entry: Entry;
  timer: ReturnType<typeof setTimeout>;
  settled: boolean;
  promise: Promise<TableRefNode>;
  resolve: (ref: TableRefNode) => void;
  reject: (err: unknown) => void;
}

interface Entry {
  sql: string;
  ref: TableRefNode | null;
  key: string | null;
  job: Job | null;
}

interface Failure {
  error: ConnectorError;
  until: number;
}

export interface PreaggLimits {
  maxIdleEntries: number;
  maxPendingEntries: number;
  timeoutMs: number;
  cooldownMs: number;
}

export const PREAGG_LIMITS: Readonly<PreaggLimits> = Object.freeze({
  maxIdleEntries: 512,
  maxPendingEntries: 32,
  timeoutMs: 120 * 1000,
  cooldownMs: 60 * 1000
});
const FAILURE_MAP_SIZE = 256;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function validatePreaggResponse(value: unknown): PreaggResponse {
  const { catalog, schema, table, createdAt } = (value ?? {}) as Record<string, unknown>;
  if (
    !isNonEmptyString(catalog) || !isNonEmptyString(schema) ||
    !isNonEmptyString(table) || !isNonEmptyString(createdAt) ||
    Number.isNaN(Date.parse(createdAt))
  ) {
    throw new ConnectorError('Malformed preagg response', { code: 'malformed_response' });
  }
  return { catalog, schema, table, createdAt };
}

function referenceKey(ref: TableRefNode | PreaggResponse): string {
  return JSON.stringify(Array.isArray(ref.table)
    ? ref.table
    : [(ref as PreaggResponse).catalog, (ref as PreaggResponse).schema, ref.table]);
}

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
export class PreaggRegistry {
  private host: PreaggRegistryHost;
  private entries = new Map<string, Entry>();
  private failures = new Map<string, Failure>();
  limits: Readonly<PreaggLimits> = PREAGG_LIMITS;

  constructor(host: PreaggRegistryHost) {
    this.host = host;
  }

  get pending(): number {
    let n = 0;
    for (const e of this.entries.values()) if (e.job) n++;
    return n;
  }

  get size(): number {
    return this.entries.size;
  }

  lookup(sql: string): TableRefNode | null {
    return this.entries.get(sql)?.ref ?? null;
  }

  isCurrent(sql: string, table: TableRefNode | null): boolean {
    const entry = this.entries.get(sql);
    return !!entry && !!table && !entry.job && entry.key === referenceKey(table);
  }

  /**
   * Local refusals (`PreaggBusyError`, `PreaggSuppressedError`,
   * `PreaggModeError`) throw synchronously; server and transport failures
   * reject the returned promise.
   */
  acquire(sql: string): Promise<TableRefNode> {
    if (!this.host.connector()) {
      throw new PreaggModeError('No database connector is available for preaggregation');
    }
    const failure = this.failures.get(sql);
    if (failure) {
      if (Date.now() < failure.until) throw new PreaggSuppressedError(failure.error, failure.until);
      this.failures.delete(sql);
    }

    let entry = this.entries.get(sql);
    if (entry) {
      this.entries.delete(sql);
      this.entries.set(sql, entry);
      if (entry.job) return entry.job.promise;
      if (entry.ref) return Promise.resolve(entry.ref);
    } else {
      entry = { sql, ref: null, key: null, job: null };
      this.entries.set(sql, entry);
    }

    try {
      const job = entry.job = this.createJob(entry);
      this.dispatch(job);
      return job.promise;
    } catch (err) {
      this.entries.delete(sql);
      throw err;
    }
  }

  reset(): void {
    for (const entry of Array.from(this.entries.values())) {
      this.entries.delete(entry.sql);
      if (entry.job) this.fail(entry.job, abortError('Preaggregates reset'));
    }
    this.failures.clear();
    this.host.invalidate();
  }

  private createJob(entry: Entry): Job {
    if (this.pending >= this.limits.maxPendingEntries) throw new PreaggBusyError();
    let resolve!: (ref: TableRefNode) => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<TableRefNode>((res, rej) => { resolve = res; reject = rej; });
    promise.catch(() => {});
    const job: Job = { entry, settled: false, timer: null!, promise, resolve, reject };
    job.timer = setTimeout(() => {
      this.fail(job, new ConnectorError('Preaggregation deadline exceeded', { code: 'deadline_exceeded' }));
    }, this.limits.timeoutMs);
    (job.timer as { unref?: () => void }).unref?.();
    return job;
  }

  private dispatch(job: Job): void {
    const db = this.host.connector()!;
    const request = { type: 'preagg' as const, sql: job.entry.sql };
    this.host.logger().debug('Preagg', request);
    let result: Promise<PreaggResponse>;
    try {
      result = Promise.resolve(db.query(request));
    } catch (err) {
      result = Promise.reject(err);
    }
    result.then(
      response => this.complete(job, response),
      err => this.fail(job, err)
    );
  }

  private isLive(job: Job): boolean {
    return this.entries.get(job.entry.sql) === job.entry;
  }

  private complete(job: Job, response: PreaggResponse): void {
    if (job.settled) return;
    const { entry } = job;
    const live = this.isLive(job);
    this.settleJob(job);
    if (!live) {
      job.reject(abortError('Preaggregate retired'));
      return;
    }

    let validated: PreaggResponse;
    try {
      validated = validatePreaggResponse(response);
    } catch (err) {
      this.recordFailure(entry, toConnectorError(err));
      job.reject(err);
      this.afterJob(entry);
      return;
    }

    const { catalog, schema, table } = validated;
    entry.ref = new TableRefNode([catalog, schema, table]);
    entry.key = referenceKey(validated);
    this.failures.delete(entry.sql);
    // a table evicted from this cache may be rebuilt by the server under the
    // same name with different rows, so any completion can stale cached results
    this.host.invalidate();
    job.resolve(entry.ref);
    this.afterJob(entry);
  }

  private fail(job: Job, err: unknown): void {
    if (job.settled) return;
    const { entry } = job;
    const live = this.isLive(job);
    this.settleJob(job);
    const reason = isAbortError(err) ? err : toConnectorError(err);
    if (live && !isAbortError(reason)) this.recordFailure(entry, reason as ConnectorError);
    job.reject(reason);
    if (live) this.afterJob(entry);
  }

  private settleJob(job: Job): void {
    job.settled = true;
    clearTimeout(job.timer);
    if (job.entry.job === job) job.entry.job = null;
  }

  private afterJob(entry: Entry): void {
    if (!entry.ref) {
      this.entries.delete(entry.sql);
      return;
    }
    let ready = 0;
    for (const e of this.entries.values()) if (e.ref && !e.job) ready++;
    for (const e of this.entries.values()) {
      if (ready <= this.limits.maxIdleEntries) return;
      if (e.ref && !e.job) {
        this.entries.delete(e.sql);
        ready--;
      }
    }
  }

  private recordFailure(entry: Entry, error: ConnectorError): void {
    this.failures.delete(entry.sql);
    this.failures.set(entry.sql, { error, until: Date.now() + this.limits.cooldownMs });
    while (this.failures.size > FAILURE_MAP_SIZE) {
      this.failures.delete(this.failures.keys().next().value!);
    }
    this.host.logger().debug('Preagg failure', error.code ?? 'transport', entry.sql);
  }
}
