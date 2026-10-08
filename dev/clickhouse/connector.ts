import type { ArrowQueryRequest, Connector, ConnectorQueryRequest, ExecQueryRequest } from '@uwdata/mosaic-core';

export class ClickHouseConnector implements Connector {
  constructor(public database = 'default') {}

  query(query: ArrowQueryRequest): Promise<ArrayBuffer>;
  query(query: ExecQueryRequest): Promise<void>;
  async query({ type, sql }: ConnectorQueryRequest): Promise<ArrayBuffer | void> {
    const params = new URLSearchParams({
      database: this.database,
      output_format_arrow_compression_method: 'none',
      wait_end_of_query: '1'
    });
    if (type === 'arrow') params.set('default_format', 'ArrowStream');
    let response: Response;
    try {
      response = await fetch(`/clickhouse/?${params}`, {
        method: 'POST',
        body: sql
      });
    } catch {
      throw new Error('Cannot reach ClickHouse. Start it with pnpm server:clickhouse.');
    }
    if (!response.ok) {
      const message = await response.text();
      // Vite proxy failures have an empty body, unlike ClickHouse query errors.
      if ([500, 502, 504].includes(response.status) && !message.trim()) {
        throw new Error('Cannot reach ClickHouse. Start it with pnpm server:clickhouse.');
      }
      throw new Error(`ClickHouse query failed (${response.status}): ${message}`);
    }
    if (type === 'arrow') return response.arrayBuffer();
    await response.text();
  }
}
