import { Query, count, sum, expr, isNull } from '../../sql/index.js';
import { extentX, extentY } from './util/extent.js';
import { HeatmapMark } from './HeatmapMark.js';

export class DenseLineMark extends HeatmapMark {
  constructor(source, options) {
    const { normalize = true, ...rest } = options;
    super(source, { bandwidth: 0, ...rest });
    this.normalize = normalize;
  }

  query(filter = []) {
    const { plot, channels, normalize, source, stats } = this;

    const q = Query.from(source.table).where(filter);
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

    const [x0, x1] = extentX(this, filter);
    const [y0, y1] = extentY(this, filter);
    const [nx, ny] = this.bins = [
      Math.round(plot.innerWidth() / this.scaleFactor),
      Math.round(plot.innerHeight() / this.scaleFactor)
    ];
    const rx = !!plot.getAttribute('reverseX');
    const ry = !!plot.getAttribute('reverseY');
    return lineDensity(q, 'x', 'y', z, x0, x1, y0, y1, nx, ny, rx, ry, groupby, normalize);
  }
}

function lineDensity(
  input, x, y, z, x0, x1, y0, y1, xn, yn, rx, ry,
  groupby = [], normalize = true
) {
  const groups = groupby.concat(z);

  // bin x values
  const xx = rx ? `(${x1} - ${x})` : `(${x} - ${x0})`;
  const xb = expr(`FLOOR(${xx} * ${(xn - 1) / (x1 - x0)}::DOUBLE)::INTEGER`);

  // bin y values
  const yy = ry ? `(${y1} - ${y})` : `(${y} - ${y0})`;
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
    .window({ sw: expr(`${pairPart}ORDER BY x ASC`) });

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

  // normalize columns for each series
  const pointPart = ['x'].concat(groups).join(', ');
  const points = Query
    .from('raster')
    .select(groups, 'x', 'y', {
      w: expr(`1.0 / COUNT(*) OVER (PARTITION BY ${pointPart})`)
    });

  // sum normalized, rasterized series into output grids
  return Query
    .with({ pairs, indices, raster, points })
    .from(normalize ? 'points' : 'raster')
    .select(groupby, {
      index: expr(`x + y * ${xn}::INTEGER`),
      weight: normalize ? sum('w') : count()
    })
    .groupby('index', groupby);
}
