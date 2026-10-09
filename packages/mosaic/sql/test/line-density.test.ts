import { describe, expect, it } from 'vitest';
import { Query, div, lineDensity, mul, sub } from '../src/index.js';

describe('lineDensity', () => {
  const x = () => mul(div(sub('num1', 0), 10), 500);
  const y = () => mul(div(sub('num2', 0), 10), 300);

  it('selects series (z) columns from the base query', async () => {
    const query = [
      'WITH "pairs" AS (SELECT "txt1", "x" AS "x0", "y" AS "y0", (lead("x") OVER "sw" - "x") AS "dx", (lead("y") OVER "sw" - "y") AS "dy" FROM (SELECT (floor(((("num1" - 0) / 10) * 500)))::INTEGER AS "x", (floor(((("num2" - 0) / 10) * 300)))::INTEGER AS "y", "txt1" FROM "t1")',
      'WINDOW "sw" AS (PARTITION BY "txt1" ORDER BY "x" ASC)',
      'QUALIFY (("x0" < 500) OR (("x0" + "dx") < 500)) AND (("y0" < 300) OR (("y0" + "dy") < 300)) AND (("x0" > 0) OR (("x0" + "dx") > 0)) AND (("y0" > 0) OR (("y0" + "dy") > 0))),',
      '"indices" AS (SELECT (UNNEST(range((SELECT greatest(max(abs("dx")), max(abs("dy"))) AS "x" FROM "pairs"))))::INTEGER AS "i"),',
      '"raster" AS (SELECT "txt1", ("x0" + "i") AS "x", ("y0" + (round((("i" * "dy") / "dx")))::INTEGER) AS "y" FROM "pairs", "indices"',
      'WHERE (abs("dy") <= abs("dx")) AND ("i" < abs("dx"))',
      'UNION ALL SELECT "txt1", ("x0" + (round((((sign("dy") * "i") * "dx") / "dy")))::INTEGER) AS "x", ("y0" + (sign("dy") * "i")) AS "y" FROM "pairs", "indices"',
      'WHERE (abs("dy") > abs("dx")) AND ("i" < abs("dy"))',
      'UNION ALL SELECT "txt1", "x0" AS "x", "y0" AS "y" FROM "pairs"',
      'WHERE ("dx" IS NULL)),',
      '"points" AS (SELECT "txt1", "x", "y", (1 / count(*) OVER (PARTITION BY "x", "txt1")) AS "w" FROM "raster"',
      'WHERE (0 <= "x") AND ("x" < 500) AND (0 <= "y") AND ("y" < 300))',
      'SELECT ("x" + ("y" * (500)::INTEGER)) AS "index", sum("w") AS "density" FROM "points" GROUP BY "index"'
    ].join(' ');
    await expect(
      lineDensity(Query.from('t1'), x(), y(), ['txt1'], 500, 300)
    ).toBeValidQuery(query);
  });

  it('selects groupby columns from the base query', async () => {
    const query = [
      'WITH "pairs" AS (SELECT "txt2", "x" AS "x0", "y" AS "y0", (lead("x") OVER "sw" - "x") AS "dx", (lead("y") OVER "sw" - "y") AS "dy" FROM (SELECT (floor(((("num1" - 0) / 10) * 500)))::INTEGER AS "x", (floor(((("num2" - 0) / 10) * 300)))::INTEGER AS "y", "txt2" FROM "t1")',
      'WINDOW "sw" AS (PARTITION BY "txt2" ORDER BY "x" ASC)',
      'QUALIFY (("x0" < 500) OR (("x0" + "dx") < 500)) AND (("y0" < 300) OR (("y0" + "dy") < 300)) AND (("x0" > 0) OR (("x0" + "dx") > 0)) AND (("y0" > 0) OR (("y0" + "dy") > 0))),',
      '"indices" AS (SELECT (UNNEST(range((SELECT greatest(max(abs("dx")), max(abs("dy"))) AS "x" FROM "pairs"))))::INTEGER AS "i"),',
      '"raster" AS (SELECT "txt2", ("x0" + "i") AS "x", ("y0" + (round((("i" * "dy") / "dx")))::INTEGER) AS "y" FROM "pairs", "indices"',
      'WHERE (abs("dy") <= abs("dx")) AND ("i" < abs("dx"))',
      'UNION ALL SELECT "txt2", ("x0" + (round((((sign("dy") * "i") * "dx") / "dy")))::INTEGER) AS "x", ("y0" + (sign("dy") * "i")) AS "y" FROM "pairs", "indices"',
      'WHERE (abs("dy") > abs("dx")) AND ("i" < abs("dy"))',
      'UNION ALL SELECT "txt2", "x0" AS "x", "y0" AS "y" FROM "pairs"',
      'WHERE ("dx" IS NULL)),',
      '"points" AS (SELECT "txt2", "x", "y", (1 / count(*) OVER (PARTITION BY "x", "txt2")) AS "w" FROM "raster"',
      'WHERE (0 <= "x") AND ("x" < 500) AND (0 <= "y") AND ("y" < 300))',
      'SELECT "txt2", ("x" + ("y" * (500)::INTEGER)) AS "index", sum("w") AS "density" FROM "points" GROUP BY "index", "txt2"'
    ].join(' ');
    await expect(
      lineDensity(Query.from('t1'), x(), y(), [], 500, 300, ['txt2'])
    ).toBeValidQuery(query);
  });

  it('retains pre-aliased group columns in the base query', async () => {
    const query = [
      'WITH "pairs" AS (SELECT "z", "x" AS "x0", "y" AS "y0", (lead("x") OVER "sw" - "x") AS "dx", (lead("y") OVER "sw" - "y") AS "dy" FROM (SELECT "txt1" AS "z", (floor(((("num1" - 0) / 10) * 500)))::INTEGER AS "x", (floor(((("num2" - 0) / 10) * 300)))::INTEGER AS "y" FROM "t1")',
      'WINDOW "sw" AS (PARTITION BY "z" ORDER BY "x" ASC)',
      'QUALIFY (("x0" < 500) OR (("x0" + "dx") < 500)) AND (("y0" < 300) OR (("y0" + "dy") < 300)) AND (("x0" > 0) OR (("x0" + "dx") > 0)) AND (("y0" > 0) OR (("y0" + "dy") > 0))),',
      '"indices" AS (SELECT (UNNEST(range((SELECT greatest(max(abs("dx")), max(abs("dy"))) AS "x" FROM "pairs"))))::INTEGER AS "i"),',
      '"raster" AS (SELECT "z", ("x0" + "i") AS "x", ("y0" + (round((("i" * "dy") / "dx")))::INTEGER) AS "y" FROM "pairs", "indices"',
      'WHERE (abs("dy") <= abs("dx")) AND ("i" < abs("dx"))',
      'UNION ALL SELECT "z", ("x0" + (round((((sign("dy") * "i") * "dx") / "dy")))::INTEGER) AS "x", ("y0" + (sign("dy") * "i")) AS "y" FROM "pairs", "indices"',
      'WHERE (abs("dy") > abs("dx")) AND ("i" < abs("dy"))',
      'UNION ALL SELECT "z", "x0" AS "x", "y0" AS "y" FROM "pairs"',
      'WHERE ("dx" IS NULL)),',
      '"points" AS (SELECT "z", "x", "y", (1 / count(*) OVER (PARTITION BY "x", "z")) AS "w" FROM "raster"',
      'WHERE (0 <= "x") AND ("x" < 500) AND (0 <= "y") AND ("y" < 300))',
      'SELECT ("x" + ("y" * (500)::INTEGER)) AS "index", sum("w") AS "density" FROM "points" GROUP BY "index"'
    ].join(' ');
    await expect(
      lineDensity(Query.from('t1').select({ z: 'txt1' }), x(), y(), ['z'], 500, 300)
    ).toBeValidQuery(query);
  });
});
