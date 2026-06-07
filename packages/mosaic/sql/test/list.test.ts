import { expect, describe, it } from "vitest";
import { columns } from "./util/columns.js";
import {
  list,
  listContains,
  listHasAll,
  listHasAny,
} from "../src/functions/list";

describe("List functions", () => {
  it("include listContains", async () => {
    const expr = listContains("foo", "bar");
    await expect(expr).toBeValidExpr(`list_contains("foo", 'bar')`, "lists");
    expect(expr.name).toBe("list_contains");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include listContains no columns", async () => {
    const expr = listContains(list(["foo", "bar"]), "bar");
    await expect(expr).toBeValidExpr(`list_contains(['foo', 'bar'], 'bar')`);
    expect(expr.name).toBe("list_contains");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAll one column", async () => {
    const expr = listHasAll("foo", list(["bar", "baz"]));
    await expect(expr).toBeValidExpr(`list_has_all("foo", ['bar', 'baz'])`, "lists");
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include listHasAll no columns", async () => {
    const expr = listHasAll(list(["bar", "baz"]), list(["bar", "baz"]));
    await expect(expr).toBeValidExpr(`list_has_all(['bar', 'baz'], ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAll two columns", async () => {
    const expr = listHasAll("foo", "bar");
    await expect(expr).toBeValidExpr(`list_has_all("foo", "bar")`, "lists");
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo", "bar"]);
  });

  it("include listHasAny", async () => {
    const expr = listHasAny("foo", list(["bar", "baz"]));
    await expect(expr).toBeValidExpr(`list_has_any("foo", ['bar', 'baz'])`, "lists");
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include listHasAny no columns", async () => {
    const expr = listHasAny(list(["bar", "baz"]), list(["bar", "baz"]));
    await expect(expr).toBeValidExpr(`list_has_any(['bar', 'baz'], ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAny two columns", async () => {
    const expr = listHasAny("foo", "bar");
    await expect(expr).toBeValidExpr(`list_has_any("foo", "bar")`, "lists");
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo", "bar"]);
  });
});
