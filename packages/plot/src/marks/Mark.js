import { isParam, MosaicClient, toDataColumns } from '@uwdata/mosaic-core';
import { Query, SelectQuery, collectParams, column, isAggregateExpression, isColumnParam, isColumnRef, isNode, isParamLike } from '@uwdata/mosaic-sql';
import { isColor } from './util/is-color.js';
import { isConstantOption } from './util/is-constant-option.js';
import { isSymbol } from './util/is-symbol.js';
import { Transform } from '../symbols.js';

const isColorChannel = channel => channel === 'stroke' || channel === 'fill';
const isOpacityChannel = channel => /opacity$/i.test(channel);
const isSymbolChannel = channel => channel === 'symbol';
const isFieldObject = (channel, field) => {
  return channel !== 'sort' && channel !== 'tip'
    && field != null && !Array.isArray(field);
};
const fieldEntry = (channel, field) => ({
  channel,
  field,
  as: isColumnRef(field) && !isColumnParam(field) ? field.column : channel
});
const valueEntry = (channel, value) => ({ channel, value });

// checks if a data source is an explicit array of values
// as opposed to a database table refernece
export const isDataArray = source => Array.isArray(source);

export class Mark extends MosaicClient {
  constructor(type, source, encodings, reqs = {}) {
    super(source?.options?.filterBy);
    this.type = type;
    this.reqs = reqs;
    this.source = source;

    const channels = this.channels = [];
    const detail = this.detail = new Set;
    const params = this.params = new Set;

    if (isDataArray(source)) {
      this.data = toDataColumns(source);
    } else if (isParam(source?.table)) {
      params.add(source.table);
    }

    const process = (channel, entry) => {
      const type = typeof entry;
      if (channel === 'channels') {
        for (const name in entry) {
          detail.add(name);
          process(name, entry[name]);
        }
      } else if (type === 'function' && entry[Transform]) {
        const enc = entry(this, channel);
        for (const key in enc) {
          process(key, enc[key]);
        }
      } else if (type === 'string') {
        if (
          isConstantOption(channel) ||
          isColorChannel(channel) && isColor(entry) ||
          isSymbolChannel(channel) && isSymbol(entry)
        ) {
          // interpret constants and color/symbol names as values, not fields
          channels.push(valueEntry(channel, entry));
        } else {
          channels.push(fieldEntry(channel, column(entry)));
        }
      } else if (isParamLike(entry)) {
        const c = valueEntry(channel, entry.value);
        channels.push(c);
        entry.addEventListener('value', value => {
          // update immediately, the value is simply passed to Plot
          c.value = value;
          return this.update();
        });
      } else if (isNode(entry)) {
        collectParams(entry).forEach(p => params.add(p));
        channels.push(fieldEntry(channel, entry))
      } else if (type === 'object' && isFieldObject(channel, entry)) {
        channels.push(fieldEntry(channel, entry));
      } else if (entry !== undefined) {
        channels.push(valueEntry(channel, entry));
      }
    };

    for (const channel in encodings) {
      process(channel, encodings[channel]);
    }
  }

  /**
   * @param {import('../plot.js').Plot} plot The plot.
   * @param {number} index
   */
  setPlot(plot, index) {
    this.plot = plot;
    this.index = index;
    plot.addParams(this, this.params);
    if (this.source?.table) this.queryPending();
  }

  sourceTable() {
    const table = this.source?.table;
    return table ? (isParam(table) ? table.value : table) : null;
  }

  hasOwnData() {
    return this.source == null || isDataArray(this.source);
  }

  hasFieldInfo() {
    return !!this._fieldInfo;
  }

  channel(channel) {
    return this.channels.find(c => c.channel === channel);
  }

  channelField(channel, { exact = false } = {}) {
    const c = exact
      ? this.channel(channel)
      : this.channels.find(c => c.channel.startsWith(channel));
    return c?.field ? c : null;
  }

  fields() {
    if (this.hasOwnData()) return null;

    const { channels, reqs } = this;
    const fields = new Map;
    for (const { channel, field } of channels) {
      if (!field) continue;
      const stats = field.stats?.stats || [];
      const key = field.stats?.column ?? field;
      const entry = fields.get(key) ?? fields.set(key, new Set).get(key);
      stats.forEach(s => entry.add(s));
      reqs[channel]?.forEach(s => entry.add(s));
    }

    const table = this.sourceTable();
    return Array.from(fields, ([c, s]) => ({
      table,
      column: c,
      stats: Array.from(s)
    }));
  }

  fieldInfo(info) {
    const lookup = Object.fromEntries(info.map(x => [x.column, x]));
    for (const entry of this.channels) {
      const { field } = entry;
      if (field) {
        Object.assign(entry, lookup[field.stats?.column ?? field]);
      }
    }
    this._fieldInfo = true;
    return this;
  }

  /**
   * Return a query specifying the data needed by this Mark client.
   * @param {*} [filter] The filtering criteria to apply in the query.
   * @returns {*} The client query
   */
  query(filter = []) {
    if (this.hasOwnData()) return null;
    return markQuery(this.channels, this.sourceTable()).where(filter);
  }

  queryPending() {
    this.plot.pending(this);
    return this;
  }

  /**
   * Provide query result data to the mark.
   */
  queryResult(data) {
    this.data = toDataColumns(data);
    return this;
  }

  update() {
    return this.plot.update(this);
  }

  /**
   * Generate an array of Plot mark specifications.
   * @returns {object[]}
   */
  plotSpecs() {
    const { type, data, detail, channels } = this;
    return markPlotSpec(type, detail, channels, data);
  }
}

/**
 * Helper method for setting a channel option in a Plot specification.
 * Checks if a constant value or a data field is needed.
 * Also avoids misinterpretation of data values as color names.
 * @param {*} c a visual encoding channel spec
 * @param {object} columns named data column arrays
 * @returns the Plot channel option
 */
export function channelOption(c, columns) {
  // use a scale override for color channels to sidestep
  // https://github.com/observablehq/plot/issues/1593
  const value = columns?.[c.as] ?? c.as;
  return Object.hasOwn(c, 'value') ? c.value
    : isColorChannel(c.channel) ? { value, scale: 'color' }
    : isOpacityChannel(c.channel) ? { value, scale: 'opacity' }
    : value;
}

/**
 * Default query construction for a mark.
 * Tracks aggregates by checking fields for an aggregate flag.
 * If aggregates are found, groups by all non-aggregate fields.
 * @param {*} channels array of visual encoding channel specs.
 * @param {*} table the table to query.
 * @param {*} skip an optional array of channels to skip.
 *  Mark subclasses can skip channels that require special handling.
 * @returns {SelectQuery} a Query instance
 */
export function markQuery(channels, table, skip = []) {
  const q = Query.from({ source: table });
  const dims = new Set;
  let aggr = false;

  for (const c of channels) {
    const { channel, field, as } = c;
    if (skip.includes(channel)) continue;

    if (channel === 'orderby') {
      q.orderby(c.value ?? field);
    } else if (field) {
      if (isAggregateExpression(field)) {
        aggr = true;
      } else {
        if (dims.has(as)) continue;
        dims.add(as);
      }
      q.select({ [as]: field });
    }
  }

  if (aggr) {
    q.groupby(Array.from(dims));
  }

  return q;
}


/**
 * Generate an array of Plot mark specifications.
 * @returns {object[]}
 */
export function markPlotSpec(type, detail, channels, data, options = {}) {
  // @ts-ignore
  const { numRows: length, values, columns } = data ?? {};

  // populate plot specification options
  const side = {};
  for (const c of channels) {
    const obj = detail.has(c.channel) ? side : options;
    obj[c.channel] = channelOption(c, columns);
  }
  if (detail.size) options.channels = side;

  // if provided raw source values (not objects) pass as-is
  // otherwise we pass columnar data directy in the options
  const specData = values ?? (data ? { length } : null);
  const spec = [{ type, data: specData, options }];
  return spec;
}
