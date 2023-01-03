import { isSignal } from '../../mosaic/Signal.js';
import { Query, column } from '../../sql/index.js';
import { isColor } from './util/is-color.js';

const isColorChannel = channel => channel === 'stroke' || channel === 'fill';
const isConstantChannel = channel => channel === 'order';

export class Mark {
  constructor(type, source, encodings) {
    this.type = type;

    this.source = source;
    if (Array.isArray(this.source)) {
      this._data = this.source;
    }

    const channels = this.channels = [];

    const process = (channel, entry) => {
      const type = typeof entry;
      if (type === 'function') {
        const enc = entry(channel);
        for (const key in enc) {
          process(key, enc[key]);
        }
      } else if (type === 'string') {
        if (isConstantChannel(channel) || isColorChannel(channel) && isColor(entry)) {
          // interpret color names as constants, not fields
          channels.push({ channel, value: entry });
        } else {
          channels.push({ channel, field: column(entry) });
        }
      } else if (isSignal(entry)) {
        channels.push({ channel, signal: entry });
      } else if (type === 'object') {
        channels.push({ channel, field: entry });
      } else {
        channels.push({ channel, value: entry });
      }
    };

    for (const channel in encodings) {
      process(channel, encodings[channel]);
    }
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

  update() {
    this.plot.update(this);
    return this;
  }

  stats(data) {
    this._stats = data;
    return this;
  }

  data(data) {
    this._data = Array.from(data);
    return this;
  }

  filter() {
    return this.source?.options?.filterBy;
  }

  fields() {
    const { source, channels } = this;
    if (source == null) return [];
    const { table } = source;
    const columns = new Set;
    for (const { field } of channels) {
      if (field?.column) columns.add(field.column);
    }
    return Array.from(columns, col => column(table, col));
  }

  query(filter = []) {
    const { plot, channels, source, _stats: stats } = this;

    if (source == null || Array.isArray(source)) {
      return null;
    }

    plot.pending(this);

    const q = Query.from(source.table);
    const dims = [];
    let aggr = false;

    for (const c of channels) {
      if (c.channel === 'order') {
        q.orderby(c.value);
      } else if (Object.hasOwn(c, 'field')) {
        const { channel, field } = c;
        if (field.column && !stats.find(s => s.column === field.column)) {
          continue; // skip non-existent columns
        }
        const expr = field.transform?.(stats) || field;
        if (expr.aggregate) {
          aggr = true;
        } else {
          dims.push(channel);
        }
        q.select({ [channel]: expr });
      }
    }

    if (aggr) {
      q.groupby(dims);
    }

    return q.where(filter);
  }

  plotSpecs() {
    const { type, _data, channels } = this;
    const options = {};
    for (const c of channels) {
      options[c.channel] = Object.hasOwn(c, 'value') ? c.value : c.channel;
    }
    return [{ type, data: _data, options }];
  }
}
