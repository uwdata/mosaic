import { describe, it, expect, vi } from "vitest";
import { Coordinator, coordinator, observeLogger } from "../src/index.js";
import { QueryResult, QueryState } from "../src/util/query-result.js";

async function wait() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("coordinator", () => {
  it("has accessible singleton", () => {
    const mc = coordinator();
    expect(mc).toBeInstanceOf(Coordinator);

    const mc2 = new Coordinator();
    coordinator(mc2);

    expect(coordinator()).toBe(mc2);
  });

  it("query results returned in correct order", async () => {
    const promises: QueryResult[] = [];

    // Mock the connector
    const connector: any = {
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
    expect(promises).toHaveLength(0);

    await wait();

    // all queries should have been sent to the connector
    expect(promises).toHaveLength(4);
    expect(coord.manager.pendingResults).toHaveLength(4);

    // resolve promises in reverse order
    promises.at(3)!.fulfill(0);
    await wait();

    expect(r0.state).toEqual(QueryState.pending);
    expect(r1.state).toEqual(QueryState.pending);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(1)!.fulfill(0);
    await wait();

    expect(r0.state).toEqual(QueryState.pending);
    expect(r1.state).toEqual(QueryState.ready);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(0)!.fulfill(0);
    await wait();

    expect(coord.manager.pendingResults).toHaveLength(2);

    expect(r0.state).toEqual(QueryState.done);
    expect(r1.state).toEqual(QueryState.done);
    expect(r2.state).toEqual(QueryState.pending);
    expect(r3.state).toEqual(QueryState.ready);

    promises.at(2)!.fulfill(0);
    await wait();

    expect(coord.manager.pendingResults).toHaveLength(0);

    expect(r0.state).toEqual(QueryState.done);
    expect(r1.state).toEqual(QueryState.done);
    expect(r2.state).toEqual(QueryState.done);
    expect(r3.state).toEqual(QueryState.done);
  });

  it("observeLogger reproduces old-style query logging and supports unsubscribe", async () => {
    const connector: any = {
      async query() {
        return [{ value: 1 }];
      },
    };

    const coord = new Coordinator(connector, {
      cache: false,
      consolidate: false,
      preagg: { enabled: false },
    });

    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      group: vi.fn(),
      groupCollapsed: vi.fn(),
      groupEnd: vi.fn(),
    };

    const unobserve = observeLogger(coord, logger);

    await coord.query("SELECT 1", { cache: false });

    expect(logger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(logger.groupCollapsed).toHaveBeenCalledWith("query SELECT 1");

    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith("SELECT 1", expect.any(String));

    expect(logger.groupEnd).toHaveBeenCalledTimes(1);

    unobserve();

    await coord.query("SELECT 1", { cache: false });

    // no additional logger calls after unsubscribe
    expect(logger.groupCollapsed).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.groupEnd).toHaveBeenCalledTimes(1);
  });
});
