import { TableRefNode } from '@uwdata/mosaic-sql';
import { QueryResult } from '../util/query-result.js';
import {
  AbortError,
  ConnectorError,
  isAbortError,
  parsePreaggResponse
} from '../connectors/errors.js';
import type { QueryManager } from '../QueryManager.js';

interface Build {
  result: QueryResult<TableRefNode>;
  timer?: ReturnType<typeof setTimeout>;
}

interface Failure {
  error: ConnectorError;
  retryAt: number;
}

const cooldownMs = 60 * 1000;

/**
 * Materializations keyed by exact SELECT text, each holding its
 * server-assigned table reference. Requests go straight to the connector
 * rather than through QueryManager so they never enter the SQL result cache,
 * consolidation, or exec ordering.
 */
export class PreAggregateRegistry {
  private entries = new Map<string, Build | TableRefNode>();
  private failures = new Map<string, Failure>();

  constructor(private manager: Pick<QueryManager, 'connector' | 'logger' | 'invalidate' | 'timeout'>) {}

  lookup(sql: string): TableRefNode | null {
    const entry = this.entries.get(sql);
    return entry instanceof TableRefNode ? entry : null;
  }

  invalidate(sql: string, table: TableRefNode): void {
    // A late failure for an older build must not drop its replacement.
    if (this.lookup(sql) === table) this.entries.delete(sql);
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

    const entry = this.entries.get(sql);
    if (entry instanceof TableRefNode) return Promise.resolve(entry);
    if (entry) return entry.result;

    const build: Build = { result: new QueryResult() };
    build.result.catch(() => {});
    this.entries.set(sql, build);
    const ms = this.manager.timeout();
    if (ms) {
      build.timer = setTimeout(() => {
        const error = new ConnectorError('Preaggregation deadline exceeded');
        this.manager.logger().warn('Preagg timeout', sql, error);
        build.result.reject(error);
      }, ms);
      (build.timer as { unref?: () => void }).unref?.();
    }
    void this.materialize(sql, build);
    return build.result;
  }

  reset(): void {
    for (const entry of this.entries.values()) {
      if (entry instanceof TableRefNode) continue;
      clearTimeout(entry.timer);
      entry.result.reject(new AbortError('Preaggregates reset'));
    }
    this.entries.clear();
    this.failures.clear();
    this.manager.invalidate();
  }

  private async materialize(sql: string, build: Build): Promise<void> {
    const request = { type: 'preagg' as const, sql };
    this.manager.logger().debug('Preagg', request);
    try {
      const response = await new Promise<unknown>(resolve => resolve(this.manager.connector()!.query(request)));
      if (this.entries.get(sql) !== build) return;
      const table = new TableRefNode(parsePreaggResponse(response).reference);
      this.entries.set(sql, table);
      build.result.fulfill(table);
    } catch (err) {
      if (this.entries.get(sql) !== build) return;
      this.entries.delete(sql);
      if (isAbortError(err)) {
        build.result.reject(err);
        return;
      }
      const error = err instanceof ConnectorError ? err
        : new ConnectorError(err instanceof Error ? err.message : String(err), { cause: err });
      this.failures.set(sql, { error, retryAt: Date.now() + cooldownMs });
      this.manager.logger().warn('Preagg failure', sql, error);
      build.result.reject(error);
    } finally {
      clearTimeout(build.timer);
    }
  }
}
