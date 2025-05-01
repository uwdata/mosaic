import { ExprNode, binDate, binHistogram } from '@uwdata/mosaic-sql';
import { Transform } from '../symbols.js';
import { channelScale } from '../marks/util/channel-scale.js';

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
    const isDate = options.interval
      || type === 'date'
      || hasTimeScale(mark, channel);
    const result = isDate
      ? binDate(column, [min, max], options)
      : binHistogram(column, [min, max], options, channelScale(mark, channel));
    return `${result}`;
  }
}
