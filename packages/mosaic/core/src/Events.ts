export enum EventType {
  QueryStart = "query-start",
  QueryEnd = "query-end",
  Warning = "warning",
  Error = "error",
}

abstract class MosaicEventBase<T extends EventType = EventType> {
  readonly type: T;
  readonly timestamp: number;

  protected constructor(type: T, timestamp: number = Date.now()) {
    this.type = type;
    this.timestamp = timestamp;
  }
}

export interface QueryLifecycleEventInit {
  queryId: number;
  query: string;
  materialized: boolean;
  timestamp?: number;
}

export type QueryEndStatus = "success" | "error";

export interface QueryEndEventInit extends QueryLifecycleEventInit {
  status: QueryEndStatus;
}

export class MosaicQueryStartEvent extends MosaicEventBase<EventType.QueryStart> {
  readonly queryId: number;
  readonly query: string;
  readonly materialized: boolean;

  constructor({ queryId, query, materialized, timestamp }: QueryLifecycleEventInit) {
    super(EventType.QueryStart, timestamp);
    this.queryId = queryId;
    this.query = query;
    this.materialized = materialized;
  }
}

export class MosaicQueryEndEvent extends MosaicEventBase<EventType.QueryEnd> {
  readonly queryId: number;
  readonly query: string;
  readonly materialized: boolean;
  readonly status: QueryEndStatus;

  constructor({ queryId, query, materialized, status, timestamp }: QueryEndEventInit) {
    super(EventType.QueryEnd, timestamp);
    this.queryId = queryId;
    this.query = query;
    this.materialized = materialized;
    this.status = status;
  }
}

export interface MosaicMessageEventInit {
  message: string;
  queryId?: number;
  timestamp?: number;
}

export class MosaicWarningEvent extends MosaicEventBase<EventType.Warning> {
  readonly message: string;
  readonly queryId?: number;

  constructor({ message, queryId, timestamp }: MosaicMessageEventInit) {
    super(EventType.Warning, timestamp);
    this.message = message;
    this.queryId = queryId;
  }
}

export class MosaicErrorEvent extends MosaicEventBase<EventType.Error> {
  readonly message: string;
  readonly queryId?: number;

  constructor({ message, queryId, timestamp }: MosaicMessageEventInit) {
    super(EventType.Error, timestamp);
    this.message = message;
    this.queryId = queryId;
  }
}

export type MosaicEvent =
  | MosaicQueryStartEvent
  | MosaicQueryEndEvent
  | MosaicWarningEvent
  | MosaicErrorEvent;

export type MosaicEventMap = {
  [EventType.QueryStart]: MosaicQueryStartEvent;
  [EventType.QueryEnd]: MosaicQueryEndEvent;
  [EventType.Warning]: MosaicWarningEvent;
  [EventType.Error]: MosaicErrorEvent;
};
