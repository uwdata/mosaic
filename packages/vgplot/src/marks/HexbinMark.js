import { Query, isNotNull, sql } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { extentX, extentY, xyext } from './util/extent.js';
import { Mark } from './Mark.js';

export class HexbinMark extends Mark {
  constructor(source, options) {
    const { type = 'hexagon', binWidth = 20, ...channels } = options;
    super(type, source, { r: binWidth / 2, clip: true, ...channels }, xyext);
    this.binWidth = binWidth;
  }

  get filterIndexable() {
    const xdom = this.plot.getAttribute('xDomain');
    const ydom = this.plot.getAttribute('yDomain');
    return xdom && ydom && !xdom[Transient] && !ydom[Transient];
  }

  query(filter = []) {
    if (this.hasOwnData()) return null;
    const { plot, binWidth, channels, source } = this;

    // get x / y extents, may update plot domainX / domainY
    const [x1, x2] = extentX(this, filter);
    const [y1, y2] = extentY(this, filter);

    // Adjust screen-space coordinates by top/left
    // margins as this is what Observable Plot does.
    // TODO use zero margins when faceted?
    const ox = 0.5 - plot.getAttribute('marginLeft');
    const oy = 0 - plot.getAttribute('marginTop');
    const dx = `${binWidth}::DOUBLE`;
    const dy = `${binWidth * (1.5 / Math.sqrt(3))}::DOUBLE`;
    const xr = `${plot.innerWidth() / (x2 - x1)}::DOUBLE`;
    const yr = `${plot.innerHeight() / (y2 - y1)}::DOUBLE`;

    // Extract channel information, update top-level query
    // and extract dependent columns for aggregates
    let x, y;
    const aggr = new Set;
    const cols = {};
    for (const c of channels) {
      if (c.channel === 'order') {
        q.orderby(c.value); // TODO revisit once groupby is added
      } else if (c.channel === 'x') {
        x = c;
      } else if (c.channel === 'y') {
        y = c;
      } else if (Object.hasOwn(c, 'field')) {
        cols[c.as] = c.field;
        if (c.field.aggregate) {
          c.field.columns.forEach(col => aggr.add(col));
        }
      }
    }

    // Top-level query; we add a hex binning subquery below
    // Maps binned screen space coordinates back to data
    // values to ensure we get correct data-driven scales
    const q = Query.select({
      [x.as]: sql`${x1}::DOUBLE + ((x + 0.5 * (y & 1)) * ${dx} + ${ox})::DOUBLE / ${xr}`,
      [y.as]: sql`${y2}::DOUBLE - (y * ${dy} + ${oy})::DOUBLE / ${yr}`,
      ...cols
    }).groupby('x', 'y');

    // Map x/y channels to screen space
    const xx = `${xr} * (${x.field} - ${x1}::DOUBLE)`;
    const yy = `${yr} * (${y2}::DOUBLE - ${y.field})`;

    // Perform hex binning of x/y coordinates
    // TODO add groupby dims
    const hex = Query
      .select({
        py: sql`(${yy} - ${oy}) / ${dy}`,
        pj: sql`ROUND(py)::INTEGER`,
        px: sql`(${xx} - ${ox}) / ${dx} - 0.5 * (pj & 1)`,
        pi: sql`ROUND(px)::INTEGER`,
        tt: sql`ABS(py-pj) * 3 > 1 AND (px-pi)**2 + (py-pj)**2 > (px - pi - 0.5 * CASE WHEN px < pi THEN -1 ELSE 1 END)**2 + (py - pj - CASE WHEN py < pj THEN -1 ELSE 1 END)**2`,
        x: sql`CASE WHEN tt THEN (pi + (CASE WHEN px < pi THEN -0.5 ELSE 0.5 END) + (CASE WHEN pj & 1 <> 0 THEN 0.5 ELSE -0.5 END))::INTEGER ELSE pi END`,
        y: sql`CASE WHEN tt THEN (pj + CASE WHEN py < pj THEN -1 ELSE 1 END)::INTEGER ELSE pj END`
      })
      .select(Array.from(aggr))
      .from(source.table)
      .where(isNotNull(x.field), isNotNull(y.field), filter)

    return q.from(hex);
  }
}
