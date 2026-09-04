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
 * @param options.uri The URI for the DuckDB server.
 * @param options.ipc Arrow IPC extraction options.
 * @returns A connector instance.
 */
export function socketConnector(options?: SocketOptions) {
  return new SocketConnector(options);
}

/**
 * A Mosaic connector that queries a DuckDB server over a web socket.
 * Requests are sent as soon as the socket is open. The server answers
 * requests in the order it receives them, so responses are matched to
 * requests by position.
 */
export class SocketConnector implements Connector {
  private _uri: string;
  private _queue: QueueItem[];
  private _connected: boolean;
  private _ws: WebSocket | null;
  private _events: Record<string, (event?: unknown) => void>;

  /**
   * @param options Connector options.
   * @param options.uri The URI for the DuckDB server, defaults to `ws://localhost:3000/`.
   * @param options.ipc Options for Arrow IPC extraction.
   */
  constructor({
    uri = 'ws://localhost:3000/',
    ipc = undefined,
  }: SocketOptions = {}) {
    this._uri = uri;
    this._queue = [];
    this._connected = false;
    this._ws = null;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const c = this;
    this._events = {
      open() {
        c._connected = true;
        for (const { query } of c._queue) c.send(query);
      },

      close() {
        c._connected = false;
        c._ws = null;
        c.fail('Socket closed');
      },

      error(event: unknown) {
        if (c._queue.length) {
          c.fail(event);
        } else {
          console.error('WebSocket error: ', event);
        }
      },

      message(msg: unknown) {
        const { data } = msg as { data: unknown };
        const item = c._queue.shift();
        if (!item) {
          console.log('WebSocket message: ', data);
          return;
        }
        const { query, resolve, reject } = item;
        try {
          if (typeof data === 'string') {
            const json = JSON.parse(data);
            if (json.error) {
              reject(json.error);
            } else {
              resolve(json);
            }
          } else if (query.type === 'exec') {
            resolve();
          } else if (query.type === 'arrow') {
            resolve(decodeIPC(data as Uint8Array, ipc));
          } else {
            reject(new Error(`Unexpected socket data: ${data}`));
          }
        } catch (err) {
          reject(err);
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
    if (this._connected) this.send(query);
    this._queue.push({ query, resolve, reject });
  }

  private send(query: ConnectorQueryRequest): void {
    this._ws!.send(JSON.stringify(query));
  }

  private fail(reason: unknown): void {
    const queue = this._queue;
    this._queue = [];
    for (const { reject } of queue) reject(reason);
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