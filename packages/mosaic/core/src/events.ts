import { AsyncDispatch } from './util/AsyncDispatch.js';

/**
 * Event payload types for query events
 */
export type QueryStartEvent = {
  query: string;
  materialized: boolean;
  clientId: string;
  timestamp: number;
};

export type QueryEndEvent = {
  query: string;
  materialized: boolean;
  clientId?: string;
  latencyMs?: number;
  numRows?: number;
  numBytes?: number;
  exemplarRows?: Record<string, unknown>[];
  timestamp: number;
};

/**
 * Event payload types for client events
 */
export type ClientStateEvent = {
  clients: Array<{
    clientId: string;
    connected: boolean;
    lastQuery?: string;
    lastLatencyMs?: number;
    lastNumRows?: number;
    lastNumBytes?: number;
    lastExemplarRows?: Record<string, unknown>[];
    children?: Array<{
      clientId: string;
      connected: boolean;
      lastQuery?: string;
      lastLatencyMs?: number;
      lastNumRows?: number;
      lastNumBytes?: number;
      lastExemplarRows?: Record<string, unknown>[];
    }>;
  }>;
  coordinatorState: Record<string, unknown>;
  numConnectedClients: number;
  timestamp: number;
};

/**
 * Singleton event dispatcher for query events.
 * Emits 'start' and 'end' events with query metadata.
 */
export const queryEvents = new AsyncDispatch<QueryStartEvent | QueryEndEvent>();

/**
 * Singleton event dispatcher for client state events.
 * Emits 'state' events with client state information.
 */
export const clientEvents = new AsyncDispatch<ClientStateEvent>();

