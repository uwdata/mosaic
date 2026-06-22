import { expect, describe, it } from "vitest";
import { unnest } from "../src/functions/unnest.js";
import { list } from "../src/functions/list.js";
import { columns } from "./util/columns.js";

describe("Unnest functions", () => {
  it("include unnest", async () => {
    const expr = unnest("lst2", false, 0);
    await expect(expr).toBeValidExpr(`UNNEST("lst2")`);
    expect(String(expr.expr)).toBe('"lst2"');
    expect(expr.recursive).toBe(false);
    expect(expr.maxDepth).toBe(0);
    expect(columns(expr)).toStrictEqual(["lst2"]);
  });

  it("include unnest, recursive", async () => {
    const expr = unnest("lst2", true, 0);
    await expect(expr).toBeValidExpr(`UNNEST("lst2", recursive := true)`);
    expect(String(expr.expr)).toBe('"lst2"');
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(0);
    expect(columns(expr)).toStrictEqual(["lst2"]);
  });

  it("include unnest, maxDepth", async () => {
    const expr = unnest("lst2", false, 5);
    await expect(expr).toBeValidExpr(`UNNEST("lst2", max_depth := 5)`);
    expect(String(expr.expr)).toBe('"lst2"');
    expect(expr.recursive).toBe(false);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual(["lst2"]);
  });

  it("include unnest, recursive, maxDepth", async () => {
    const expr = unnest("lst2", true, 5);
    await expect(expr).toBeValidExpr(
      `UNNEST("lst2", recursive := true, max_depth := 5)`,
    );
    expect(String(expr.expr)).toBe('"lst2"');
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual(["lst2"]);
  });

  it("include unnest, hardcoded list, recursive, maxDepth", async () => {
    const expr = unnest(list([1, 2, 3]), true, 5);
    await expect(expr).toBeValidExpr(
      `UNNEST([1, 2, 3], recursive := true, max_depth := 5)`,
    );
    expect(String(expr.expr)).toBe("[1, 2, 3]");
    expect(expr.recursive).toBe(true);
    expect(expr.maxDepth).toBe(5);
    expect(columns(expr)).toStrictEqual([]);
  });
});
