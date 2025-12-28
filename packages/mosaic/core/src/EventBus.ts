import { ObserveDispatch } from './util/ObserveDispatch.js';

export enum EventType {
  QueryStart = 'query-start',
  QueryEnd = 'query-end',
  ClientConnect = 'client-connect',
  ClientStateChange = 'client-state-change',
  Error = 'error'
}

export interface QueryStartEvent {
  query: string;
  materialized: boolean;
  clientId?: string;
  timestamp: number;
}

export interface QueryEndEvent {
  query: string;
  materialized: boolean;
  clientId?: string;
  timestamp: number;
}

export interface ClientConnectEvent {
  clientId: string;
  timestamp: number;
}

export interface ErrorEvent {
  message: unknown;
  timestamp: number;
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
    this.dispatch.emit(type, value);
  }
}
