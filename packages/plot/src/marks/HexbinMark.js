import { Query, isNotNull, sql } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { extentX, extentY, xyext } from './util/extent.js';
import { Mark } from './Mark.js';
import { handleParam } from './util/handle-param.js';

export class HexbinMark extends Mark {
  constructor(source, options) {
    const { type = 'hexagon', binWidth = 20, ...channels } = options;
    super(type, source, { r: binWidth / 2, clip: true, ...channels }, xyext);

    /** @type {number} */
    this.binWidth = handleParam(binWidth, value => {
      return (this.binWidth = value, this.requestUpdate());
    });
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
    const dims = new Set;
    const cols = {};
    for (const c of channels) {
      if (c.channel === 'orderby') {
        // ignore ordering, as we will aggregate
      } else if (c.channel === 'x') {
        x = c;
      } else if (c.channel === 'y') {
        y = c;
      } else if (Object.hasOwn(c, 'field')) {
        const { as, field } = c;
        cols[as] = field;
        if (!field.aggregate) {
          dims.add(as);
        }
      }
    }

    // Top-level query maps from screen space back to data values.
    // Doing so ensures that Plot generates correct data-driven scales.
    return Query.select({
        [x.as]: sql`${x1}::DOUBLE + ((_x + 0.5 * (_y & 1)) * ${dx} + ${ox})::DOUBLE / ${xr}`,
        [y.as]: sql`${y2}::DOUBLE - (_y * ${dy} + ${oy})::DOUBLE / ${yr}`,
        ...cols
      })
      .groupby('_x', '_y', ...dims)
      .from(
        // Subquery performs hex binning in screen space and also passes
        // original columns through (the DB should optimize this).
        Query.select({
            _py: sql`(${yr} * (${y2}::DOUBLE - ${y.field}) - ${oy}) / ${dy}`,
            _pj: sql`ROUND(_py)::INTEGER`,
            _px: sql`(${xr} * (${x.field} - ${x1}::DOUBLE) - ${ox}) / ${dx} - 0.5 * (_pj & 1)`,
            _pi: sql`ROUND(_px)::INTEGER`,
            _tt: sql`ABS(_py-_pj) * 3 > 1 AND (_px-_pi)**2 + (_py-_pj)**2 > (_px - _pi - 0.5 * CASE WHEN _px < _pi THEN -1 ELSE 1 END)**2 + (_py - _pj - CASE WHEN _py < _pj THEN -1 ELSE 1 END)**2`,
            _x: sql`CASE WHEN _tt THEN (_pi + (CASE WHEN _px < _pi THEN -0.5 ELSE 0.5 END) + (CASE WHEN _pj & 1 <> 0 THEN 0.5 ELSE -0.5 END))::INTEGER ELSE _pi END`,
            _y: sql`CASE WHEN _tt THEN (_pj + CASE WHEN _py < _pj THEN -1 ELSE 1 END)::INTEGER ELSE _pj END`
          }, '*')
          .from(source.table)
          .where(isNotNull(x.field), isNotNull(y.field), filter)
      );
  }
}
