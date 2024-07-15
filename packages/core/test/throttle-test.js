import assert from 'node:assert';
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
        assert.equal(requests.length, 1);

        throttled();
        await wait();
        assert.equal(requests.length, 1);

        requests[0].fulfill('done');
        await wait();

        assert.equal(requests.length, 2);
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
        assert.equal(requests.length, 1);

        throttled();
        await wait();
        assert.equal(requests.length, 1);

        requests[0].reject('done');
        await wait();

        assert.equal(requests.length, 2);
    });
});