import { dateBin } from '@uwdata/mosaic-sql';
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
    get columns() { return [column]; },
    get basis() { return column; },
    get stats() { return { column, stats: ['min', 'max'] }; },
    toString() {
      const { type, min, max } = mark.channelField(channel);
      const { interval: i, steps, offset = 0 } = options;
      const interval = i ?? (
        type === 'date' || hasTimeScale(mark, channel) ? 'date' : 'number'
      );

      if (interval === 'number') {
        // perform number binning
        const { apply, sqlApply, sqlInvert } = channelScale(mark, channel);
        const b = bins(apply(min), apply(max), options);
        const col = sqlApply(column);
        const base = b.min === 0 ? col : `(${col} - ${b.min})`;
        const alpha = `${(b.max - b.min) / b.steps}::DOUBLE`;
        const off = offset ? `${offset} + ` : '';
        const expr = `${b.min} + ${alpha} * (${off}FLOOR(${base} / ${alpha}))`;
        return `${sqlInvert(expr)}`;
      } else {
        // perform date/time binning
        const { interval: unit, step = 1 } = interval === 'date'
          ? timeInterval(min, max, steps || 40)
          : options;
        const off = offset ? ` + INTERVAL ${offset * step} ${unit}` : '';
        return `(${dateBin(column, unit, step)}${off})`;
      }
    }
  };
}

function hasTimeScale(mark, channel) {
  const scale = mark.plot.getAttribute(`${channel}Scale`);
  return scale === 'utc' || scale === 'time';
}
