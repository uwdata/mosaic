export enum EventType {
  QueryStart = 'query-start',
  QueryEnd = 'query-end',
  ClientConnect = 'client-connect',
  ClientStateChange = 'client-state-change',
  Error = 'error'
}

export interface MosaicEvent {
  timestamp: number;
  // Extend later with more fields
}

export interface QueryStartEvent extends MosaicEvent {
  query: string;
  materialized: boolean;
}

export interface QueryEndEvent extends MosaicEvent {
  query: string;
  materialized: boolean;
}

export interface ClientConnectEvent extends MosaicEvent {
  clientId?: string;
}

export interface ErrorEvent extends MosaicEvent {
  message: unknown;
}
