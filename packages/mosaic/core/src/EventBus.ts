import { ObserveDispatch } from './util/ObserveDispatch.js';

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
  clientId?: string;
}

export interface QueryEndEvent extends MosaicEvent {
  query: string;
  materialized: boolean;
  clientId?: string;
}

export interface ClientConnectEvent extends MosaicEvent {
  clientId: string;
}

export interface ErrorEvent extends MosaicEvent {
  message: unknown;
}

export class EventBus {
  private dispatch = new ObserveDispatch();

  observe(type: EventType, callback: (value: any) => void): void {
    this.dispatch.observe(type, callback);
  }

  unobserve(type: EventType, callback: (value: any) => void): void {
    this.dispatch.unobserve(type, callback);
  }

  emit(type: EventType, value: any): void {
    // Provides extensibility over ObservableDispatch to add fields,
    // additional logic relevant to Mosaic
    this.dispatch.emit(type, { ...value, timestamp: Date.now() });
  }
}
