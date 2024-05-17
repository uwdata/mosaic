import { Transform } from '../symbols.js';
import { channelScale } from '../marks/util/channel-scale.js';

const EXTENT = new Set([
  'rectY-x', 'rectX-y', 'rect-x', 'rect-y', 'ruleY-x', 'ruleX-y'
]);

export function bin(field, options = { steps: 25 }) {
  const fn = (mark, channel) => {
    if (EXTENT.has(`${mark.type}-${channel}`)) {
      return {
        [`${channel}1`]: binField(mark, channel, field, options),
        [`${channel}2`]: binField(mark, channel, field, { ...options, offset: 1 })
      };
    } else {
      return {
        [channel]: binField(mark, channel, field, options)
      };
    }
  };
  fn[Transform] = true;
  return fn;
}

function binField(mark, channel, column, options) {
  return {
    column,
    label: column,
    get stats() { return { column, stats: ['min', 'max'] }; },
    get columns() { return [column]; },
    get basis() { return column; },
    toString() {
      const { apply, sqlApply, sqlInvert } = channelScale(mark, channel);
      const { min, max } = mark.channelField(channel);
      const b = bins(apply(min), apply(max), options);
      const col = sqlApply(column);
      const base = b.min === 0 ? col : `(${col} - ${b.min})`;
      const alpha = `${(b.max - b.min) / b.steps}::DOUBLE`;
      const off = options.offset ? `${options.offset} + ` : '';
      const expr = `${b.min} + ${alpha} * (${off}FLOOR(${base} / ${alpha}))`;
      return `${sqlInvert(expr)}`;
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
