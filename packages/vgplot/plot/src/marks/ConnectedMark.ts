import { m4 } from '@uwdata/mosaic-sql';
import type * as msql from '@uwdata/mosaic-sql';
import { binExpr } from './util/bin-expr.js';
import { filteredExtent } from './util/extent.js';
import { Mark, type Encodings } from './Mark.js';
import type { MarkType } from '../types.js';

export class ConnectedMark extends Mark {
  public dim: 'x' | 'y' | null;
  constructor(type: MarkType, source: any, encodings: Encodings = {}) {
    const dim = type.endsWith('X') ? 'y' : type.endsWith('Y') ? 'x' : null;
    const req = dim ? { [dim]: ['count', 'min', 'max'] } : undefined;
    super(type, source, encodings, req);
    this.dim = dim;
  }

  query(filter: msql.FilterExpr = []): msql.SelectQuery | null {
    const { plot, dim, source } = this;
    let optimize = source.options?.optimize;
    const q = super.query(filter);
    if (!dim) return q;

    const ortho = dim === 'x' ? 'y' : 'x';
    const value = this.channelField(ortho, { exact: true })?.as;
    const { field, as, type, count, min, max } = this.channelField(dim);
    const isContinuous = type === 'date' || type === 'number';

    const plotSize = dim === 'x' ? plot.innerWidth() : plot.innerHeight();
    const size = Math.ceil(plotSize * (globalThis.devicePixelRatio || 1));

    optimize ??= (count / size) > 10; // threshold for applying M4

    if (optimize && isContinuous && value) {
      // TODO: handle stacked data
      const [lo, hi] = filteredExtent(filter, field) || [min, max];
      const [expr] = binExpr(this, dim, size, [lo, hi], 1, as);
      const cols = q._select
        .map(c => c.alias)
        .filter(c => c !== as && c !== value);
      return m4(q, expr, as, value, cols);
    } else {
      return q.orderby(as);
    }
  }
}
