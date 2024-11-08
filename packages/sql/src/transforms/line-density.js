import { Query, SelectQuery } from '../ast/query.js';
import { count, max, sum } from '../functions/aggregate.js';
import { int32 } from '../functions/cast.js';
import { abs, floor, greatest, round, sign } from '../functions/numeric.js';
import { add, div, gt, isNull, lt, lte, mul, or, sub } from '../functions/operators.js';
import { asc } from '../functions/order-by.js';
import { sql } from '../functions/sql-template-tag.js';
import { lead } from '../functions/window.js';
import { over } from '../util/ast.js';

/**
 * Compute line segment densities over a gridded 2D domain. The returned
 * query uses multiple subqueries (CTEs) to identify line segment end point
 * pairs, perform line rasterization in-database, normalize arc lengths,
 * and then sum results for all line series to produce a density map.
 * Based on Moritz and Fisher's work: https://arxiv.org/abs/1808.06019
 * @param {SelectQuery} q The base query over the data.
 * @param {import('../types.js').ExprValue} x Bin expression for x dimension.
 *  Provides gridded x coordinates, potentially with a fractional component.
 * @param {import('../types.js').ExprValue} y Bin expression for x dimension.
 *  Provides gridded y coordinates, potentially with a fractional component.
 * @param {string[]} z Group by columns that segment data into individual line
 *  series. An empty array indicates there is only a single line series.
 * @param {number} xn The number of grid bins for the x dimension.
 * @param {number} yn The number of grid bins for the y dimension.
 * @param {string[]} [groupby] Additional group by expressions. Separate
 *  line density maps are created for each of these groups.
 * @param {boolean} [normalize=true] Flag toggling approximate arc-length
 *  normalization to improve accuracy and reduce artifacts (default `true`).
 * @returns {SelectQuery}
 */
export function lineDensity(
  q, x, y, z, xn, yn,
  groupby = [], normalize = true
) {
  // select x, y points binned to the grid
  q.select({
    x: int32(floor(x)),
    y: int32(floor(y))
  });

  // select line segment end point pairs
  // retain only segments within the grid region
  const groups = groupby.concat(z);
  const pairs = Query
    .from(q)
    .select(groups, {
      x0: 'x',
      y0: 'y',
      dx: sub(lead('x').over('sw'), 'x'),
      dy: sub(lead('y').over('sw'), 'y')
    })
    .window({
      sw: over().partitionby(groups).orderby(asc('x'))
    })
    .qualify([
      or(lt('x0', xn), lt(add('x0', 'dx'), xn)),
      or(lt('y0', yn), lt(add('y0', 'dy'), yn)),
      or(gt('x0', 0), gt(add('x0', 'dx'), 0)),
      or(gt('y0', 0), gt(add('y0', 'dy'), 0))
    ]);

  // create indices to join against for rasterization
  // generate the maximum number of indices needed
  const num = Query
    .select({ x: greatest(max(abs('dx')), max(abs('dy'))) })
    .from('pairs');
  const indices = Query.select({
    i: int32(sql`UNNEST(range((${num})))`)
  });

  // rasterize line segments
  const raster = Query.unionAll(
    Query
      .select(groups, {
        x: add('x0', 'i'),
        y: add('y0', int32(round(div(mul('i', 'dy'), 'dx'))))
      })
      .from('pairs', 'indices')
      .where([lte(abs('dy'), abs('dx')), lt('i', abs('dx'))]),
    Query
      .select(groups, {
        x: add('x0', int32(round(div(mul(mul(sign('dy'), 'i'), 'dx'), 'dy')))),
        y: add('y0', mul(sign('dy'), 'i'))
      })
      .from('pairs', 'indices')
      .where([gt(abs('dy'), abs('dx')), lt('i', abs('dy'))]),
    Query
      .select(groups, { x: 'x0', y: 'y0' })
      .from('pairs')
      .where(isNull('dx'))
  );

  // filter raster, normalize columns for each series
  const points = Query
    .from('raster')
    .select(groups, 'x', 'y',
      normalize
        ? { w: div(1, count().partitionby(['x'].concat(groups))) }
        : null
    )
    .where([lte(0, 'x'), lt('x', xn), lte(0, 'y'), lt('y', yn)]);

  // sum normalized, rasterized series into output grids
  return Query
    .with({ pairs, indices, raster, points })
    .from('points')
    .select(groupby, {
      index: add('x', mul('y', int32(xn))),
      density: normalize ? sum('w') : count()
    })
    .groupby('index', groupby);
}
