import assert from 'node:assert';
import { Coordinator, coordinator } from '../src/index.js';
import { QueryResult } from '../src/util/query-result.js';
import { resolve } from 'node:path';
import { send } from 'vite';

describe('coordinator', () => {
  it('has accessible singleton', () => {
    const mc = coordinator();
    assert.ok(mc instanceof Coordinator);

    const mc2 = new Coordinator();
    coordinator(mc2);

    assert.strictEqual(mc2, coordinator());
  });

  it('query results returned in correct order', async () => {
    class Deferred {
      constructor(id) {
        this.id = id;
        this.promise = new Promise((resolve, reject)=> {
          this.reject = reject
          this.resolve = resolve
        })
      }
    }

    const connector = {
      uid : 0,
      promises : [],

      async query(query) {
        this.uid++;
        let id = this.uid;
        //Earlier queries are resolved later so that they are purposely returned out of order
        let result = new Deferred(id); this.promises.push(result);
        if(this.uid == 10){ 
          for(let i = 9; i >= 0; i--){
            this.promises[i].resolve(this.promises[i].id);
          }
        }
        return result.promise;
      },
    };

    let results = [];
    const coord = new Coordinator(connector);
    for (let i = 0; i < 10; i++) {
      results.push(coord.query({sql: 'SELECT 1 as foo'}));
    }
    assert.deepStrictEqual(await Promise.all(results), [1,2,3,4,5,6,7,8,9,10]);
  });
});
