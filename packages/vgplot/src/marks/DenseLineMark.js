import { Query, and, count, sum, expr, isNull, isBetween } from '@uwdata/mosaic-sql';
import { binField } from './util/bin-field.js';
import { extentX, extentY } from './util/extent.js';
import { RasterMark } from './RasterMark.js';

export class DenseLineMark extends RasterMark {
  constructor(source, options) {
    const { normalize = true, ...rest } = options;
    super(source, { bandwidth: 0, ...rest });
    this.normalize = normalize;
  }

  query(filter = []) {
    const { plot, channels, normalize, source, stats } = this;
    const [x0, x1] = extentX(this, filter);
    const [y0, y1] = extentY(this, filter);

    const q = Query.from(source.table).where(stripXY(this, filter));
    const groupby = this.groupby = [];
    const z = [];
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { channel, field } = c;
        const expr = field.transform?.(stats) || field;
        q.select({ [channel]: expr });
        if (channel === 'z') {
          z.push('z');
        } else if (channel !== 'x' && channel !== 'y') {
          groupby.push(channel);
        }
      }
    }

    const [nx, ny] = this.bins = [
      Math.round(plot.innerWidth() / this.binWidth),
      Math.round(plot.innerHeight() / this.binWidth)
    ];
    const rx = !!plot.getAttribute('reverseX');
    const ry = !!plot.getAttribute('reverseY');
    const x = binField(this, 'x');
    const y = binField(this, 'y');
    return lineDensity(q, x, y, z, +x0, +x1, +y0, +y1, nx, ny, rx, ry, groupby, normalize);
  }
}

// strip x, y fields from filter predicate
// to prevent improper clipping of line segments
// TODO: improve, perhaps with supporting query utilities
function stripXY(mark, filter) {
  if (Array.isArray(filter) && !filter.length) return filter;

  const xc = mark.channelField('x').column;
  const yc = mark.channelField('y').column;
  const test = p => p.op !== 'BETWEEN'
    || p.expr.column !== xc && p.expr.column !== yc;
  const filterAnd = p => p.op === 'AND'
    ? and(p.value.filter(c => test(c)))
    : p;

  return Array.isArray(filter)
    ? filter.filter(p => test(p)).map(p => filterAnd(p))
    : filterAnd(filter);
}

function lineDensity(
  input, x, y, z, x0, x1, y0, y1, xn, yn, rx, ry,
  groupby = [], normalize = true
) {
  const groups = groupby.concat(z);

  // bin x values
  const xx = rx ? `(${x1} - ${x}::DOUBLE)` : `(${x}::DOUBLE - ${x0})`;
  const xb = expr(`FLOOR(${xx} * ${(xn - 1) / (x1 - x0)}::DOUBLE)::INTEGER`);

  // bin y values
  const yy = ry ? `(${y1} - ${y}::DOUBLE)` : `(${y}::DOUBLE - ${y0})`;
  const yb = expr(`FLOOR(${yy} * ${(yn - 1) / (y1 - y0)}::DOUBLE)::INTEGER`);

  // select x, y points binned to the grid
  const q = Query.from(input).select(groups, { x: xb, y: yb });

  // select line segment end point pairs
  const pairPart = groups.length ? `PARTITION BY ${groups.join(', ')} ` : '';
  const pairs = Query
    .from(q)
    .select(groups, {
      x0: 'x',
      y0: 'y',
      dx: expr(`(lead(x) OVER sw - x)`),
      dy: expr(`(lead(y) OVER sw - y)`)
    })
    .window({ sw: expr(`${pairPart}ORDER BY x ASC`) })
    .qualify(and(
      expr(`(x0 < ${xn} OR x0 + dx < ${xn})`),
      expr(`(y0 < ${yn} OR y0 + dy < ${yn})`),
      expr(`(x0 > 0 OR x0 + dx > 0)`),
      expr(`(y0 > 0 OR y0 + dy > 0)`)
    ));

  // indices to join against for rasterization
  // generate the maximum number of indices needed
  const num = Query
    .select({ x: expr(`GREATEST(MAX(ABS(dx)), MAX(ABS(dy)))`) })
    .from('pairs');
  const indices = Query.select({ i: expr(`UNNEST(range((${num})))::INTEGER`) });

  // rasterize line segments
  const raster = Query.unionAll(
    Query
      .select(groups, {
        x: expr(`x0 + i`),
        y: expr(`y0 + ROUND(i * dy / dx::FLOAT)::INTEGER`)
      })
      .from('pairs', 'indices')
      .where(expr(`ABS(dy) <= ABS(dx) AND i < ABS(dx)`)),
    Query
      .select(groups, {
        x: expr(`x0 + ROUND(SIGN(dy) * i * dx / dy::FLOAT)::INTEGER`),
        y: expr(`y0 + SIGN(dy) * i`)
      })
      .from('pairs', 'indices')
      .where(expr(`ABS(dy) > ABS(dx) AND i < ABS(dy)`)),
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
        ? { w: expr(`1.0 / COUNT(*) OVER (PARTITION BY ${pointPart})`) }
        : null
    )
    .where(and(isBetween('x', [0, xn]), isBetween('y', [0, yn])));

  // sum normalized, rasterized series into output grids
  return Query
    .with({ pairs, indices, raster, points })
    .from('points')
    .select(groupby, {
      index: expr(`x + y * ${xn}::INTEGER`),
      value: normalize ? sum('w') : count()
    })
    .groupby('index', groupby);
}
