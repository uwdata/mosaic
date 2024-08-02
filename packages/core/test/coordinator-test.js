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

    const r0 = coord.query();
    const r1 = coord.query();
    const r2 = coord.query();
    const r3 = coord.query();

    // queries have not been sent yet
    assert.equal(promises.length, 0);

    await wait();

    // all queries should have been sent to the connector
    assert.equal(promises.length, 4);

    // resolve promises in reverse order
    promises.at(-1).fulfill();
    assert.equal(r0.pending, true);

    promises.at(-2).fulfill();
    assert.equal(r1.pending, true);

    promises.at(-3).fulfill();
    assert.equal(r2.pending, true);

    // promises are only fulfilled after the last request to the coordinator resolves
    promises.at(-4).fulfill();
    assert.equal(r0.pending, false);
    assert.equal(r1.pending, false);
    assert.equal(r2.pending, false);
    assert.equal(r3.pending, false);
  });
});
