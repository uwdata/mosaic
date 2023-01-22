import { Query, count, sum, expr } from '../../sql/index.js';
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

    const [x0, x1] = extentX(this);
    const [y0, y1] = extentY(this);
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
  const q = Query.from(input).select({ x: xb, y: yb }, groups);

  // select line segment end point pairs
  const pairPart = groups.length ? `PARTITION BY ${groups.join(', ')} ` : '';
  const pairs = Query.from(q)
    .select(groups, {
      x0: 'x',
      y0: 'y',
      x1: expr(`lead(x) OVER sw`), // lead('x').over('sw')
      y1: expr(`lead(y) OVER sw`)  // lead('y').over('sw')
    })
    .window({ sw: expr(`${pairPart}ORDER BY x ASC`) });

  // rasterize line segments (Bresenham's algorithm)
  const lines = Query.from(pairs)
    .select({
      x: expr(`UNNEST(CASE WHEN x1 IS NULL THEN
  [x0]
WHEN ABS(y1 - y0) < ABS(x1 - x0) THEN
  RANGE(x0, x1)
ELSE
  CASE WHEN y0 > y1 THEN
    LIST_TRANSFORM(
      RANGE(y0 - y1),
      i -> x1 + ((i + 1) * 2 * (x0 - x1) - (y0 - y1)) / (2 * (y0 - y1))
    )
  ELSE
    LIST_TRANSFORM(
      range(y1 - y0),
      i -> x0 + ((i + 1) * 2 * (x1 - x0) - (y1 - y0)) / (2 * (y1 - y0))
    )
  END
END)`),
      y: expr(`UNNEST(CASE WHEN y1 IS NULL THEN
  [y0]
WHEN ABS(y1 - y0) < ABS(x1 - x0) THEN
    LIST_TRANSFORM(
      RANGE(x1 - x0),
      i -> y0 + ((i + 1) * 2 * (y1 - y0) - (x1 - x0)) / (2 * (x1 - x0))
    )
ELSE
  CASE WHEN y0 > y1 THEN
    RANGE(y1, y0)
  ELSE
    RANGE(y0, y1)
  END
END)`)
    }, groups);

  // normalize columns for each series
  let points = lines;
  if (normalize) {
    const pointPart = ['x'].concat(groups).join(', ');
    points = Query.from(lines)
      .select('x', 'y', groups)
      .select({ w: expr(`1.0 / COUNT(*) OVER (PARTITION BY ${pointPart})`)});
  }

  // sum normalized, rasterized series into output grids
  return Query.from(points)
    .select(groupby, {
      index: expr(`x + y * ${xn}::INTEGER`),
      weight: normalize ? sum('w') : count()
    })
    .groupby('index', groupby);
}
