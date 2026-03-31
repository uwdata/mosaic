import { describe, it, expect } from "vitest";
import { QueryManager } from "../src/QueryManager.js";
import { QueryResult } from "../src/util/query-result.js";
import type { QueryRequest } from "../src/types.js";
import { ObserveDispatch } from "../src/util/ObserveDispatch.js";
import {
  EventType,
  type MosaicEventMap,
  QueryStartEvent,
  QueryEndEvent,
} from "../src/Events.js";

describe("QueryManager", () => {
  it("should run a simple query", async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async ({ sql }) => {
        expect(sql).toBe("SELECT 1");
        return [{ column: 1 }];
      },
    });

    const request: QueryRequest = {
      type: "arrow",
      query: "SELECT 1",
    };

    const result = queryManager.request(request);
    expect(result).toBeInstanceOf(QueryResult);

    const data = await result;
    expect(data).toEqual([{ column: 1 }]);
  });

  it("should not run a query when there is a pending exec", async () => {
    const queryManager = new QueryManager();

    // Mock the connector
    queryManager.connector({
      // @ts-expect-error assumes type value
      query: ({ sql }) => {
        expect(sql).toBe("CREATE TABLE test (id INT)");
        return new Promise(() => {});
      },
    });

    const request1: QueryRequest = {
      type: "exec",
      query: "CREATE TABLE test (id INT)",
    };

    const request2: QueryRequest = {
      type: "arrow",
      query: "SELECT * FROM test",
    };

    queryManager.request(request1);
    queryManager.request(request2);

    expect(queryManager.pendingResults).toHaveLength(1);
  });

  it("emits typed QueryStart and QueryEnd events with type and timestamp", async () => {
    const eventBus = new ObserveDispatch<MosaicEventMap>();
    const queryManager = new QueryManager(32, eventBus);

    const starts: QueryStartEvent[] = [];
    const ends: QueryEndEvent[] = [];

    eventBus.observe(EventType.QueryStart, (event) => {
      starts.push(event);
    });
    eventBus.observe(EventType.QueryEnd, (event) => {
      ends.push(event);
    });

    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async ({ sql }) => [{ sql }],
    });

    const result = queryManager.request({
      type: "arrow",
      query: "SELECT 42",
      cache: false,
    });

    await result;

    expect(starts).toHaveLength(1);
    expect(ends).toHaveLength(1);

    const start = starts[0];
    const end = ends[0];

    expect(start).toBeInstanceOf(QueryStartEvent);
    expect(end).toBeInstanceOf(QueryEndEvent);

    expect(start.type).toBe(EventType.QueryStart);
    expect(end.type).toBe(EventType.QueryEnd);

    expect(typeof start.timestamp).toBe("number");
    expect(typeof end.timestamp).toBe("number");

    expect(start.query).toBe("SELECT 42");
    expect(end.query).toBe("SELECT 42");

    expect(start.materialized).toBe(false);
    expect(end.materialized).toBe(false);
  });

  it("emits QueryStart and QueryEnd for cached requests", async () => {
    const eventBus = new ObserveDispatch<MosaicEventMap>();
    const queryManager = new QueryManager(32, eventBus);

    const starts: QueryStartEvent[] = [];
    const ends: QueryEndEvent[] = [];
    let queryCalls = 0;

    eventBus.observe(EventType.QueryStart, (event) => {
      starts.push(event);
    });
    eventBus.observe(EventType.QueryEnd, (event) => {
      ends.push(event);
    });

    queryManager.connector({
      // @ts-expect-error assumes type value
      query: async () => {
        queryCalls += 1;
        return [{ value: 1 }];
      },
    });

    queryManager.cache(true);

    await queryManager.request({
      type: "arrow",
      query: "SELECT 1",
      cache: true,
    });

    await queryManager.request({
      type: "arrow",
      query: "SELECT 1",
      cache: true,
    });

    expect(queryCalls).toBe(1);
    expect(starts).toHaveLength(2);
    expect(ends).toHaveLength(2);

    for (const event of starts) {
      expect(event.type).toBe(EventType.QueryStart);
      expect(typeof event.timestamp).toBe("number");
      expect(event.query).toBe("SELECT 1");
      expect(event.materialized).toBe(true);
    }

    for (const event of ends) {
      expect(event.type).toBe(EventType.QueryEnd);
      expect(typeof event.timestamp).toBe("number");
      expect(event.query).toBe("SELECT 1");
      expect(event.materialized).toBe(true);
    }
  });
});
