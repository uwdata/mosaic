import { expect, describe, it } from "vitest";
import { columns } from "./util/columns.js";
import {
  list,
  listContains,
  listHasAll,
  listHasAny,
} from "../src/functions/list";

describe("List functions", () => {
  it("include listContains", () => {
    const expr = listContains("foo", "bar");
    expect(String(expr)).toBe(`list_contains("foo", 'bar')`);
    expect(expr.name).toBe("list_contains");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include listContains no columns", () => {
    const expr = listContains(list(["foo", "bar"]), "bar");
    expect(String(expr)).toBe(`list_contains(['foo', 'bar'], 'bar')`);
    expect(expr.name).toBe("list_contains");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAll one column", () => {
    const expr = listHasAll("foo", list(["bar", "baz"]));
    expect(String(expr)).toBe(`list_has_all("foo", ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include listHasAll no columns", () => {
    const expr = listHasAll(list(["bar", "baz"]), list(["bar", "baz"]));
    expect(String(expr)).toBe(`list_has_all(['bar', 'baz'], ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAll two columns", () => {
    const expr = listHasAll("foo", "bar");
    expect(String(expr)).toBe(`list_has_all("foo", "bar")`);
    expect(expr.name).toBe("list_has_all");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo", "bar"]);
  });

  it("include listHasAny", () => {
    const expr = listHasAny("foo", list(["bar", "baz"]));
    expect(String(expr)).toBe(`list_has_any("foo", ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo"]);
  });

  it("include listHasAny no columns", () => {
    const expr = listHasAny(list(["bar", "baz"]), list(["bar", "baz"]));
    expect(String(expr)).toBe(`list_has_any(['bar', 'baz'], ['bar', 'baz'])`);
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual([]);
  });

  it("include listHasAny two columns", () => {
    const expr = listHasAny("foo", "bar");
    expect(String(expr)).toBe(`list_has_any("foo", "bar")`);
    expect(expr.name).toBe("list_has_any");
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(["foo", "bar"]);
  });
});
