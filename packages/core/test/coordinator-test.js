import assert from "node:assert";
import { Coordinator, coordinator } from "../src/index.js";
import { QueryResult } from "../src/util/query-result.js";

async function wait() {
  return new Promise(setTimeout);
}

describe("coordinator", () => {
  it("has accessible singleton", () => {
    const mc = coordinator();
    assert.ok(mc instanceof Coordinator);

    const mc2 = new Coordinator();
    coordinator(mc2);

    assert.strictEqual(mc2, coordinator());
  });

  it("query results returned in correct order", async () => {
    const promises = [];

    const connector = {
      async query() {
        const promise = new QueryResult();
        promises.push(promise);
        return promise;
      },
    };

    const coord = new Coordinator(connector);

    const results = Array.from({ length: 10 }, () =>
      coord.query()
    );

    // queries have not been sent yet
    assert.equal(promises.length, 0);

    await wait();

    // all queries should have been sent to the connector
    assert.equal(promises.length, 10);

    // resolve promises in reverse order
    for (let i = results.length-1; i >= 0; i--) {
      promises[i].fulfill(i);
    }

    assert.deepStrictEqual(
      await Promise.all(results),
      Array.from({ length: 10 }, (_, i) => i)
    );
  });
});
