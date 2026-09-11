import { expect, describe, it } from "vitest";
import { columns } from "./util/columns.js";
import {
  list,
  listContains,
  listHasAll,
  listHasAny,
} from "../src/functions/list.js";

describe("List functions", () => {
  it("include listContains", async () => {
    const expr = listContains("lst2", "bar");
    await expect(expr).toBeValidExpr(`list_contains("lst2", 'bar')`);
    expect(expr.name).toBe("list_contains");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["lst2"]);
  });

  it("include listContains no columns", async () => {
    const expr = listContains(list(["foo", "bar"]), "bar");
    await expect(expr).toBeValidExpr(`list_contains(['foo', 'bar'], 'bar')`);
    expect(expr.name).toBe("list_contains");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAll one column", async () => {
    const expr = listHasAll("lst2", list(["bar", "baz"]));
    await expect(expr).toBeValidExpr(`list_has_all("lst2", ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["lst2"]);
  });

  it("include listHasAll no columns", async () => {
    const expr = listHasAll(list(["bar", "baz"]), list(["bar", "baz"]));
    await expect(expr).toBeValidExpr(`list_has_all(['bar', 'baz'], ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAll two columns", async () => {
    const expr = listHasAll("lst1", "lst2");
    await expect(expr).toBeValidExpr(`list_has_all("lst1", "lst2")`);
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["lst1", "lst2"]);
  });

  it("include listHasAny", async () => {
    const expr = listHasAny("lst2", list(["bar", "baz"]));
    await expect(expr).toBeValidExpr(`list_has_any("lst2", ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["lst2"]);
  });

  it("include listHasAny no columns", async () => {
    const expr = listHasAny(list(["bar", "baz"]), list(["bar", "baz"]));
    await expect(expr).toBeValidExpr(`list_has_any(['bar', 'baz'], ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAny two columns", async () => {
    const expr = listHasAny("lst1", "lst2");
    await expect(expr).toBeValidExpr(`list_has_any("lst1", "lst2")`);
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["lst1", "lst2"]);
  });
});
