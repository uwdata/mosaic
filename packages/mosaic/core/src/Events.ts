export enum EventType {
  QueryStart = "query-start",
  QueryEnd = "query-end",
  ClientConnect = "client-connect",
  ClientStateChange = "client-state-change",
  Warning = "warning",
  Error = "error",
} 

export type EventMap = {
  [EventType.QueryStart]: Omit<QueryStartEvent, keyof MosaicEvent>;
  [EventType.QueryEnd]: Omit<QueryEndEvent, keyof MosaicEvent>;
  [EventType.ClientConnect]: Omit<ClientConnectEvent, keyof MosaicEvent>;
  [EventType.Warning]: Omit<WarningEvent, keyof MosaicEvent>;
  [EventType.Error]: Omit<ErrorEvent, keyof MosaicEvent>;
};

export interface MosaicEvent {
  timestamp: number;
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

export interface WarningEvent extends MosaicEvent {
  message: string;
}

export interface ErrorEvent extends MosaicEvent {
  message: string;
}

export type MosaicEvents =
  | QueryStartEvent
  | QueryEndEvent
  | ClientConnectEvent
  | WarningEvent
  | ErrorEvent;
