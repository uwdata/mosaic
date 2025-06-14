import { describe, it, expect } from 'vitest';
import { throttle } from '../src/util/throttle.js';
import { QueryResult } from '../src/util/query-result.js';

async function wait() {
  return new Promise(setTimeout);
}

describe('throttle', () => {
  it('should throttle successful query results', async () => {
    const requests = [];
    const throttled = throttle(() => {
      const req = new QueryResult();
      requests.push(req);
      return req;
    });

    throttled();
    await wait();
    expect(requests.length).toBe(1);

    throttled();
    await wait();
    expect(requests.length).toBe(1);

    requests[0].fulfill('fulfilled');
    await wait();

    expect(requests.length).toBe(2);
  });

  it('should throttle unsuccessful query results', async () => {
    const requests = [];
    const throttled = throttle(() => {
      const req = new QueryResult();
      requests.push(req);
      return req;
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
