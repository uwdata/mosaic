import type { SQLCodeGenerator, ExprValue } from '@uwdata/mosaic-sql';
import type { Mark } from '../marks/Mark.js';
import { ExprNode, binDate, binHistogram, duckDBCodeGenerator } from '@uwdata/mosaic-sql';
import { Transform } from '../symbols.js';
import { channelScale } from '../marks/util/channel-scale.js';
import type { TransformScaleName } from '../types.js';


type Options = { [key: string]: unknown; } & { offset?: number; };
type Column = ExprValue;
type BinReturn = { (mark: Mark, channel: TransformScaleName): Record<string, BinTransformNode>;[Transform]: true; };

const EXTENT = new Set([
  'rectY-x', 'rectX-y', 'rect-x', 'rect-y', 'ruleY-x', 'ruleX-y'
]);

export function hasExtent(mark: Mark, channel: TransformScaleName): boolean {
  return EXTENT.has(`${mark.type}-${channel}`);
}

export function bin(field: Column, options: Options = {}): BinReturn {
  const fn = (mark: Mark, channel: TransformScaleName) => {
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
  fn[Transform] = true as const;
  return fn;
}

function binNode(mark: Mark, channel: TransformScaleName, column: Column, options: Options): BinTransformNode {
  return new BinTransformNode(column, mark, channel, options);
}


function hasTimeScale(mark: Mark, channel: TransformScaleName): boolean {
  const scale = mark.plot.getAttribute(`${channel}Scale`);
  return scale === 'utc' || scale === 'time';
}

export class BinTransformNode extends ExprNode {
  constructor(public column: Column, public mark: Mark, public channel: TransformScaleName, public options: Options) {
    super('CUSTOM');
  }

  get stats(): { column: Column; stats: ['min', 'max']; } {
    return { column: this.column, stats: ['min', 'max'] };
  }

  toString(visitor: SQLCodeGenerator = duckDBCodeGenerator): string {
    const { mark, channel, column, options } = this;
    const { type, min, max } = mark.channelField(channel);
    const isDate = options.interval
      || type === 'date'
      || hasTimeScale(mark, channel);
    const result = isDate
      ? binDate(column, [min, max], options)
      : binHistogram(column, [min, max], options, channelScale(mark, channel));
    return visitor.toString(result);
  }
}
