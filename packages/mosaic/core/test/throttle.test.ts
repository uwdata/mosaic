import { describe, it, expect } from 'vitest';
import { throttle } from '../src/util/throttle.js';

async function wait() {
  return new Promise<void>(resolve => setTimeout(resolve));
}

describe('throttle', () => {
  it('should throttle successful query results', async () => {
    const requests: PromiseWithResolvers<unknown>[] = [];
    const throttled = throttle(() => {
      const req = Promise.withResolvers();
      requests.push(req);
      return req.promise;
    });

    throttled();
    await wait();
    expect(requests.length).toBe(1);

    throttled();
    await wait();
    expect(requests.length).toBe(1);

    requests[0].resolve('fulfilled');
    await wait();

    expect(requests.length).toBe(2);
  });

  it('should throttle unsuccessful query results', async () => {
    const requests: PromiseWithResolvers<unknown>[] = [];
    const throttled = throttle(() => {
      const req = Promise.withResolvers();
      requests.push(req);
      return req.promise;
    });

    throttled();
    await wait();
    expect(requests.length).toBe(1);

    throttled();
    await wait();
    expect(requests.length).toBe(1);

    requests[0].reject('rejected');
    await wait();

    expect(requests.length).toBe(2);
  });
});
