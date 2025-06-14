import type { ExtractionOptions, Table } from '@uwdata/flechette';
import type { ArrowQueryRequest, Connector, ExecQueryRequest, JSONQueryRequest } from './Connector.js';
import { decodeIPC } from '../util/decode-ipc.js';

interface QueueItem {
  query: any;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

/**
 * Connect to a DuckDB server over a WebSocket interface.
 * @param options Connector options.
 * @param options.uri The URI for the DuckDB REST server.
 * @param options.ipc Arrow IPC extraction options.
 * @returns A connector instance.
 */
export function socketConnector(options?: {
  uri?: string;
  ipc?: ExtractionOptions;
}): SocketConnector {
  return new SocketConnector(options);
}

/**
 * DuckDB socket connector.
 */
export class SocketConnector implements Connector {
  private _uri: string;
  private _queue: QueueItem[];
  private _connected: boolean;
  private _request: QueueItem | null;
  private _ws: WebSocket | null;
  private _events: Record<string, (event?: any) => void>;

  /**
   * @param options Connector options.
   * @param options.uri The URI for the DuckDB REST server.
   * @param options.ipc Arrow IPC extraction options.
   */
  constructor({
    uri = 'ws://localhost:3000/',
    ipc = undefined,
  }: {
    uri?: string;
    ipc?: ExtractionOptions;
  } = {}) {
    this._uri = uri;
    this._queue = [];
    this._connected = false;
    this._request = null;
    this._ws = null;

    const c = this;
    this._events = {
      open() {
        c._connected = true;
        c.next();
      },

      close() {
        c._connected = false;
        c._request = null;
        c._ws = null;
        while (c._queue.length) {
          c._queue.shift()!.reject('Socket closed');
        }
      },

      error(event: any) {
        if (c._request) {
          const { reject } = c._request;
          c._request = null;
          c.next();
          reject(event);
        } else {
          console.error('WebSocket error: ', event);
        }
      },

      message({ data }: { data: any }) {
        if (c._request) {
          const { query, resolve, reject } = c._request;

          // clear state, start next request
          c._request = null;
          c.next();

          // process result
          if (typeof data === 'string') {
            const json = JSON.parse(data);
            json.error ? reject(json.error) : resolve(json);
          } else if (query.type === 'exec') {
            resolve();
          } else if (query.type === 'arrow') {
            resolve(decodeIPC(data, ipc));
          } else {
            throw new Error(`Unexpected socket data: ${data}`);
          }
        } else {
          console.log('WebSocket message: ', data);
        }
      }
    };
  }

  get connected(): boolean {
    return this._connected;
  }

  init(): void {
    this._ws = new WebSocket(this._uri);
    this._ws.binaryType = 'arraybuffer';
    for (const type in this._events) {
      this._ws.addEventListener(type, this._events[type]);
    }
  }

  enqueue(query: any, resolve: (value?: any) => void, reject: (reason?: any) => void): void {
    if (this._ws == null) this.init();
    this._queue.push({ query, resolve, reject });
    if (this._connected && !this._request) this.next();
  }

  next(): void {
    if (this._queue.length) {
      this._request = this._queue.shift()!;
      this._ws!.send(JSON.stringify(this._request.query));
    }
  }

  query(query: ArrowQueryRequest): Promise<Table>;
  query(query: ExecQueryRequest): Promise<void>;
  query(query: JSONQueryRequest): Promise<Record<string, any>[]>;
  query(query: ArrowQueryRequest | ExecQueryRequest | JSONQueryRequest): Promise<Table | void | Record<string, any>[]>;
  query(query: any): Promise<any> {
    return new Promise(
      (resolve, reject) => this.enqueue(query, resolve, reject)
    );
  }
}