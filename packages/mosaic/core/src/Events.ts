export enum EventType {
  QueryStart = "query-start",
  QueryEnd = "query-end",
  Warning = "warning",
  Error = "error",
}

export abstract class MosaicEvent<T extends EventType = EventType> {
  readonly type: T;
  readonly timestamp: number;

  protected constructor(type: T, timestamp: number = Date.now()) {
    this.type = type;
    this.timestamp = timestamp;
  }
}

export interface QueryLifecycleEventInit {
  query: string;
  materialized: boolean;
  timestamp?: number;
}

export class QueryStartEvent extends MosaicEvent<EventType.QueryStart> {
  readonly query: string;
  readonly materialized: boolean;

  constructor({ query, materialized, timestamp }: QueryLifecycleEventInit) {
    super(EventType.QueryStart, timestamp);
    this.query = query;
    this.materialized = materialized;
  }
}

export class QueryEndEvent extends MosaicEvent<EventType.QueryEnd> {
  readonly query: string;
  readonly materialized: boolean;

  constructor({ query, materialized, timestamp }: QueryLifecycleEventInit) {
    super(EventType.QueryEnd, timestamp);
    this.query = query;
    this.materialized = materialized;
  }
}

export interface MessageEventInit {
  message: string;
  timestamp?: number;
}

export class WarningEvent extends MosaicEvent<EventType.Warning> {
  readonly message: string;

  constructor({ message, timestamp }: MessageEventInit) {
    super(EventType.Warning, timestamp);
    this.message = message;
  }
}

export class ErrorEvent extends MosaicEvent<EventType.Error> {
  readonly message: string;

  constructor({ message, timestamp }: MessageEventInit) {
    super(EventType.Error, timestamp);
    this.message = message;
  }
}

export type MosaicEvents =
  | QueryStartEvent
  | QueryEndEvent
  | WarningEvent
  | ErrorEvent;

export type MosaicEventMap = {
  [EventType.QueryStart]: QueryStartEvent;
  [EventType.QueryEnd]: QueryEndEvent;
  [EventType.Warning]: WarningEvent;
  [EventType.Error]: ErrorEvent;
};
