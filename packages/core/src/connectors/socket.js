/** @import { ExtractionOptions, Table } from '@uwdata/flechette' */
/** @import { ArrowQueryRequest, Connector, ExecQueryRequest, JSONQueryRequest } from './Connector.js' */
import { decodeIPC } from '../util/decode-ipc.js';

/**
 * Connect to a DuckDB server over a WebSocket interface.
 * @param {object} [options] Connector options.
 * @param {string} [options.uri] The URI for the DuckDB REST server.
 * @param {ExtractionOptions} [options.ipc] Arrow IPC extraction options.
 * @returns {SocketConnector} A connector instance.
 */
export function socketConnector(options) {
  return new SocketConnector(options);
}

/**
 * DuckDB socket connector.
 * @implements {Connector}
 */
export class SocketConnector {
  /**
   * @param {object} [options] Connector options.
   * @param {string} [options.uri] The URI for the DuckDB REST server.
   * @param {ExtractionOptions} [options.ipc] Arrow IPC extraction options.
   */
  constructor({
    uri = 'ws://localhost:3000/',
    ipc = undefined,
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
          c._queue.shift().reject('Socket closed');
        }
      },

      error(event) {
        if (c._request) {
          const { reject } = c._request;
          c._request = null;
          c.next();
          reject(event);
        } else {
          console.error('WebSocket error: ', event);
        }
      },

      message({ data }) {
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
    }
  }

  get connected() {
    return this._connected;
  }

  init() {
    this._ws = new WebSocket(this._uri);
    this._ws.binaryType = 'arraybuffer';
    for (const type in this._events) {
      this._ws.addEventListener(type, this._events[type]);
    }
  }

  enqueue(query, resolve, reject) {
    if (this._ws == null) this.init();
    this._queue.push({ query, resolve, reject });
    if (this._connected && !this._request) this.next();
  }

  next() {
    if (this._queue.length) {
      this._request = this._queue.shift();
      this._ws.send(JSON.stringify(this._request.query));
    }
  }

  /**
   * @overload
   * @param {ArrowQueryRequest} query
   * @returns {Promise<Table>}
   *
   * @overload
   * @param {ExecQueryRequest} query
   * @returns {Promise<void>}
   *
   * @overload
   * @param {JSONQueryRequest} query
   * @returns {Promise<Record<string, any>[]>}
   *
   * @param {ArrowQueryRequest | ExecQueryRequest | JSONQueryRequest} query
   * @returns {Promise<Table | void | Record<string, any>[]>}}
   */
  query(query) {
    return new Promise(
      (resolve, reject) => this.enqueue(query, resolve, reject)
    );
  }
}
