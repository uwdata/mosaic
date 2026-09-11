export enum EventType {
  QueryStart = 'query-start',
  QueryEnd = 'query-end',
  Warning = 'warning',
  Error = 'error',
}

abstract class MosaicEventBase<T extends EventType = EventType> {
  readonly type: T;
  readonly timestamp: number;

  protected constructor(type: T, timestamp: number = performance.now()) {
    this.type = type;
    this.timestamp = timestamp;
  }
}

export interface QueryStartEventInit {
  queryId: number;
  query: string;
  cached: boolean;
  timestamp?: number;
}

export type QueryEndStatus = 'success' | 'error';

export interface QueryEndEventInit extends QueryStartEventInit {
  status: QueryEndStatus;
}

export class MosaicQueryStartEvent extends MosaicEventBase<EventType.QueryStart> {
  readonly queryId: number;
  readonly query: string;
  readonly cached: boolean;

  constructor({ queryId, query, cached, timestamp }: QueryStartEventInit) {
    super(EventType.QueryStart, timestamp);
    this.queryId = queryId;
    this.query = query;
    this.cached = cached;
  }
}

export class MosaicQueryEndEvent extends MosaicEventBase<EventType.QueryEnd> {
  readonly queryId: number;
  readonly query: string;
  readonly cached: boolean;
  readonly status: QueryEndStatus;

  constructor({ queryId, query, cached, status, timestamp }: QueryEndEventInit) {
    super(EventType.QueryEnd, timestamp);
    this.queryId = queryId;
    this.query = query;
    this.cached = cached;
    this.status = status;
  }
}

export interface MosaicWarningEventInit {
  message: string;
  timestamp?: number;
}

export class MosaicWarningEvent extends MosaicEventBase<EventType.Warning> {
  readonly message: string;

  constructor({ message, timestamp }: MosaicWarningEventInit) {
    super(EventType.Warning, timestamp);
    this.message = message;
  }
}

export interface MosaicErrorEventInit {
  error: unknown;
  timestamp?: number;
}

export class MosaicErrorEvent extends MosaicEventBase<EventType.Error> {
  readonly error: unknown;

  constructor({ error, timestamp }: MosaicErrorEventInit) {
    super(EventType.Error, timestamp);
    this.error = error;
  }

  get message(): string {
    return this.error instanceof Error ? this.error.message : String(this.error);
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
