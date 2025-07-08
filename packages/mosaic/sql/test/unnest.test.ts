import { expect, describe, it } from "vitest";
import { unnest } from "../src/functions/unnest.js";
import { list } from "../src/functions/list.js";
import { columns } from "./util/columns";

describe("Unnest functions", () => {
  it("include unnest", () => {
    const expr = unnest("foo", false, 0);
    expect(String(expr)).toBe(`UNNEST("foo")`);
    expect(expr.expr.toString()).toBe('"foo"');
    expect(expr.recursive).toBe(false);
    expect(expr.maxDepth).toBe(0);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include unnest, recursive", () => {
    const expr = unnest("foo", true, 0);
    expect(String(expr)).toBe(`UNNEST("foo", recursive := true)`);
    expect(expr.expr.toString()).toBe('"foo"');
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(0);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include unnest, maxDepth", () => {
    const expr = unnest("foo", false, 5);
    expect(String(expr)).toBe(`UNNEST("foo", max_depth := 5)`);
    expect(expr.expr.toString()).toBe('"foo"');
    expect(expr.recursive).toBe(false);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include unnest, recursive, maxDepth", () => {
    const expr = unnest("foo", true, 5);
    expect(String(expr)).toBe(
      `UNNEST("foo", recursive := true, max_depth := 5)`,
    );
    expect(expr.expr.toString()).toBe('"foo"');
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include unnest, hardcoded list, recursive, maxDepth", () => {
    const expr = unnest(list(1, 2, 3), true, 5);
    expect(String(expr)).toBe(
      `UNNEST([1, 2, 3], recursive := true, max_depth := 5)`,
    );
    expect(expr.expr.toString()).toBe("[1, 2, 3]");
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual([]);
  });
});
