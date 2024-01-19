import assert from "node:assert";
import { stubParam } from "./stub-param";
import {
  column,
  desc,
  isParamLike,
  isSQLExpression,
  row_number,
  rank,
  dense_rank,
  percent_rank,
  cume_dist,
  ntile,
  lag,
  lead,
  first_value,
  last_value,
  nth_value,
} from "../src/index";

describe("Window functions", () => {
  it("expose metadata", () => {
    const expr = lead("foo");
    assert.strictEqual(expr.window, "LEAD");
    assert.strictEqual(expr.column, "foo");
    assert.deepStrictEqual(expr.columns, ["foo"]);
  });
  it("support window name", () => {
    const expr = cume_dist().over("win");
    assert.strictEqual(expr.window, "CUME_DIST");
    assert.strictEqual(expr.name, "win");
    assert.strictEqual(String(expr), 'CUME_DIST() OVER "win"');
  });
  it("support partition by", () => {
    const expr = cume_dist().partitionby("foo", "bar");
    assert.strictEqual(
      String(expr),
      'CUME_DIST() OVER (PARTITION BY "foo", "bar")'
    );
  });
  it("support order by", () => {
    const expr = cume_dist().orderby("a", desc("b"));
    assert.strictEqual(
      String(expr),
      'CUME_DIST() OVER (ORDER BY "a", "b" DESC NULLS LAST)'
    );
  });
  it("support rows frame", () => {
    assert.strictEqual(
      String(first_value("foo").rows([0, null])),
      'FIRST_VALUE("foo") OVER (ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)'
    );
    assert.strictEqual(
      String(first_value("foo").rows([null, null])),
      'FIRST_VALUE("foo") OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)'
    );
    assert.strictEqual(
      String(first_value("foo").rows([0, 2])),
      'FIRST_VALUE("foo") OVER (ROWS BETWEEN CURRENT ROW AND 2 FOLLOWING)'
    );
    assert.strictEqual(
      String(first_value("foo").rows([2, 0])),
      'FIRST_VALUE("foo") OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)'
    );
  });
  it("support range frame", () => {
    assert.strictEqual(
      String(first_value("foo").range([0, null])),
      'FIRST_VALUE("foo") OVER (RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)'
    );
    assert.strictEqual(
      String(first_value("foo").range([null, null])),
      'FIRST_VALUE("foo") OVER (RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)'
    );
    assert.strictEqual(
      String(first_value("foo").range([0, 2])),
      'FIRST_VALUE("foo") OVER (RANGE BETWEEN CURRENT ROW AND 2 FOLLOWING)'
    );
    assert.strictEqual(
      String(first_value("foo").range([2, 0])),
      'FIRST_VALUE("foo") OVER (RANGE BETWEEN 2 PRECEDING AND CURRENT ROW)'
    );
  });
  it("support window name, partition by, order by, and frame", () => {
    const expr = cume_dist()
      .over("base")
      .partitionby("foo", "bar")
      .orderby("a", desc("b"))
      .rows([0, +Infinity]);
    assert.strictEqual(
      String(expr),
      "CUME_DIST() OVER (" +
        '"base" ' +
        'PARTITION BY "foo", "bar" ' +
        'ORDER BY "a", "b" DESC NULLS LAST ' +
        "ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING)"
    );
  });
  it("support parameterized expressions", () => {
    const col = stubParam(column("bar"));
    assert.ok(isParamLike(col));

    const expr = cume_dist(col);
    assert.ok(isSQLExpression(expr));
    assert.ok(isParamLike(expr));
    assert.strictEqual(String(expr), 'CUME_DIST("bar") OVER ()');
    assert.strictEqual(expr.column, "bar");
    assert.deepStrictEqual(expr.columns, ["bar"]);

    expr.addEventListener!("value", (value) => {
      assert.ok(isSQLExpression(value));
      assert.strictEqual(String(expr), `${value}`);
    });
    col.update(column("baz"));
    assert.strictEqual(String(expr), 'CUME_DIST("baz") OVER ()');
    assert.strictEqual(expr.column, "baz");
    assert.deepStrictEqual(expr.columns, ["baz"]);
  });
  it("include ROW_NUMBER", () => {
    assert.strictEqual(String(row_number()), "(ROW_NUMBER() OVER ())::INTEGER");
  });
  it("include RANK", () => {
    assert.strictEqual(String(rank()), "(RANK() OVER ())::INTEGER");
  });
  it("include DENSE_RANK", () => {
    assert.strictEqual(String(dense_rank()), "(DENSE_RANK() OVER ())::INTEGER");
  });
  it("include PERCENT_RANK", () => {
    assert.strictEqual(String(percent_rank()), "PERCENT_RANK() OVER ()");
  });
  it("include CUME_DIST", () => {
    assert.strictEqual(String(cume_dist()), "CUME_DIST() OVER ()");
  });
  it("include NTILE", () => {
    assert.strictEqual(String(ntile(5)), "NTILE(5) OVER ()");
  });
  it("include LAG", () => {
    assert.strictEqual(String(lag("foo", 2)), 'LAG("foo", 2) OVER ()');
  });
  it("include LEAD", () => {
    assert.strictEqual(String(lead("foo", 2)), 'LEAD("foo", 2) OVER ()');
  });
  it("include FIRST_VALUE", () => {
    assert.strictEqual(
      String(first_value("foo")),
      'FIRST_VALUE("foo") OVER ()'
    );
  });
  it("include LAST_VALUE", () => {
    assert.strictEqual(String(last_value("foo")), 'LAST_VALUE("foo") OVER ()');
  });
  it("include NTH_VALUE", () => {
    assert.strictEqual(
      String(nth_value("foo", 2)),
      'NTH_VALUE("foo", 2) OVER ()'
    );
  });
});
