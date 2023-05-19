import { MosaicClient } from '@uwdata/mosaic-core';
import { Query, column, isParamLike } from '@uwdata/mosaic-sql';
import { isColor } from './util/is-color.js';
import { isConstantOption } from './util/is-constant-option.js';
import { isSymbol } from './util/is-symbol.js';
import { Transform } from '../symbols.js';

const isColorChannel = channel => channel === 'stroke' || channel === 'fill';
const isSymbolChannel = channel => channel === 'symbol';

export class Mark extends MosaicClient {
  constructor(type, source, encodings, reqs = {}) {
    super(source?.options?.filterBy);
    this.type = type;
    this.reqs = reqs;

    this.source = source;
    if (Array.isArray(this.source)) {
      this.data = this.source;
    }

    const channels = this.channels = [];
    const params = this.params = new Set;

    const process = (channel, entry) => {
      const type = typeof entry;
      if (type === 'function' && entry[Transform]) {
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
          channels.push({ channel, value: entry });
        } else {
          channels.push({ channel, field: column(entry) });
        }
      } else if (isParamLike(entry)) {
        if (Array.isArray(entry.columns)) {
          channels.push({ channel, field: entry });
          params.add(entry);
        } else {
          const c = { channel, value: entry.value };
          channels.push(c);
          entry.addEventListener('value', value => {
            c.value = value;
            return this.update();
          });
        }
      } else if (type === 'object' && !Array.isArray(entry) && entry != null) {
        channels.push({ channel, field: entry });
      } else if (entry !== undefined) {
        channels.push({ channel, value: entry });
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
    return this.source == null || Array.isArray(this.source);
  }

  channel(channel) {
    return this.channels.find(c => c.channel === channel);
  }

  channelField(...channels) {
    const list = channels.flat();
    for (const channel of list) {
      const field = this.channel(channel)?.field;
      if (field) return field;
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

  fieldStats(data) {
    this.stats = data.reduce(
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
    this.data = Array.from(data);
    return this;
  }

  update() {
    return this.plot.update(this);
  }

  plotSpecs() {
    const { type, data, channels } = this;
    const ownData = this.hasOwnData();
    const options = {};
    for (const c of channels) {
      options[c.channel] = Object.hasOwn(c, 'value') ? c.value
        : ownData ? c.field.column
        : c.channel;
    }
    return [{ type, data, options }];
  }
}

export function markQuery(channels, table, skip = []) {
  const q = Query.from({ source: table });
  const dims = [];
  let aggr = false;

  for (const c of channels) {
    const { channel, field } = c;
    if (skip.includes(channel)) continue;

    if (channel === 'order') {
      q.orderby(c.value);
    } else if (field) {
      if (field.aggregate) {
        aggr = true;
      } else {
        dims.push(channel);
      }
      q.select({ [channel]: field });
    }
  }

  if (aggr) {
    q.groupby(dims);
  }

  return q;
}
