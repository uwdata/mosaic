import type { Connector } from '../../src/connectors/Connector.js';

export interface HeldRequest {
  type: string;
  sql: string;
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

/** A connector that holds every request until the test answers it. */
export function heldConnector() {
  const requests: HeldRequest[] = [];
  const connector = {
    query: ({ type, sql }: { type: string; sql: string }) =>
      new Promise<unknown>((resolve, reject) => requests.push({ type, sql, resolve, reject }))
  } as unknown as Connector;
  return { connector, requests };
}
