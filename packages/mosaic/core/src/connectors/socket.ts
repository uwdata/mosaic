import type { ExtractionOptions, Table } from '@uwdata/flechette';
import type { ArrowQueryRequest, Connector, ExecQueryRequest, JSONQueryRequest, ConnectorQueryRequest } from './Connector.js';
import { decodeIPC } from '../util/decode-ipc.js';

interface SocketOptions {
  uri?: string;
  ipc?: ExtractionOptions;
}

interface QueueItem<T = unknown> {
  query: ConnectorQueryRequest;
  resolve: (value?: T) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Connect to a DuckDB server over a WebSocket interface.
 * @param options Connector options.
 * @param options.uri The URI for the DuckDB REST server.
 * @param options.ipc Arrow IPC extraction options.
 * @returns A connector instance.
 */
export function socketConnector(options?: SocketOptions) {
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
  private _events: Record<string, (event?: unknown) => void>;

  /**
   * @param options Connector options.
   * @param options.uri The URI for the DuckDB REST server.
   * @param options.ipc Arrow IPC extraction options.
   */
  constructor({
    uri = 'ws://localhost:3000/',
    ipc = undefined,
  }: SocketOptions = {}) {
    this._uri = uri;
    this._queue = [];
    this._connected = false;
    this._request = null;
    this._ws = null;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
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

      error(event: unknown) {
        if (c._request) {
          const { reject } = c._request;
          c._request = null;
          c.next();
          reject(event);
        } else {
          console.error('WebSocket error: ', event);
        }
      },

      message(msg: unknown) {
        const { data } = msg as { data: unknown };
        if (c._request) {
          const { query, resolve, reject } = c._request;

          // clear state, start next request
          c._request = null;
          c.next();

          // process result
          if (typeof data === 'string') {
            const json = JSON.parse(data);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            json.error ? reject(json.error) : resolve(json);
          } else if (query.type === 'exec') {
            resolve();
          } else if (query.type === 'arrow') {
            resolve(decodeIPC(data as Uint8Array, ipc));
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

  enqueue(
    query: ConnectorQueryRequest,
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void
  ): void {
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
  query(query: JSONQueryRequest): Promise<Record<string, unknown>[]>;
  query(query: ConnectorQueryRequest): Promise<unknown> {
    return new Promise(
      (resolve, reject) => this.enqueue(query, resolve, reject)
    );
  }
}