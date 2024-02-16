import { Query, and, count, isNull, isBetween, sql, sum } from '@uwdata/mosaic-sql';
import { binField, bin1d } from './util/bin-field.js';
import { extentX, extentY } from './util/extent.js';
import { handleParam } from './util/handle-param.js';
import { RasterMark } from './RasterMark.js';

export class DenseLineMark extends RasterMark {
  constructor(source, options) {
    const { normalize = true, ...rest } = options;
    super(source, { bandwidth: 0, ...rest });
    handleParam(this, 'normalize', normalize);
  }

  query(filter = []) {
    const { plot, channels, normalize, source } = this;
    const [x0, x1] = extentX(this, filter);
    const [y0, y1] = extentY(this, filter);
    const [nx, ny] = this.bins = this.binDimensions(this);
    const bx = binField(this, 'x');
    const by = binField(this, 'y');
    const rx = !!plot.getAttribute('xReverse');
    const ry = !!plot.getAttribute('yReverse');
    const x = bin1d(bx, x0, x1, nx, rx, this.binPad);
    const y = bin1d(by, y0, y1, ny, ry, this.binPad);

    const q = Query
      .from(source.table)
      .where(stripXY(this, filter));

    const groupby = this.groupby = [];
    const z = [];
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { channel, field } = c;
        if (channel === 'z') {
          q.select({ [channel]: field });
          z.push('z');
        } else if (channel !== 'x' && channel !== 'y') {
          q.select({ [channel]: field });
          groupby.push(channel);
        }
      }
    }

    return lineDensity(q, x, y, z, nx, ny, groupby, normalize);
  }
}

// strip x, y fields from filter predicate
// to prevent improper clipping of line segments
// TODO: improve, perhaps with supporting query utilities
function stripXY(mark, filter) {
  if (Array.isArray(filter) && !filter.length) return filter;

  const xc = mark.channelField('x').field.column;
  const yc = mark.channelField('y').field.column;
  const test = p => p.op !== 'BETWEEN'
    || p.field.column !== xc && p.field.column !== yc;
  const filterAnd = p => p.op === 'AND'
    ? and(p.children.filter(c => test(c)))
    : p;

  return Array.isArray(filter)
    ? filter.filter(p => test(p)).map(p => filterAnd(p))
    : filterAnd(filter);
}

function lineDensity(
  q, x, y, z, xn, yn,
  groupby = [], normalize = true
) {
  // select x, y points binned to the grid
  q.select({
    x: sql`FLOOR(${x})::INTEGER`,
    y: sql`FLOOR(${y})::INTEGER`
  });

  // select line segment end point pairs
  const groups = groupby.concat(z);
  const pairPart = groups.length ? `PARTITION BY ${groups.join(', ')} ` : '';
  const pairs = Query
    .from(q)
    .select(groups, {
      x0: 'x',
      y0: 'y',
      dx: sql`(lead(x) OVER sw - x)`,
      dy: sql`(lead(y) OVER sw - y)`
    })
    .window({ sw: sql`${pairPart}ORDER BY x ASC` })
    .qualify(and(
      sql`(x0 < ${xn} OR x0 + dx < ${xn})`,
      sql`(y0 < ${yn} OR y0 + dy < ${yn})`,
      sql`(x0 > 0 OR x0 + dx > 0)`,
      sql`(y0 > 0 OR y0 + dy > 0)`
    ));

  // indices to join against for rasterization
  // generate the maximum number of indices needed
  const num = Query
    .select({ x: sql`GREATEST(MAX(ABS(dx)), MAX(ABS(dy)))` })
    .from('pairs');
  const indices = Query.select({ i: sql`UNNEST(range((${num})))::INTEGER` });

  // rasterize line segments
  const raster = Query.unionAll(
    Query
      .select(groups, {
        x: sql`x0 + i`,
        y: sql`y0 + ROUND(i * dy / dx::FLOAT)::INTEGER`
      })
      .from('pairs', 'indices')
      .where(sql`ABS(dy) <= ABS(dx) AND i < ABS(dx)`),
    Query
      .select(groups, {
        x: sql`x0 + ROUND(SIGN(dy) * i * dx / dy::FLOAT)::INTEGER`,
        y: sql`y0 + SIGN(dy) * i`
      })
      .from('pairs', 'indices')
      .where(sql`ABS(dy) > ABS(dx) AND i < ABS(dy)`),
    Query
      .select(groups, { x: 'x0', y: 'y0' })
      .from('pairs')
      .where(isNull('dx'))
  );

  // filter raster, normalize columns for each series
  const pointPart = ['x'].concat(groups).join(', ');
  const points = Query
    .from('raster')
    .select(groups, 'x', 'y',
      normalize
        ? { w: sql`1.0 / COUNT(*) OVER (PARTITION BY ${pointPart})` }
        : null
    )
    .where(and(isBetween('x', [0, xn]), isBetween('y', [0, yn])));

  // sum normalized, rasterized series into output grids
  return Query
    .with({ pairs, indices, raster, points })
    .from('points')
    .select(groupby, {
      index: sql`x + y * ${xn}::INTEGER`,
      value: normalize ? sum('w') : count()
    })
    .groupby('index', groupby);
}
