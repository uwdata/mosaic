import { MosaicClient } from '@uwdata/mosaic-core';
import { Query, Ref, column, isParamLike } from '@uwdata/mosaic-sql';
import { isColor } from './util/is-color.js';
import { isConstantOption } from './util/is-constant-option.js';
import { isSymbol } from './util/is-symbol.js';
import { toDataArray } from './util/to-data-array.js';
import { Transform } from '../symbols.js';

const isColorChannel = channel => channel === 'stroke' || channel === 'fill';
const isSymbolChannel = channel => channel === 'symbol';
const isFieldObject = (channel, field) => {
  return channel !== 'sort' && channel !== 'tip'
    && field != null && !Array.isArray(field);
};
const fieldEntry = (channel, field) => ({
  channel,
  field,
  as: field instanceof Ref ? field.column : channel
});
const valueEntry = (channel, value) => ({ channel, value });

export const isDataArray = source => Array.isArray(source);

export class Mark extends MosaicClient {
  constructor(type, source, encodings, reqs = {}) {
    super(source?.options?.filterBy);
    this.type = type;
    this.reqs = reqs;

    this.source = source;
    if (isDataArray(this.source)) {
      this.data = this.source;
    }

    const channels = this.channels = [];
    const detail = this.detail = new Set;
    const params = this.params = new Set;

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
        if (Array.isArray(entry.columns)) {
          channels.push(fieldEntry(channel, entry));
          params.add(entry);
        } else {
          const c = valueEntry(channel, entry.value);
          channels.push(c);
          entry.addEventListener('value', value => {
            c.value = value;
            return this.update();
          });
        }
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

  setPlot(plot, index) {
    this.plot = plot;
    this.index = index;
    plot.addParams(this, this.params);
    if (this.source?.table) this.queryPending();
  }

  hasOwnData() {
    return this.source == null || isDataArray(this.source);
  }

  channel(channel) {
    return this.channels.find(c => c.channel === channel);
  }

  channelField(...channels) {
    const list = channels.flat();
    for (const channel of list) {
      const c = this.channel(channel);
      if (c?.field) return c;
    }
    return null;
  }

  fields() {
    if (this.hasOwnData()) return null;
    const { source: { table }, channels, reqs } = this;

    const fields = new Map;
    for (const { channel, field } of channels) {
      const column = field?.column;
      if (!column) {
        continue; // no column to lookup
      } else if (field.stats?.length || reqs[channel]) {
        if (!fields.has(column)) fields.set(column, new Set);
        const entry = fields.get(column);
        reqs[channel]?.forEach(s => entry.add(s));
        field.stats?.forEach(s => entry.add(s));
      }
    }
    return Array.from(fields, ([column, stats]) => {
      return { table, column, stats: Array.from(stats) };
    });
  }

  fieldInfo(info) {
    this.stats = info.reduce(
      (o, d) => (o[d.column] = d, o),
      Object.create(null)
    );
    return this;
  }

  query(filter = []) {
    if (this.hasOwnData()) return null;
    const { channels, source: { table } } = this;
    return markQuery(channels, table).where(filter);
  }

  queryPending() {
    this.plot.pending(this);
    return this;
  }

  queryResult(data) {
    this.data = toDataArray(data);
    return this;
  }

  update() {
    return this.plot.update(this);
  }

  plotSpecs() {
    const { type, data, detail, channels } = this;
    const options = {};
    const side = {};
    for (const c of channels) {
      const obj = detail.has(c.channel) ? side : options;
      obj[c.channel] = channelOption(c)
    }
    if (detail.size) options.channels = side;
    return [{ type, data, options }];
  }
}

export function channelOption(c) {
  // use a scale override for color channels to sidestep
  // https://github.com/observablehq/plot/issues/1593
  return Object.hasOwn(c, 'value') ? c.value
    : isColorChannel(c.channel) ? { value: c.as, scale: 'color' }
    : c.as;
}

export function markQuery(channels, table, skip = []) {
  const q = Query.from({ source: table });
  const dims = new Set;
  let aggr = false;

  for (const c of channels) {
    const { channel, field, as } = c;
    if (skip.includes(channel)) continue;

    if (channel === 'orderby') {
      q.orderby(c.value);
    } else if (field) {
      if (field.aggregate) {
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
