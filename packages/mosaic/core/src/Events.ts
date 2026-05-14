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
  query: string;
  materialized: boolean;
  timestamp?: number;
}

export class MosaicQueryStartEvent extends MosaicEventBase<EventType.QueryStart> {
  readonly query: string;
  readonly materialized: boolean;

  constructor({ query, materialized, timestamp }: QueryLifecycleEventInit) {
    super(EventType.QueryStart, timestamp);
    this.query = query;
    this.materialized = materialized;
  }
}

export class MosaicQueryEndEvent extends MosaicEventBase<EventType.QueryEnd> {
  readonly query: string;
  readonly materialized: boolean;

  constructor({ query, materialized, timestamp }: QueryLifecycleEventInit) {
    super(EventType.QueryEnd, timestamp);
    this.query = query;
    this.materialized = materialized;
  }
}

export interface MosaicMessageEventInit {
  message: string;
  timestamp?: number;
}

export class MosaicWarningEvent extends MosaicEventBase<EventType.Warning> {
  readonly message: string;

  constructor({ message, timestamp }: MosaicMessageEventInit) {
    super(EventType.Warning, timestamp);
    this.message = message;
  }
}

export class MosaicErrorEvent extends MosaicEventBase<EventType.Error> {
  readonly message: string;

  constructor({ message, timestamp }: MosaicMessageEventInit) {
    super(EventType.Error, timestamp);
    this.message = message;
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
