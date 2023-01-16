import { Query, expr, isNotNull } from '../../sql/index.js';
import { extentX, extentY } from './util/extent.js';
import { Mark } from './Mark.js';

export class HexbinMark extends Mark {
  constructor(source, options) {
    const { binWidth = 20, ...channels } = options;
    super('hexagon', source, { r: binWidth / 2, clip: true, ...channels });
    this.binWidth = binWidth;
  }

  query(filter = []) {
    const { plot, binWidth, channels, source } = this;

    if (source == null || Array.isArray(source)) {
      return null;
    }

    const width = plot.innerWidth();
    const height = plot.innerHeight();
    const [x1, x2] = extentX(this);
    const [y1, y2] = extentY(this);
    const ox = 0.5;
    const oy = 0;
    const dx = binWidth;
    const dy = dx * (1.5 / Math.sqrt(3));
    const xr = width / (x2 - x1);
    const yr = height / (y2 - y1);

    const q = Query
      .select({
        x: expr(`${x1} + ((x - 0.5 + 0.5 * (y & 1)) * ${dx} + ${ox})::DOUBLE / ${xr}`),
        y: expr(`${y2} - (y * ${dy} + ${oy})::DOUBLE / ${yr}`)
      })
      .groupby('x', 'y');

    let x, y;
    const aggr = new Set;
    for (const c of channels) {
      if (c.channel === 'order') {
        q.orderby(c.value); // TODO revisit once groupby is added
      } else if (c.channel === 'x') {
        x = c.field;
      } else if (c.channel === 'y') {
        y = c.field;
      } else if (Object.hasOwn(c, 'field')) {
        q.select({ [c.channel]: c.field });
        if (c.field.aggregate) {
          c.field.columns.forEach(col => aggr.add(col));
        }
      }
    }

    const xx = `${xr}::DOUBLE * (${x} - ${x1})`;
    const yy = `${yr}::DOUBLE * (${y2} - ${y})`;

    // TODO add groupby dims
    const hex = Query
      .select({
        py: expr(`(${yy} - ${oy}) / ${dy}`),
        pj: expr(`ROUND(py)::INTEGER`),
        px: expr(`(${xx} - ${ox}) / ${dx} - 0.5 * (pj & 1)`),
        pi: expr(`ROUND(px)::INTEGER`),
        tt: expr(`ABS(py-pj) * 3 > 1 AND (px-pi)**2 + (py-pj)**2 > (px - pi - 0.5 * CASE WHEN px < pi THEN -1 ELSE 1 END)**2 + (py - pj - CASE WHEN py < pj THEN -1 ELSE 1 END)**2`),
        x: expr(`CASE WHEN tt THEN (pi + (CASE WHEN px < pi THEN -0.5 ELSE 0.5 END) + (CASE WHEN pj & 1 <> 0 THEN 0.5 ELSE -0.5 END))::INTEGER ELSE pi END`),
        y: expr(`CASE WHEN tt THEN (pj + CASE WHEN py < pj THEN -1 ELSE 1 END)::INTEGER ELSE pj END`)
      })
      .select(Array.from(aggr))
      .from(source.table)
      .where(isNotNull(x), isNotNull(y), filter)

    return q.from(hex);
  }
}
