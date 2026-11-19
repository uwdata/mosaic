import type { SQLCodeGenerator, ExprValue, BinDateOptions } from '@uwdata/mosaic-sql';
import { ExprNode, binDate, binHistogram, duckDBCodeGenerator } from '@uwdata/mosaic-sql';
import { Transform } from '../symbols.js';
import { channelScale } from '../marks/util/channel-scale.js';
import type { MarkType, TransformScaleName } from '../types.js';

/** The subset of `Mark` that `bin` and scales depend on.*/
export interface MarkDeps {
  readonly type: MarkType;
  channelField(channel: any): any;
  readonly plot?: {getAttribute(name: string): any}
}

export interface BinNumericOptions {
  interval?: 'number';
  step?: number;
  steps?: number;
  minstep?: number;
  nice?: boolean;
  offset?: number;
}

export type BinOptions = BinNumericOptions | BinDateOptions;


type Column = ExprValue;

type ChannelExtent = 'x1' | 'y1' | 'x2' | 'y2';
type BinChannels = Partial<Record<ChannelExtent | TransformScaleName, BinTransformNode>>;
interface BinReturn {
  (mark: MarkDeps, channel: TransformScaleName): BinChannels;
  [Transform]: true;
}

type MarkTypeExtent = 'rectY' | 'rectX' | 'rect' | 'rect' | 'ruleY' | 'ruleX';

const EXTENT = new Set([
  'rectY-x', 'rectX-y', 'rect-x', 'rect-y', 'ruleY-x', 'ruleX-y'
]);


const EXTENT_MARK = new Set(['rectY', 'rectX', 'rect', 'rect', 'ruleY', 'ruleX']);

function hasExtent(type: MarkTypeExtent, channel: TransformScaleName): channel is 'x' | 'y' {
  return EXTENT.has(`${type}-${channel}`);
}

function isMarkTypeExtent(type: MarkType): type is MarkTypeExtent{
  return EXTENT_MARK.has(type);
}

export function bin(field: Column, options: BinOptions = {}): BinReturn {
  const fn = (mark: MarkDeps, channel: TransformScaleName): BinChannels => {
    const type = mark.type;
    if (isMarkTypeExtent(type) && (hasExtent(type, channel))) {
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

function binNode(mark: MarkDeps, channel: TransformScaleName, column: Column, options: BinOptions): BinTransformNode {
  return new BinTransformNode(column, mark, channel, options);
}


function hasTimeScale(mark: MarkDeps, channel: TransformScaleName): boolean {
  const scale = mark.plot.getAttribute(`${channel}Scale`);
  return scale === 'utc' || scale === 'time';
}

export class BinTransformNode extends ExprNode {
  constructor(public column: Column, public mark: MarkDeps, public channel: TransformScaleName, public options: BinOptions) {
    super('CUSTOM');
  }

  get stats(): { column: Column; stats: ['min', 'max']; } {
    return { column: this.column, stats: ['min', 'max'] };
  }

  toString(visitor: SQLCodeGenerator = duckDBCodeGenerator): string {
    const { mark, channel, column, options } = this;
    const { type, min, max } = mark.channelField(channel);
    const isDate = (options.interval && options.interval !== 'number')
      || type === 'date'
      || hasTimeScale(mark, channel);
    const result = isDate
      //@ts-expect-error explicitly passing `'number'` isn't covered and could fail via the 2 inferred branches
      ? binDate(column, [min, max], options)
      : binHistogram(column, [min, max], options, channelScale(mark, channel));
    return visitor.toString(result);
  }
}
