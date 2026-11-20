import { describe, it, expect } from 'vitest';
import { InstantiateContext, astToESM, parseSpec } from '../src/index.js';

// A window transform's frame (`rows`, `range`, `groups`) is a pair of offsets
// that can be plain numbers, null (unbounded), or interval transforms such as
// { days: 6 }. The example specs only exercise a frame supplied by a param
// (moving-average) or one made entirely of intervals (window-frame), so
// literal offsets written directly in a spec need their own coverage.

/**
 * A spec whose `y` channel is an average over the given window frame options.
 * @param {object} frame Window frame options: rows, range, or groups, and exclude.
 * @returns {any} A spec, left loosely typed as in the other tests.
 */
const spec = frame => ({
  data: { t: { file: 'data.csv' } },
  plot: [{
    mark: 'dot',
    data: { from: 't' },
    x: 'd',
    y: { avg: 'v', orderby: 'd', ...frame }
  }]
});

// depth-first search of the AST for the first node satisfying a predicate
function find(node, test, seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return null;
  seen.add(node);
  if (test(node)) return node;
  for (const key of Object.keys(node)) {
    const match = find(node[key], test, seen);
    if (match) return match;
  }
  return null;
}

// Offsets are distances from the current row: the first offset reaches
// backward (PRECEDING), the second forward (FOLLOWING). The sign of a number
// is ignored, 0 is CURRENT ROW, and null is UNBOUNDED.
const cases = [
  {
    name: 'numeric rows offsets',
    frame: { rows: [-6, 0] },
    esm: 'vg.frameRows([-6, 0])',
    sql: 'ROWS BETWEEN 6 PRECEDING AND CURRENT ROW'
  },
  {
    name: 'positive numeric rows offsets',
    frame: { rows: [1, 1] },
    esm: 'vg.frameRows([1, 1])',
    sql: 'ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING'
  },
  {
    name: 'unbounded (null) offset',
    frame: { rows: [null, 0] },
    esm: 'vg.frameRows([null, 0])',
    sql: 'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW'
  },
  {
    name: 'two unbounded offsets',
    frame: { rows: [null, null] },
    esm: 'vg.frameRows([null, null])',
    sql: 'ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING'
  },
  {
    name: 'groups frame',
    frame: { groups: [2, 0] },
    esm: 'vg.frameGroups([2, 0])',
    sql: 'GROUPS BETWEEN 2 PRECEDING AND CURRENT ROW'
  },
  {
    name: 'interval mixed with a number',
    frame: { range: [{ days: 6 }, 0] },
    esm: 'vg.frameRange([vg.days(6), 0])',
    sql: 'RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW'
  },
  {
    name: 'number mixed with an interval',
    frame: { range: [0, { days: 6 }] },
    esm: 'vg.frameRange([0, vg.days(6)])',
    sql: 'RANGE BETWEEN CURRENT ROW AND INTERVAL 6 DAYS FOLLOWING'
  },
  {
    name: 'intervals only',
    frame: { range: [{ days: 6 }, { days: 0 }] },
    esm: 'vg.frameRange([vg.days(6), vg.days(0)])',
    sql: 'RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND INTERVAL 0 DAYS FOLLOWING'
  },
  {
    // no `sql`: only the spec side of an exclude clause is covered here
    name: 'numeric offsets with an exclude clause',
    frame: { rows: [-6, 0], exclude: 'CURRENT ROW' },
    esm: "vg.frameRows([-6, 0], 'CURRENT ROW')"
  }
];

describe('Window frames', () => {
  for (const { name, frame, esm, sql } of cases) {
    describe(name, () => {
      it('converts to JSON unchanged', () => {
        const json = parseSpec(spec(frame)).toJSON();
        expect(json.plot[0].y).toEqual(spec(frame).plot[0].y);
      });

      it('round trips JSON parsing', () => {
        const json = parseSpec(spec(frame)).toJSON();
        expect(JSON.stringify(parseSpec(json).toJSON())).toBe(JSON.stringify(json));
      });

      it('generates ESM code', () => {
        expect(astToESM(parseSpec(spec(frame)))).toContain(esm);
      });

      it.skipIf(!sql)('instantiates to the expected SQL', () => {
        const ast = parseSpec(spec(frame));
        const node = find(ast, n => n.name === 'avg' && n.options);
        const expr = node.instantiate(new InstantiateContext());
        expect(String(expr)).toBe(`avg("v") OVER (ORDER BY "d" ${sql})`);
      });
    });
  }
});
