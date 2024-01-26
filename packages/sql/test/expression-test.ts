import assert from "node:assert";
import { stubParam } from "./stub-param";
import { column, isSQLExpression, isParamLike, sql } from "../src/index";

describe("sql template tag", () => {
  it("creates basic SQL expressions", () => {
    const expr = sql`1 + 1`;
    assert.ok(isSQLExpression(expr));
    assert.ok(!isParamLike(expr));
    assert.strictEqual(String(expr), "1 + 1");
    assert.strictEqual(expr.column, undefined);
    assert.deepStrictEqual(expr.columns, []);
  });

  it("creates interpolated SQL expressions", () => {
    const expr = sql`${column("foo")} * ${column("bar")}`;
    assert.ok(isSQLExpression(expr));
    assert.ok(!isParamLike(expr));
    assert.strictEqual(String(expr), '"foo" * "bar"');
    assert.strictEqual(expr.column, "foo");
    assert.deepStrictEqual(expr.columns, ["foo", "bar"]);
  });

  it("creates nested SQL expressions", () => {
    const base = sql`${column("foo")} * 4`;
    const expr = sql`${base} + 1`;
    assert.ok(isSQLExpression(expr));
    assert.strictEqual(String(expr), '"foo" * 4 + 1');
    assert.ok(!isParamLike(expr));
    assert.strictEqual(expr.column, "foo");
    assert.deepStrictEqual(expr.columns, ["foo"]);
  });

  it("creates parameterized SQL expressions", () => {
    const param = stubParam(4);
    assert.ok(isParamLike(param));

    const expr = sql`${column("foo")} * ${param}`;
    assert.ok(isSQLExpression(expr));
    assert.strictEqual(String(expr), '"foo" * 4');
    assert.ok(isParamLike(expr));
    assert.strictEqual(expr.column, "foo");
    assert.deepStrictEqual(expr.columns, ["foo"]);

    expr.addEventListener!("value", (value) => {
      assert.ok(isSQLExpression(value));
      assert.strictEqual(String(expr), `${value}`);
    });
    param.update(5);
    assert.strictEqual(String(expr), '"foo" * 5');
  });

  it("creates nested parameterized SQL expressions", () => {
    const param = stubParam(4);
    assert.ok(isParamLike(param));

    const base = sql`${column("foo")} * ${param}`;
    const expr = sql`${base} + 1`;
    assert.ok(isSQLExpression(expr));
    assert.strictEqual(String(expr), '"foo" * 4 + 1');
    assert.ok(isParamLike(expr));
    assert.strictEqual(expr.column, "foo");
    assert.deepStrictEqual(expr.columns, ["foo"]);

    expr.addEventListener!("value", (value) => {
      assert.ok(isSQLExpression(value));
      assert.strictEqual(String(expr), `${value}`);
    });
    param.update(5);
    assert.strictEqual(String(expr), '"foo" * 5 + 1');
  });
});
