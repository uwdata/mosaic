import { m4 } from '@uwdata/mosaic-sql';
import { binExpr } from './util/bin-expr.js';
import { filteredExtent } from './util/extent.js';
import { Mark } from './Mark.js';

export class ConnectedMark extends Mark {
  constructor(type, source, encodings) {
    const dim = type.endsWith('X') ? 'y' : type.endsWith('Y') ? 'x' : null;
    const req = dim ? { [dim]: ['count', 'min', 'max'] } : undefined;
    super(type, source, encodings, req);
    this.dim = dim;
  }

  optimizationInfo() {
    const { plot, dim, source } = this;
    
    const ortho = dim === 'x' ? 'y' : 'x';
    const value = this.channelField(ortho, { exact: true })?.as;
    const { as, type, count, min, max, column } = this.channelField(dim);
    const isContinuous = type === 'date' || type === 'number';
    const size = dim === 'x' ? plot.innerWidth() : plot.innerHeight();
    const optimize = source.options?.optimize ?? (count / size) > 10;

    return optimize && isContinuous && value
      ? { as, column, max, min, size, value }
      : null;
  }

  get filterStable() {
    return !this.optimizationInfo();
  }

  /**
   * Return a query specifying the data needed by this Mark client.
   * @param {*} [filter] The filtering criteria to apply in the query.
   * @returns {*} The client query
   */
  query(filter = []) {
    const { dim } = this;
    const q = super.query(filter);
    if (!dim) return q;
    const info = this.optimizationInfo();

    if (info) {
      // TODO: handle stacked data
      const { as, column, max, min, size, value } = info;
      const [lo, hi] = filteredExtent(filter, column) || [min, max];
      const [expr] = binExpr(this, dim, size, [lo, hi], 1, as);
      const cols = q._select
        .map(c => c.alias)
        .filter(c => c !== as && c !== value);
      return m4(q, expr, as, value, cols);
    } else {
      const { as } = this.channelField(dim);
      return q.orderby(as);
    }
  }
}
