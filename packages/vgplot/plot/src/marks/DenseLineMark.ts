import { Query, and, lineDensity } from '@uwdata/mosaic-sql';
import { binExpr } from './util/bin-expr.js';
import { extentX, extentY } from './util/extent.js';
import { handleParam } from './util/handle-param.js';
import { RasterMark } from './RasterMark.js';

export class DenseLineMark extends RasterMark {
  constructor(source, options) {
    const { normalize = true, ...rest } = options;
    super(source, rest);

    /** @type {boolean} */
    this.normalize = handleParam(normalize, value => {
      return (this.normalize = value, this.requestUpdate());
    });
  }

  query(filter = []) {
    const { channels, normalize, pad } = this;
    const [nx, ny] = this.bins = this.binDimensions();
    const [x] = binExpr(this, 'x', nx, extentX(this, filter), pad);
    const [y] = binExpr(this, 'y', ny, extentY(this, filter), pad);

    const q = Query
      .from(this.sourceTable())
      .where(stripXY(this, filter));

    this.aggr = ['density'];
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

  // get column expressions for x and y encoding channels
  const xc = mark.channelField('x').column;
  const yc = mark.channelField('y').column;

  // test if a range predicate filters the x or y channels
  const test = p => {
    const col = `${p.expr}`;
    return p.type !== 'BETWEEN' || (col !== xc && col !== yc);
  };

  // filter boolean 'and' operations
  const filterAnd = p => p.op === 'AND'
    ? and(p.clauses.filter(c => test(c)))
    : p;

  return Array.isArray(filter)
    ? filter.filter(p => test(p)).map(p => filterAnd(p))
    : filterAnd(filter);
}
