import { Query, argmax, argmin, expr, max, min } from '@uwdata/mosaic-sql';
import { binField } from './util/bin-field.js';
import { filteredExtent } from './util/extent.js';
import { Mark } from './Mark.js';

export class ConnectedMark extends Mark {
  constructor(type, source, encodings) {
    const dim = type.endsWith('X') ? 'y' : 'x';
    const req = { [dim]: ['count', 'min', 'max'] };

    super(type, source, encodings, req);
    this.dim = dim;
  }

  query(filter = []) {
    const { plot, dim, source, stats } = this;
    const { optimize = true } = source.options || {};
    const q = super.query(filter);

    if (optimize) {
      // TODO: handle stacked data
      const { column } = this.channelField(dim);
      const { count, max, min } = stats[column];
      const size = dim === 'x' ? plot.innerWidth() : plot.innerHeight();

      const [lo, hi] = filteredExtent(filter, column) || [min, max];
      const scale = (hi - lo) / (max - min);
      if (count * scale > size * 4) {
        const dd = binField(this, dim);
        const val = dim === 'x' ? 'y' : 'x';
        const cols = q.select().map(c => c.as).filter(c => c !== 'x' && c !== 'y');
        return m4(q, dd, dim, val, lo, hi, size, cols);
      }
    }

    return q.orderby(dim);
  }
}

function m4(input, bx, x, y, lo, hi, width, cols = []) {
  const bins = expr(`FLOOR(${width / (hi - lo)}::DOUBLE * (${bx} - ${+lo}::DOUBLE))::INTEGER`);

  const q = (sel) => Query
    .from(input)
    .select(sel)
    .groupby(bins, cols);

  return Query
    .union(
      q([{ [x]: min(x), [y]: argmin(y, x) }, ...cols]),
      q([{ [x]: max(x), [y]: argmax(y, x) }, ...cols]),
      q([{ [x]: argmin(x, y), [y]: min(y) }, ...cols]),
      q([{ [x]: argmax(x, y), [y]: max(y) }, ...cols])
    )
    .orderby(cols, x);
}
