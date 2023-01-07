import { Query, argmax, argmin, expr, max, min, epoch_ms } from '../../sql/index.js';
import { Mark } from './Mark.js';

export class ContinuousMark extends Mark {
  constructor(type, source, encodings) {
    super(type, source, encodings);
    this.dim = type.endsWith('X') ? 'y' : 'x';
  }

  query(filter = []) {
    const { plot, dim, source, _stats: stats } = this;
    const { transform = true } = source.options || {};
    const q = super.query(filter);

    if (transform) {
      // TODO: handle stacked data
      const { column } = this.channelField(dim);
      const { rows, type, min, max } = stats.find(s => s.column === column);
      const size = dim === 'x' ? plot.innerWidth() : plot.innerHeight();

      const [ lo, hi ] = filter[0]?.value || [min, max];
      const scale = (hi - lo) / (max - min);
      if (rows * scale > size * 4) {
        const dd = type === 'date' ? epoch_ms(dim) : dim;
        const val = dim === 'x' ? 'y' : 'x';
        const cols = q.select().map(c => c.as).filter(c => c !== 'x' && c !== 'y');
        return m4(q, dd, dim, val, lo, hi, size, cols);
      }
    }

    return q;
  }
}

function m4(input, bx, x, y, lo, hi, width, cols = []) {
  const bins = expr(`FLOOR(${width / (hi - lo)}::DOUBLE * (${bx} - ${lo}::DOUBLE))`);

  const q = (cols) => Query
    .from(input)
    .select(Object.fromEntries(cols))
    .groupby(bins);

  return Query
    .union(
      q([[x, min(x)], [y, argmin(y, x)], ...cols.map(c => [c, argmin(c, x)])]),
      q([[x, max(x)], [y, argmax(y, x)], ...cols.map(c => [c, argmax(c, x)])]),
      q([[x, argmin(x, y)], [y, min(y)], ...cols.map(c => [c, argmin(c, y)])]),
      q([[x, argmax(x, y)], [y, max(y)], ...cols.map(c => [c, argmax(c, y)])])
    )
    .orderby(cols, x);
}
