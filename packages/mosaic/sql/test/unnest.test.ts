import { expect, describe, it } from "vitest";
import { unnest } from "../src/functions/unnest.js";
import { list } from "../src/functions/list.js";
import { columns } from "./util/columns";

describe("Unnest functions", () => {
  it("include unnest", async () => {
    const expr = unnest("foo", false, 0);
    await expect(expr).toBeValidExpr(`UNNEST("foo")`, "lists");
    expect(expr.expr.toString()).toBe('"foo"');
    expect(expr.recursive).toBe(false);
    expect(expr.maxDepth).toBe(0);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include unnest, recursive", async () => {
    const expr = unnest("foo", true, 0);
    await expect(expr).toBeValidExpr(`UNNEST("foo", recursive := true)`, "lists");
    expect(expr.expr.toString()).toBe('"foo"');
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(0);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include unnest, maxDepth", async () => {
    const expr = unnest("foo", false, 5);
    await expect(expr).toBeValidExpr(`UNNEST("foo", max_depth := 5)`, "lists");
    expect(expr.expr.toString()).toBe('"foo"');
    expect(expr.recursive).toBe(false);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include unnest, recursive, maxDepth", async () => {
    const expr = unnest("foo", true, 5);
    await expect(expr).toBeValidExpr(
      `UNNEST("foo", recursive := true, max_depth := 5)`,
      "lists",
    );
    expect(expr.expr.toString()).toBe('"foo"');
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include unnest, hardcoded list, recursive, maxDepth", async () => {
    const expr = unnest(list([1, 2, 3]), true, 5);
    await expect(expr).toBeValidExpr(
      `UNNEST([1, 2, 3], recursive := true, max_depth := 5)`,
    );
    expect(expr.expr.toString()).toBe("[1, 2, 3]");
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual([]);
  });
});
