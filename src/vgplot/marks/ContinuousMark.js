import { Query, argmax, argmin, expr, max, min, unnest } from '../../sql/index.js';
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
      const val = dim === 'x' ? 'y' : 'x';
      const { column } = this.channelField(dim);
      const { rows, min, max } = stats.find(s => s.column === column);
      const size = dim === 'x' ? plot.innerWidth() : plot.innerHeight();

      const [ lo, hi ] = filter[0]?.value || [min, max];
      const scale = (hi - lo) / (max - min);
      if (rows * scale > size * 4) {
        return m4(q, dim, val, lo, hi, size);
      }
    }

    return q;
  }
}

function m4(input, x, y, lo, hi, width) {
  return Query.from(input)
    .select({
      [x]: unnest([min(x), max(x), argmin(x, y), argmax(x, y)]),
      [y]: unnest([argmin(y, x), argmax(y, x), min(y), max(y)])
    })
    .distinct()
    .groupby(expr(`FLOOR(${width / (hi - lo)}::DOUBLE * (${x} - ${lo}))`))
    .orderby(x);
}
