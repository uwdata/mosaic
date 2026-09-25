import { expandRequest } from './cases.ts';
import type { Step, WsResponse } from './types.ts';

const stepTimeout = Number(process.env.CONFORMANCE_STEP_TIMEOUT ?? 15_000);
const openTimeout = 10_000;

type Waiter = (response: WsResponse) => void;

export class WsClient {
  private socket: WebSocket;
  private inbox: WsResponse[] = [];
  private waiters: Waiter[] = [];
  private closed?: WsResponse;

  private constructor(socket: WebSocket) {
    this.socket = socket;
    socket.binaryType = 'arraybuffer';
    socket.addEventListener('message', event => {
      const data = event.data;
      this.push(
        typeof data === 'string'
          ? { kind: 'ws', frame: 'text', text: data }
          : { kind: 'ws', frame: 'binary', body: new Uint8Array(data as ArrayBuffer) }
      );
    });
    socket.addEventListener('close', event => {
      this.closed = { kind: 'ws', frame: 'close', closeCode: event.code, closeReason: event.reason };
      for (const waiter of this.waiters.splice(0)) waiter(this.closed);
    });
    socket.addEventListener('error', () => {});
  }

  static open(url: string): Promise<WsClient> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      const timer = setTimeout(() => {
        socket.close();
        reject(new Error(`WebSocket did not open within ${openTimeout} ms`));
      }, openTimeout);
      socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve(new WsClient(socket));
      }, { once: true });
      socket.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('WebSocket connection failed'));
      }, { once: true });
    });
  }

  send(step: Step, vars: Record<string, string>) {
    const raw = step.raw;
    if (raw?.body !== undefined) {
      this.socket.send(raw.binary ? new TextEncoder().encode(raw.body) : raw.body);
    } else {
      this.socket.send(JSON.stringify(expandRequest(step.request ?? {}, vars)));
    }
  }

  next(): Promise<WsResponse> {
    const queued = this.inbox.shift();
    if (queued) return Promise.resolve(queued);
    if (this.closed) return Promise.resolve(this.closed);
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter(w => w !== waiter);
        resolve({ kind: 'ws', frame: 'timeout' });
      }, stepTimeout);
      const waiter: Waiter = response => {
        clearTimeout(timer);
        resolve(response);
      };
      this.waiters.push(waiter);
    });
  }

  close() {
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close(1000);
    }
  }

  private push(response: WsResponse) {
    const waiter = this.waiters.shift();
    if (waiter) waiter(response);
    else this.inbox.push(response);
  }
}
