import assert from "node:assert";
import { coordinator, Coordinator } from "../src/index.js";
import { QueryResult, QueryState } from "../src/util/query-result.js";

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

    const r0 = coord.query("SELECT 0");
    const r1 = coord.query("SELECT 1");
    const r2 = coord.query("SELECT 2");
    const r3 = coord.query("SELECT 3");

    // queries have not been sent yet
    assert.equal(promises.length, 0);

    await wait();

    // all queries should have been sent to the connector
    assert.equal(promises.length, 4);
    assert.equal(coord.manager.pendingResults.length, 4);

    // resolve promises in reverse order

    promises.at(3).fulfill(0);
    await wait();

    assert.equal(r0.state, QueryState.pending);
    assert.equal(r1.state, QueryState.pending);
    assert.equal(r2.state, QueryState.pending);
    assert.equal(r3.state, QueryState.prepared);

    promises.at(1).fulfill(0);
    await wait();

    assert.equal(r0.state, QueryState.pending);
    assert.equal(r1.state, QueryState.prepared);
    assert.equal(r2.state, QueryState.pending);
    assert.equal(r3.state, QueryState.prepared);

    promises.at(0).fulfill(0);
    await wait();

    assert.equal(coord.manager.pendingResults.length, 2);

    assert.equal(r0.state, QueryState.done);
    assert.equal(r1.state, QueryState.done);
    assert.equal(r2.state, QueryState.pending);
    assert.equal(r3.state, QueryState.prepared);

    promises.at(2).fulfill(0);
    await wait();

    assert.equal(coord.manager.pendingResults.length, 0);

    assert.equal(r0.state, QueryState.done);
    assert.equal(r1.state, QueryState.done);
    assert.equal(r2.state, QueryState.done);
    assert.equal(r3.state, QueryState.done);
  });
});
