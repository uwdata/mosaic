import { ExprNode, add, dateBin, div, float64, floor, interval, mul, sub } from '@uwdata/mosaic-sql';
import { Transform } from '../symbols.js';
import { channelScale } from '../marks/util/channel-scale.js';
import { bins } from './bin-step.js';
import { timeInterval } from './time-interval.js';

const EXTENT = new Set([
  'rectY-x', 'rectX-y', 'rect-x', 'rect-y', 'ruleY-x', 'ruleX-y'
]);

export function hasExtent(mark, channel) {
  return EXTENT.has(`${mark.type}-${channel}`);
}

export function bin(field, options = {}) {
  const fn = (mark, channel) => {
    if (hasExtent(mark, channel)) {
      return {
        [`${channel}1`]: binNode(mark, channel, field, options),
        [`${channel}2`]: binNode(mark, channel, field, { ...options, offset: 1 })
      };
    } else {
      return {
        [channel]: binNode(mark, channel, field, options)
      };
    }
  };
  fn[Transform] = true;
  return fn;
}

function binNode(mark, channel, column, options) {
  return new BinTransformNode(column, mark, channel, options);
}

function hasTimeScale(mark, channel) {
  const scale = mark.plot.getAttribute(`${channel}Scale`);
  return scale === 'utc' || scale === 'time';
}

class BinTransformNode extends ExprNode {
  constructor(column, mark, channel, options) {
    super('COLUMN_REF');
    this.column = column;
    this.mark = mark;
    this.channel = channel;
    this.options = options;
  }

  get stats() {
    return { column: this.column, stats: ['min', 'max'] };
  }

  toString() {
    const { mark, channel, column, options } = this;
    const { type, min, max } = mark.channelField(channel);
    const { interval: i, steps, offset = 0 } = options;
    const ival = i ?? (
      type === 'date' || hasTimeScale(mark, channel) ? 'date' : 'number'
    );

    let result;
    if (ival === 'number') {
      // perform number binning
      const { apply, sqlApply, sqlInvert } = channelScale(mark, channel);
      const b = bins(apply(min), apply(max), options);
      const col = sqlApply(column);
      const alpha = float64((b.max - b.min) / b.steps);
      const bin = floor(div(b.min === 0 ? col : sub(col, b.min), alpha));
      const expr = add(b.min, mul(alpha, offset ? add(offset, bin) : bin));
      result = sqlInvert(expr);
    } else {
      // perform date/time binning
      const { interval: unit, step = 1 } = ival === 'date'
        ? timeInterval(min, max, steps || 40)
        : options;
      const bin = dateBin(column, unit, step);
      result = offset ? add(bin, interval(unit, offset * step)) : bin;
    }
    return `${result}`;
  }
}
