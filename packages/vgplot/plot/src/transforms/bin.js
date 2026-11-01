/** 
 * @import { SQLCodeGenerator } from '@uwdata/mosaic-sql'; 
 * @import { Mark } from '../marks/Mark.js';
 * 
 * @typedef {{ [key: string]: unknown; } & {offset?: number} } Options
 * @typedef { 'ariaLabel' | 'fill' | 'fillOpacity' | 'fontSize' | 'fx' | 'fy' | 'geometry' | 'height' | 'href' | 'length' | 'opacity' | 'path' | 'r' | 'rotate' | 'src' | 'stroke' | 'strokeOpacity' | 'strokeWidth' | 'symbol' | 'text' | 'title' | 'weight' | 'width' | 'x' | 'x1' | 'x2' | 'y' | 'y1' | 'y2' | 'z' | 'color'} Channel
 * Like [ChannelName][1], but excluding ([microsoft/TypeScript#29729][2]) and including `'color'`.
 * 
 * [1]: https://github.com/observablehq/plot/blob/535723d5e433727720d9b673c31622821bb03210/src/channel.d.ts#L25-L60
 * [2]: microsoft/TypeScript#29729
 * 
 * @typedef {import('@uwdata/mosaic-sql').ExprValue} Column
 * 
*/
import { ExprNode, binDate, binHistogram, duckDBCodeGenerator } from '@uwdata/mosaic-sql';
import { Transform } from '../symbols.js';
import { channelScale } from '../marks/util/channel-scale.js';

const EXTENT = new Set([
  'rectY-x', 'rectX-y', 'rect-x', 'rect-y', 'ruleY-x', 'ruleX-y'
]);

/**
 * @param {Mark} mark
 * @param {Channel} channel
 */
export function hasExtent(mark, channel) {
  return EXTENT.has(`${mark.type}-${channel}`);
}

/**@typedef {{ (mark: Mark, channel: Channel): Record<string, BinTransformNode>; [Transform]: true;}} BinReturn */

/**
 * @param {Column} field
 * @param {Options} options
 * @returns {BinReturn}
 */
export function bin(field, options = {}) {
  /**@type BinReturn */
  const fn = (/** @type {Mark} */ mark, /** @type {Channel} */ channel) => {
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

/**
 * @param {Mark} mark
 * @param {Channel} channel
 * @param {Column} column
 * @param {Options} options
 * @returns {BinTransformNode}
 */
function binNode(mark, channel, column, options) {
  return new BinTransformNode(column, mark, channel, options);
}

/**
 * @param {Mark} mark
 * @param {Channel} channel
 */
function hasTimeScale(mark, channel) {
  const scale = mark.plot.getAttribute(`${channel}Scale`);
  return scale === 'utc' || scale === 'time';
}

class BinTransformNode extends ExprNode {
  /**
   * @param {Column} column
   * @param {Mark} mark
   * @param {Channel} channel
   * @param {Options} options
   */
  constructor(column, mark, channel, options) {
    super('CUSTOM');
    this.column = column;
    this.mark = mark;
    this.channel = channel;
    this.options = options;
  }

  /** @returns {{column: Column, stats: ['min', 'max']}} */
  get stats() {
    return { column: this.column, stats: ['min', 'max'] };
  }

  /**
   * @param {SQLCodeGenerator} visitor
   * @returns {string}
   */
  toString(visitor = duckDBCodeGenerator) {
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
