import { asColumn } from '@uwdata/mosaic-sql';
import { Transform } from '../symbols.js';

const EXTENT = [
  'rectY-x', 'rectX-y', 'rect-x', 'rect-y'
];

function hasExtent(channel, type) {
  return EXTENT.includes(`${type}-${channel}`);
}

export function bin(field, options = { steps: 25 }) {
  const fn = (mark, channel) => {
    return hasExtent(channel, mark.type)
      ? {
          [`${channel}1`]: binField(mark, field, options),
          [`${channel}2`]: binField(mark, field, { ...options, offset: 1 })
        }
      : {
          [channel]: binField(mark, field, options)
        };
  };
  fn[Transform] = true;
  return fn;
}

function binField(mark, column, options) {
  return {
    column,
    label: column,
    get stats() { return ['min', 'max']; },
    get columns() { return [column]; },
    get basis() { return column; },
    toString() {
      const { min, max } = mark.stats[column];
      const b = bins(min, max, options);
      const col = asColumn(column);
      const base = b.min === 0 ? col : `(${col} - ${b.min})`;
      const alpha = `${(b.max - b.min) / b.steps}::DOUBLE`;
      const off = options.offset ? `${options.offset} + ` : '';
      return `${min} + ${alpha} * (${off}FLOOR(${base} / ${alpha})::INTEGER)`;
    }
  };
}

export function bins(min, max, options) {
  let { steps = 25, minstep = 0, nice = true } = options;

  if (nice !== false) {
    // use span to determine step size
    const span = max - min;
    const maxb = steps;
    const logb = Math.LN10;
    const level = Math.ceil(Math.log(maxb) / logb);
    let step = Math.max(
      minstep,
      Math.pow(10, Math.round(Math.log(span) / logb) - level)
    );

    // increase step size if too many bins
    while (Math.ceil(span / step) > maxb) { step *= 10; }

    // decrease step size if allowed
    const div = [5, 2];
    let v;
    for (let i = 0, n = div.length; i < n; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }

    v = Math.log(step);
    const precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
    const eps = Math.pow(10, -precision - 1);
    v = Math.floor(min / step + eps) * step;
    min = min < v ? v - step : v;
    max = Math.ceil(max / step) * step;
    steps = Math.round((max - min) / step);
  }

  return { min, max, steps };
}
